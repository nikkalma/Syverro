from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.book import Book
from app.models.author import Author
from app.models.user_book import UserBook
from app.schemas.book import BookCreate, BookResponse, UserBookResponse
from uuid import UUID

router = APIRouter(prefix="/books", tags=["books"])


async def _find_or_create_author(db: AsyncSession, author_name: str) -> Author:
    """Find author by name (case-insensitive) or create new one."""
    result = await db.execute(
        select(Author).where(func.lower(Author.name) == author_name.strip().lower())
    )
    author = result.scalar_one_or_none()
    if not author:
        author = Author(name=author_name.strip())
        db.add(author)
        await db.flush()
    return author


def _book_to_response_dict(book: Book) -> dict:
    """Build BookResponse dict with author info from relationship."""
    author_name = None
    author_country = None
    author_bio = None
    author_id = None
    if book.author_ref:
        author_name = book.author_ref.name
        author_country = book.author_ref.country
        author_bio = book.author_ref.bio
        author_id = book.author_id
    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "author_id": author_id,
        "author_name": author_name,
        "author_country": author_country,
        "author_bio": author_bio,
        "cover": book.cover,
        "genres": book.genres or [],
        "description": book.description,
        "total_pages": book.total_pages,
        "created_at": book.created_at,
        "updated_at": book.updated_at,
    }

# ========== ГЛОБАЛЬНЫЙ КАТАЛОГ (ОПУБЛИКОВАННЫЕ КНИГИ) ==========
@router.get("/catalog/", response_model=list[BookResponse])
async def get_catalog(
    db: AsyncSession = Depends(get_db)
):
    """Опубликованные книги из глобального каталога (без авторизации)"""
    try:
        result = await db.execute(
            select(Book)
            .options(selectinload(Book.author_ref))
            .where(Book.is_published == True)
            .order_by(Book.created_at.desc())
        )
        books = result.scalars().all()
        return [_book_to_response_dict(b) for b in books]
    except Exception as e:
        print(f"Error: {e}")
        return []

# ========== МОИ КНИГИ (ТОЛЬКО ДОБАВЛЕННЫЕ ПОЛЬЗОВАТЕЛЕМ) ==========
@router.get("/", response_model=list[BookResponse])
async def get_user_books(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(Book)
            .options(selectinload(Book.author_ref))
            .join(UserBook)
            .where(UserBook.user_id == current_user.id)
        )
        books = result.scalars().all()
        return [_book_to_response_dict(b) for b in books]
    except Exception as e:
        print(f"Error: {e}")
        return []

# ========== ДОБАВИТЬ КНИГУ (СОЗДАЁТ СВЯЗЬ В USERBOOK) ==========
@router.post("/", response_model=BookResponse)
async def create_book(
    book_data: BookCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        existing = await db.execute(
            select(Book).where(
                Book.title == book_data.title,
                Book.author == book_data.author
            )
        )
        existing_book = existing.scalar_one_or_none()

        if existing_book:
            user_book_exists = await db.execute(
                select(UserBook).where(
                    UserBook.user_id == current_user.id,
                    UserBook.book_id == existing_book.id
                )
            )
            if not user_book_exists.scalar_one_or_none():
                user_book = UserBook(
                    user_id=current_user.id,
                    book_id=existing_book.id,
                    status="planned"
                )
                db.add(user_book)
                await db.commit()
            await db.refresh(existing_book, ["author_ref"])
            return _book_to_response_dict(existing_book)

        author = await _find_or_create_author(db, book_data.author)

        new_book = Book(
            title=book_data.title,
            author=book_data.author,
            author_id=author.id,
            cover=book_data.cover,
            genres=book_data.genres,
            description=book_data.description,
            total_pages=book_data.total_pages,
            created_by=current_user.id,
        )
        db.add(new_book)
        await db.flush()

        user_book = UserBook(
            user_id=current_user.id,
            book_id=new_book.id,
            status="planned"
        )
        db.add(user_book)

        await db.commit()
        await db.refresh(new_book, ["author_ref"])

        return _book_to_response_dict(new_book)
    except Exception as e:
        print(f"Error: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ========== МОИ КНИГИ СО СТАТУСАМИ (ДЛЯ ПРОФИЛЯ) ==========
@router.get("/user-books/", response_model=list[UserBookResponse])
async def get_user_books_with_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(UserBook).where(UserBook.user_id == current_user.id)
        )
        user_books = result.scalars().all()
        for ub in user_books:
            await db.refresh(ub, attribute_names=["book"])
            if ub.book:
                await db.refresh(ub.book, ["author_ref"])
        return user_books
    except Exception as e:
        print(f"Error: {e}")
        return []

# ========== ОБНОВИТЬ СТАТУС КНИГИ ==========
@router.put("/{book_id}/status")
async def update_book_status(
    book_id: UUID,
    status_value: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(UserBook).where(
            UserBook.user_id == current_user.id,
            UserBook.book_id == book_id
        )
    )
    user_book = result.scalar_one_or_none()

    if not user_book:
        raise HTTPException(status_code=404, detail="Book not found")

    user_book.status = status_value
    await db.commit()

    return {"message": "Status updated"}