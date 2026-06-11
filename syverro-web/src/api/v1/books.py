from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.book import Book, UserBook
from app.schemas.book import BookCreate, BookResponse, UserBookCreate, UserBookResponse
from uuid import UUID

router = APIRouter(prefix="/books", tags=["books"])


@router.get("/", response_model=list[BookResponse])
async def get_user_books(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить все книги пользователя"""
    # Получаем все книги, которые пользователь добавил в свою библиотеку
    result = await db.execute(
        select(Book).join(UserBook).where(UserBook.user_id == current_user.id)
    )
    books = result.scalars().all()
    return books


@router.post("/", response_model=BookResponse)
async def create_book(
    book_data: BookCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создать новую книгу в каталоге и добавить в библиотеку пользователя"""
    # Проверяем, существует ли уже такая книга
    existing = await db.execute(
        select(Book).where(
            Book.title == book_data.title,
            Book.author == book_data.author
        )
    )
    existing_book = existing.scalar_one_or_none()
    
    if existing_book:
        # Книга уже есть в каталоге, просто добавляем связь с пользователем
        user_book = UserBook(
            user_id=current_user.id,
            book_id=existing_book.id,
            status="planned"
        )
        db.add(user_book)
        await db.commit()
        return existing_book
    
    # Создаём новую книгу
    new_book = Book(**book_data.model_dump())
    db.add(new_book)
    await db.flush()  # Чтобы получить id новой книги
    
    # Добавляем связь с пользователем
    user_book = UserBook(
        user_id=current_user.id,
        book_id=new_book.id,
        status="planned"
    )
    db.add(user_book)
    
    await db.commit()
    await db.refresh(new_book)
    
    return new_book


@router.get("/user-books/", response_model=list[UserBookResponse])
async def get_user_books_with_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить все книги пользователя со статусами"""
    result = await db.execute(
        select(UserBook)
        .where(UserBook.user_id == current_user.id)
    )
    user_books = result.scalars().all()
    
    # Загружаем связанные книги
    for ub in user_books:
        await db.refresh(ub, attribute_names=["book"])
    
    return user_books


@router.put("/{book_id}/status")
async def update_book_status(
    book_id: UUID,
    status: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить статус книги у пользователя"""
    result = await db.execute(
        select(UserBook).where(
            UserBook.user_id == current_user.id,
            UserBook.book_id == book_id
        )
    )
    user_book = result.scalar_one_or_none()
    
    if not user_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found in user's library"
        )
    
    user_book.status = status
    await db.commit()
    
    return {"message": "Status updated"}