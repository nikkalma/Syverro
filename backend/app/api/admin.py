from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.book import Book, UserBook
from app.schemas.user import UserResponse
import logging
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])

# ============================================================
# СХЕМЫ
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

class AdminAuthorResponse(BaseModel):
    id: str
    name: str
    photo: Optional[str] = None
    bio: Optional[str] = None
    country: Optional[str] = None
    birth_year: Optional[int] = None
    death_year: Optional[int] = None
    book_count: int = 0
    created_at: datetime
    updated_at: datetime

class AdminGenreResponse(BaseModel):
    id: str
    name: str
    slug: str
    book_count: int = 0
    created_at: datetime
    updated_at: datetime

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

class AdminStatsResponse(BaseModel):
    total_users: int
    total_books: int
    total_authors: int
    total_genres: int
    active_users: int
    new_users_24h: int
    new_books_24h: int
    users_by_role: dict

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
# ПРОВЕРКА ПРАВ (ТОЛЬКО АДМИНЫ)
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
    total_users = await db.scalar(select(func.count()).select_from(User))
    
    # Всего книг
    total_books = await db.scalar(select(func.count()).select_from(Book))
    
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

    return AdminStatsResponse(
        total_users=total_users or 0,
        total_books=total_books or 0,
        total_authors=0,  # TODO: добавить модель Author
        total_genres=0,   # TODO: добавить модель Genre
        active_users=active_users,
        new_users_24h=new_users_24h,
        new_books_24h=new_books_24h,
        users_by_role={},
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
        query = query.where(User.email.contains(search))
        count_query = count_query.where(User.email.contains(search))
    
    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)
    
    if is_active is not None:
        query = query.where(User.is_active == is_active)
        count_query = count_query.where(User.is_active == is_active)

    total = await db.scalar(count_query) or 0
    
    query = query.offset((page - 1) * limit).limit(limit)
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

@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    data: RoleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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
    # TODO: реализовать очистку сессий
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
        query = query.where(Book.title.contains(search))
        count_query = count_query.where(Book.title.contains(search))
    
    if genre:
        query = query.where(Book.genres.contains([genre]))
        count_query = count_query.where(Book.genres.contains([genre]))
    
    if is_published is not None:
        query = query.where(Book.is_published == is_published)
        count_query = count_query.where(Book.is_published == is_published)

    total = await db.scalar(count_query) or 0
    
    query = query.offset((page - 1) * limit).limit(limit)
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
            "created_by": None,
            "created_by_email": None,
        } for b in books],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total else 0,
    }

@router.post("/books")
async def create_book(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

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

    for key, value in data.items():
        if hasattr(book, key):
            setattr(book, key, value)
    
    await db.commit()
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
# 4. ЛОГИ
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

    # TODO: реализовать модель Log и хранилище логов
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
# 5. НАСТРОЙКИ
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
    
    for key, value in data.dict().items():
        if hasattr(settings_store, key):
            setattr(settings_store, key, value)
    
    return settings_store