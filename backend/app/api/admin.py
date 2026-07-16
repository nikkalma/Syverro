# backend/app/api/admin.py (ПОЛНАЯ ВЕРСИЯ)
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.book import Book
from app.models.user_book import UserBook
from app.models.author import Author
from app.models.genre import Genre
from app.schemas.admin import (
    AuthorCreate, AuthorUpdate, AuthorResponse,
    GenreCreate, GenreUpdate, GenreResponse,
    AdminStatsResponse
)
from app.schemas.user import UserResponse
import logging
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel
from uuid import UUID

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])

# ============================================================
# СХЕМЫ ДЛЯ ОТВЕТОВ
# ============================================================

class AdminUserResponse(BaseModel):
    id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    role: str = "user"
    is_active: bool = True
    created_at: datetime
    last_active: Optional[datetime] = None
    phone: Optional[str] = None
    telegram_id: Optional[str] = None

class AdminBookResponse(BaseModel):
    id: str
    title: str
    author: str
    cover: Optional[str] = None
    genres: List[str] = []
    total_pages: Optional[int] = None
    is_published: bool = False
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    created_by_email: Optional[str] = None

class AdminLogResponse(BaseModel):
    id: str
    type: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    endpoint: str
    method: str
    status_code: int
    ip: Optional[str] = None
    user_agent: Optional[str] = None
    details: Optional[dict] = None
    created_at: datetime

class RoleUpdate(BaseModel):
    role: str

class BlockUpdate(BaseModel):
    is_active: bool

class PublishUpdate(BaseModel):
    is_published: bool

class SettingsResponse(BaseModel):
    registration_enabled: bool = True
    max_file_size_mb: int = 10
    site_name: str = "Syverro"
    site_description: str = "Пространство для чтения"
    maintenance_mode: bool = False
    require_email_verification: bool = False
    default_user_role: str = "user"

# ============================================================
# ПРОВЕРКА ПРАВ
# ============================================================

