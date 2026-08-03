from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.deps import get_current_user, get_db
from app.core.author_service import find_or_create_author
from app.services.book_service import (
    compose_public_book_detail,
    get_book_authors_data, get_book_genre_ids, get_book_genre_objects,
    get_book_taxonomy_items, get_primary_author, link_author,
)
from app.services.book_slug import generate_unique_book_slug
from app.models.book_author import book_authors
from app.models.user import User
from app.models.book import Book
from app.models.author import Author
from app.models.user_book import UserBook
from app.models.genre import Genre
from app.models.book_genre import book_genres
from app.schemas.book import BookCreate, BookResponse, PublicBookDetailResponse, UserBookResponse
from uuid import UUID, uuid4
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/books", tags=["books"])


async def _book_to_response_dict(db: AsyncSession, book: Book) -> dict:
    """Build BookResponse dict with author info and genre objects."""
    primary = await get_primary_author(db, book)
    author_name = primary.name if primary else None
    author_country = primary.nationality if primary else None
    author_bio = primary.bio if primary else None
    author_id = primary.id if primary else None
    author_slug = primary.slug if primary else None

    genre_rows = await get_book_genre_objects(db, book)
    genre_objects = [{"id": str(g[0]), "name": g[1], "slug": g[2]} for g in genre_rows]
    genre_ids = [str(g[0]) for g in genre_rows]

    themes = await get_book_taxonomy_items(db, book, node_type="theme")
    motifs = await get_book_taxonomy_items(db, book, node_type="motif")

    return {
        "id": book.id,
        "slug": book.slug,
        "title": book.title,
        "author": book.author,
        "author_id": author_id,
        "publication_id": book.publication_id,
        "author_name": author_name,
        "author_country": author_country,
        "author_bio": author_bio,
        "author_slug": author_slug,
        "cover": book.cover,
        "genres": book.genres or [],
        "genre_ids": genre_ids,
        "genre_objects": genre_objects,
        "description": book.description,
        "total_pages": book.total_pages,
        "publication_type": book.publication_type or "official",
        "metadata_status": book.metadata_status or "incomplete",
        "moderation_status": book.moderation_status or "pending",
        "moderation_reason": book.moderation_reason,
        "themes": themes,
        "motifs": motifs,
        "created_at": book.created_at,
        "updated_at": book.updated_at,
    }

# ========== ГЛОБАЛЬНЫЙ КАТАЛОГ (ОПУБЛИКОВАННЫЕ КНИГИ) ==========
@router.get("/catalog/", response_model=list[BookResponse])
async def get_catalog(
    genre_id: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Опубликованные книги из глобального каталога (без авторизации)"""
    try:
        query = (
            select(Book)
            .options(selectinload(Book.authors))
            .where(Book.is_published == True, Book.moderation_status == "approved")
        )
        if genre_id:
            query = query.join(book_genres, book_genres.c.book_id == Book.id).where(
                book_genres.c.genre_id == genre_id
            )
        result = await db.execute(query.order_by(Book.created_at.desc()))
        books = result.scalars().all()
        return [await _book_to_response_dict(db, b) for b in books]
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
            .options(selectinload(Book.authors))
            .join(UserBook)
            .where(UserBook.user_id == current_user.id)
        )
        books = result.scalars().all()
        return [await _book_to_response_dict(db, b) for b in books]
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
                logger.info(f"📚 UserBook created for existing book {existing_book.id} by user {current_user.id}")
            return await _book_to_response_dict(db, existing_book)

        author = await find_or_create_author(db, book_data.author)

        new_book = Book(
            id=uuid4(),
            title=book_data.title,
            author=book_data.author,
            author_id=author.id,
            cover=book_data.cover,
            genres=book_data.genres,
            description=book_data.description,
            total_pages=book_data.total_pages,
            publication_type=book_data.publication_type or "official",
            metadata_status="draft",
            moderation_status="pending",
            is_published=False,
            created_by=current_user.id,
        )
        new_book.slug = await generate_unique_book_slug(
            db, new_book.original_title or new_book.title, book_id=new_book.id
        )
        db.add(new_book)
        await db.flush()

        await link_author(db, new_book, author)

        user_book = UserBook(
            user_id=current_user.id,
            book_id=new_book.id,
            status="planned"
        )
        db.add(user_book)

        await db.commit()
        await db.refresh(new_book, ["authors"])

        logger.info(f"✅ Book created: {new_book.id} '{new_book.title}' by user {current_user.id} — moderation_status=pending, is_published=False")

        return await _book_to_response_dict(db, new_book)
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
        return user_books
    except Exception as e:
        print(f"Error: {e}")
        return []


@router.get("/{slug_or_id}", response_model=PublicBookDetailResponse)
async def get_public_book_detail(
    slug_or_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Book).where(Book.slug == slug_or_id))
    book = result.scalar_one_or_none()
    if book is None:
        try:
            book_uuid = UUID(slug_or_id)
        except ValueError:
            book_uuid = None
        if book_uuid is not None:
            result = await db.execute(select(Book).where(Book.id == book_uuid))
            book = result.scalar_one_or_none()
    if book is not None and not (book.is_published and book.moderation_status == "approved"):
        book = None
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return await compose_public_book_detail(db, book)

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