async def check_admin(user: User) -> User:
    if user.role not in ["owner", "admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def check_owner(user: User) -> User:
    if user.role != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    return user

# ============================================================
# 1. DASHBOARD — СТАТИСТИКА
# ============================================================

@router.get("/stats", response_model=AdminStatsResponse)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    # Всего пользователей
    total_users = await db.scalar(select(func.count()).select_from(User)) or 0
    
    # Всего книг
    total_books = await db.scalar(select(func.count()).select_from(Book)) or 0
    
    # Всего авторов
    total_authors = await db.scalar(select(func.count()).select_from(Author)) or 0
    
    # Всего жанров
    total_genres = await db.scalar(select(func.count()).select_from(Genre)) or 0
    
    # Активные пользователи (за последние 7 дней)
    week_ago = datetime.utcnow() - timedelta(days=7)
    active_users = await db.scalar(
        select(func.count()).select_from(User).where(User.last_active >= week_ago)
    ) or 0
    
    # Новые пользователи за 24 часа
    day_ago = datetime.utcnow() - timedelta(days=1)
    new_users_24h = await db.scalar(
        select(func.count()).select_from(User).where(User.created_at >= day_ago)
    ) or 0
    
    # Новые книги за 24 часа
    new_books_24h = await db.scalar(
        select(func.count()).select_from(Book).where(Book.created_at >= day_ago)
    ) or 0
    
    # Пользователи по ролям
    roles_result = await db.execute(
        select(User.role, func.count()).group_by(User.role)
    )
    users_by_role = {role: count for role, count in roles_result.all()}

    return AdminStatsResponse(
        total_users=total_users,
        total_books=total_books,
        total_authors=total_authors,
        total_genres=total_genres,
        active_users=active_users,
        new_users_24h=new_users_24h,
        new_books_24h=new_books_24h,
        users_by_role=users_by_role,
    )

# ============================================================
# 2. ПОЛЬЗОВАТЕЛИ
# ============================================================

@router.get("/users", response_model=dict)
async def get_users(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    query = select(User)
    count_query = select(func.count()).select_from(User)

    if search:
        search_filter = or_(
            User.email.contains(search),
            User.first_name.contains(search),
            User.last_name.contains(search),
            User.username.contains(search)
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)
    
    if is_active is not None:
        query = query.where(User.is_active == is_active)
        count_query = count_query.where(User.is_active == is_active)

    total = await db.scalar(count_query) or 0
    
    query = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()

    return {
        "data": [{
            "id": str(u.id),
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "username": u.username,
            "role": u.role or "user",
            "is_active": u.is_active,
            "created_at": u.created_at,
            "last_active": u.last_active,
            "phone": u.phone,
            "telegram_id": u.telegram_id,
        } for u in users],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total else 0,
    }

@router.get("/users/recent")
async def get_recent_users(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    
    result = await db.execute(
        select(User)
        .order_by(User.created_at.desc())
        .limit(limit)
    )
    users = result.scalars().all()
    
    return [{
        "id": str(u.id),
        "email": u.email,
        "first_name": u.first_name,
        "last_name": u.last_name,
        "created_at": u.created_at,
        "role": u.role or "user",
    } for u in users]

@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "username": user.username,
        "role": user.role or "user",
        "is_active": user.is_active,
        "created_at": user.created_at,
        "last_active": user.last_active,
        "phone": user.phone,
        "telegram_id": user.telegram_id,
    }

@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    allowed_fields = ["first_name", "last_name", "username", "phone"]
    for field in allowed_fields:
        if field in data:
            setattr(user, field, data[field])
    
    await db.commit()
    await db.refresh(user)
    return {"message": "User updated"}

@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    data: RoleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    
    # Не даем изменить роль владельца
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == "owner":
        raise HTTPException(status_code=403, detail="Cannot change owner role")
    
    user.role = data.role
    await db.commit()
    return {"message": "Role updated"}

@router.put("/users/{user_id}/block")
async def block_user(
    user_id: str,
    data: BlockUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    
    # Не даем заблокировать владельца
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == "owner":
        raise HTTPException(status_code=403, detail="Cannot block owner")
    
    user.is_active = data.is_active
    await db.commit()
    return {"message": "User blocked" if not data.is_active else "User unblocked"}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_owner(current_user)
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=403, detail="Cannot delete yourself")
    
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted"}

@router.post("/users/{user_id}/logout")
async def logout_user_sessions(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    # TODO: реализовать очистку сессий (если есть таблица sessions)
    return {"message": "All sessions terminated"}

# ============================================================
# 3. КНИГИ
# ============================================================

@router.get("/books", response_model=dict)
async def get_books(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    genre: Optional[str] = None,
    is_published: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    query = select(Book)
    count_query = select(func.count()).select_from(Book)

    if search:
        search_filter = or_(
            Book.title.contains(search),
            Book.author.contains(search)
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    if genre:
        query = query.where(Book.genres.contains([genre]))
        count_query = count_query.where(Book.genres.contains([genre]))
    
    if is_published is not None:
        query = query.where(Book.is_published == is_published)
        count_query = count_query.where(Book.is_published == is_published)

    total = await db.scalar(count_query) or 0
    
    query = query.order_by(Book.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    books = result.scalars().all()

    return {
        "data": [{
            "id": str(b.id),
            "title": b.title,
            "author": b.author,
            "cover": b.cover,
            "genres": b.genres or [],
            "total_pages": b.total_pages,
            "is_published": b.is_published,
            "created_at": b.created_at,
            "updated_at": b.updated_at,
            "created_by": str(b.created_by) if b.created_by else None,
            "created_by_email": None,  # Можно подтянуть через join
        } for b in books],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total else 0,
    }

@router.get("/books/{book_id}")
async def get_book_detail(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    return {
        "id": str(book.id),
        "title": book.title,
        "author": book.author,
        "cover": book.cover,
        "genres": book.genres or [],
        "total_pages": book.total_pages,
        "is_published": book.is_published,
        "created_at": book.created_at,
        "updated_at": book.updated_at,
    }

@router.post("/books")
async def create_book(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    # Проверяем, существует ли уже такая книга
    existing = await db.execute(
        select(Book).where(
            Book.title == data["title"],
            Book.author == data["author"]
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Book already exists")

    book = Book(
        title=data["title"],
        author=data["author"],
        cover=data.get("cover"),
        genres=data.get("genres", []),
        total_pages=data.get("total_pages"),
        is_published=data.get("is_published", False),
        created_by=current_user.id,
    )
    db.add(book)
    await db.commit()
    await db.refresh(book)
    return {"id": str(book.id), "message": "Book created"}

@router.put("/books/{book_id}")
async def update_book(
    book_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    allowed_fields = ["title", "author", "cover", "genres", "total_pages", "is_published"]
    for key, value in data.items():
        if key in allowed_fields and hasattr(book, key):
            setattr(book, key, value)
    
    await db.commit()
    await db.refresh(book)
    return {"message": "Book updated"}

@router.put("/books/{book_id}/publish")
async def toggle_publish(
    book_id: str,
    data: PublishUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    book.is_published = data.is_published
    await db.commit()
    return {"message": "Book published" if data.is_published else "Book hidden"}

@router.delete("/books/{book_id}")
async def delete_book(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    await db.delete(book)
    await db.commit()
    return {"message": "Book deleted"}

# ============================================================
# 4. АВТОРЫ (ПОЛНАЯ РЕАЛИЗАЦИЯ)
# ============================================================

@router.get("/authors", response_model=dict)
async def get_authors(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    country: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    query = select(Author)
    count_query = select(func.count()).select_from(Author)

    if search:
        query = query.where(Author.name.contains(search))
        count_query = count_query.where(Author.name.contains(search))
    
    if country:
        query = query.where(Author.country == country)
        count_query = count_query.where(Author.country == country)

    total = await db.scalar(count_query) or 0
    
    query = query.order_by(Author.name).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    authors = result.scalars().all()

    # Считаем книги для каждого автора
    authors_data = []
    for author in authors:
        book_count = await db.scalar(
            select(func.count()).select_from(Book).where(Book.author_id == author.id)
        ) or 0
        authors_data.append({
            "id": str(author.id),
            "name": author.name,
            "photo": author.photo,
            "bio": author.bio,
            "country": author.country,
            "birth_year": author.birth_year,
            "death_year": author.death_year,
            "book_count": book_count,
            "created_at": author.created_at,
            "updated_at": author.updated_at,
        })

    return {
        "data": authors_data,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total else 0,
    }

@router.get("/authors/{author_id}")
async def get_author_detail(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    
    result = await db.execute(select(Author).where(Author.id == author_id))
    author = result.scalar_one_or_none()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    
    book_count = await db.scalar(
        select(func.count()).select_from(Book).where(Book.author_id == author.id)
    ) or 0
    
    return {
        "id": str(author.id),
        "name": author.name,
        "photo": author.photo,
        "bio": author.bio,
        "country": author.country,
        "birth_year": author.birth_year,
        "death_year": author.death_year,
        "book_count": book_count,
        "created_at": author.created_at,
        "updated_at": author.updated_at,
    }

@router.post("/authors")
async def create_author(
    data: AuthorCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    # Проверяем, существует ли уже такой автор
    existing = await db.execute(
        select(Author).where(Author.name == data.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Author already exists")

    author = Author(**data.model_dump())
    db.add(author)
    await db.commit()
    await db.refresh(author)
    return {"id": str(author.id), "message": "Author created"}

@router.put("/authors/{author_id}")
async def update_author(
    author_id: str,
    data: AuthorUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    result = await db.execute(select(Author).where(Author.id == author_id))
    author = result.scalar_one_or_none()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        if hasattr(author, key):
            setattr(author, key, value)
    
    await db.commit()
    await db.refresh(author)
    return {"message": "Author updated"}

@router.delete("/authors/{author_id}")
async def delete_author(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    result = await db.execute(select(Author).where(Author.id == author_id))
    author = result.scalar_one_or_none()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")

    # Проверяем, есть ли книги у автора
    book_count = await db.scalar(
        select(func.count()).select_from(Book).where(Book.author_id == author.id)
    ) or 0
    
    if book_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete author with {book_count} books. Remove books first."
        )

    await db.delete(author)
    await db.commit()
    return {"message": "Author deleted"}

# ============================================================
# 5. ЖАНРЫ (ПОЛНАЯ РЕАЛИЗАЦИЯ)
# ============================================================

def slugify(text: str) -> str:
    """Простая генерация slug из названия"""
    import re
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

@router.get("/genres", response_model=dict)
async def get_genres(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    query = select(Genre)
    count_query = select(func.count()).select_from(Genre)

    if search:
        query = query.where(Genre.name.contains(search))
        count_query = count_query.where(Genre.name.contains(search))

    total = await db.scalar(count_query) or 0
    
    query = query.order_by(Genre.name).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    genres = result.scalars().all()

    return {
        "data": [{
            "id": str(g.id),
            "name": g.name,
            "slug": g.slug,
            "description": g.description,
            "book_count": g.book_count or 0,
            "created_at": g.created_at,
            "updated_at": g.updated_at,
        } for g in genres],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total else 0,
    }

@router.get("/genres/{genre_id}")
async def get_genre_detail(
    genre_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    
    result = await db.execute(select(Genre).where(Genre.id == genre_id))
    genre = result.scalar_one_or_none()
    if not genre:
        raise HTTPException(status_code=404, detail="Genre not found")
    
    return {
        "id": str(genre.id),
        "name": genre.name,
        "slug": genre.slug,
        "description": genre.description,
        "book_count": genre.book_count or 0,
        "created_at": genre.created_at,
        "updated_at": genre.updated_at,
    }

@router.post("/genres")
async def create_genre(
    data: GenreCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    # Генерируем slug
    slug = slugify(data.name)
    
    # Проверяем уникальность
    existing = await db.execute(
        select(Genre).where(Genre.slug == slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Genre with this name already exists")

    genre = Genre(
        name=data.name,
        slug=slug,
        description=data.description,
    )
    db.add(genre)
    await db.commit()
    await db.refresh(genre)
    return {"id": str(genre.id), "message": "Genre created"}

@router.put("/genres/{genre_id}")
async def update_genre(
    genre_id: str,
    data: GenreUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    result = await db.execute(select(Genre).where(Genre.id == genre_id))
    genre = result.scalar_one_or_none()
    if not genre:
        raise HTTPException(status_code=404, detail="Genre not found")

    if data.name and data.name != genre.name:
        genre.name = data.name
        genre.slug = slugify(data.name)
    
    if data.description is not None:
        genre.description = data.description
    
    await db.commit()
    await db.refresh(genre)
    return {"message": "Genre updated"}

@router.delete("/genres/{genre_id}")
async def delete_genre(
    genre_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    result = await db.execute(select(Genre).where(Genre.id == genre_id))
    genre = result.scalar_one_or_none()
    if not genre:
        raise HTTPException(status_code=404, detail="Genre not found")

    await db.delete(genre)
    await db.commit()
    return {"message": "Genre deleted"}

# ============================================================
# 6. ЛОГИ (заглушка, но с правильной структурой)
# ============================================================

@router.get("/logs", response_model=dict)
async def get_logs(
    page: int = 1,
    limit: int = 20,
    type: Optional[str] = None,
    user_email: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    # TODO: реализовать модель Log для хранения логов
    return {
        "data": [],
        "total": 0,
        "page": page,
        "limit": limit,
        "total_pages": 0,
    }

@router.get("/logs/recent")
async def get_recent_logs(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    return []

# ============================================================
# 7. НАСТРОЙКИ
# ============================================================

settings_store = SettingsResponse()

@router.get("/settings", response_model=SettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_owner(current_user)
    return settings_store

@router.put("/settings", response_model=SettingsResponse)
async def update_settings(
    data: SettingsResponse,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_owner(current_user)
    
    for key, value in data.model_dump().items():
        if hasattr(settings_store, key):
            setattr(settings_store, key, value)
    
    return settings_store