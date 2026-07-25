# backend/app/api/admin.py (ПОЛНАЯ ВЕРСИЯ)
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, delete
from sqlalchemy.orm import selectinload
from app.core.deps import get_current_user, get_db
from app.core.metadata import calculate_missing_fields, get_metadata_status
from app.core.author_service import find_or_create_author
from app.services.book_service import (
    get_author_book_count, get_book_authors, get_book_authors_data,
    get_book_genre_ids, get_book_genre_objects,
    get_book_taxonomy_items, get_primary_author,
    link_author, sync_book_genres, unlink_author,
)
from app.services.metadata_service import recalculate_metadata_status
from app.models.user import User
from app.models.book import Book
from app.models.user_book import UserBook
from app.models.author import Author
from app.models.author_award import AuthorAward
from app.models.genre import Genre
from app.models.book_genre import book_genres
from app.models.book_author import book_authors
from app.schemas.admin import (
    AuthorCreate, AuthorUpdate, AuthorResponse,
    GenreCreate, GenreUpdate, GenreResponse,
    AdminStatsResponse, AdminBookEnrichment
)
from app.schemas.author import AuthorAwardCreate, AuthorAwardResponse
from app.schemas.user import UserResponse
import logging
import re
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
    author_id: Optional[str] = None
    cover: Optional[str] = None
    genres: List[str] = []
    genre_ids: List[str] = []
    genre_objects: list = []
    description: Optional[str] = None
    total_pages: Optional[int] = None
    publication_type: str = "official"
    metadata_status: str = "draft"
    is_published: bool = False
    moderation_status: str = "pending"
    moderation_reason: Optional[str] = None
    moderated_by: Optional[str] = None
    moderated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    created_by_email: Optional[str] = None
    # Enrichment fields
    subtitle: Optional[str] = None
    original_title: Optional[str] = None
    original_language: Optional[str] = None
    country_of_origin: Optional[str] = None
    original_publication_year: Optional[int] = None
    series_name: Optional[str] = None
    series_position: Optional[int] = None
    themes: List[str] = []
    motifs: List[str] = []
    missing_fields: List[str] = []
    authors: List[dict] = []

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
            User.phone.contains(search),
            User.first_name.contains(search),
            User.last_name.contains(search),
            User.username.contains(search),
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
        "username": u.username,
        "telegram_id": u.telegram_id,
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
        genre_result = await db.execute(
            select(Genre.id).where(Genre.name == genre).limit(1)
        )
        genre_row = genre_result.one_or_none()
        if genre_row:
            gid = genre_row[0]
            query = query.where(Book.id.in_(
                select(book_genres.c.book_id).where(book_genres.c.genre_id == gid)
            ))
            count_query = count_query.where(Book.id.in_(
                select(book_genres.c.book_id).where(book_genres.c.genre_id == gid)
            ))
    
    if is_published is not None:
        query = query.where(Book.is_published == is_published)
        count_query = count_query.where(Book.is_published == is_published)

    total = await db.scalar(count_query) or 0
    
    query = query.order_by(Book.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    books = result.scalars().all()

    book_data = []
    for b in books:
        book_data.append(await _build_book_dict(db, b))

    return {
        "data": book_data,
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
    
    return await _build_book_dict(db, book, include_missing=True)

async def _sync_book_genres(db: AsyncSession, book: Book, genre_ids: list):
    """Replace book's genre relations with the given list of genre UUIDs."""
    await sync_book_genres(db, book, genre_ids)


async def _build_book_dict(db: AsyncSession, book: Book, include_missing: bool = False) -> dict:
    """Build a full book response dict with linked authors and optional missing_fields."""
    authors = await get_book_authors_data(db, book)
    author_count = len(authors)

    genre_rows = await get_book_genre_objects(db, book)
    genre_ids = [str(g[0]) for g in genre_rows]
    genre_objects = [{"id": str(g[0]), "name": g[1], "slug": g[2]} for g in genre_rows]

    missing = []
    if include_missing and book.metadata_status != "complete":
        missing = calculate_missing_fields(book, author_count=author_count, genre_count=len(genre_ids))

    themes = await get_book_taxonomy_items(db, book, node_type="theme")
    motifs = await get_book_taxonomy_items(db, book, node_type="motif")

    return {
        "id": str(book.id),
        "title": book.title,
        "author": book.author,
        "author_id": str(book.author_id) if book.author_id else None,
        "cover": book.cover,
        "genres": book.genres or [],
        "genre_ids": genre_ids,
        "genre_objects": genre_objects,
        "description": book.description,
        "total_pages": book.total_pages,
        "publication_type": book.publication_type or "official",
        "metadata_status": book.metadata_status or "draft",
        "is_published": book.is_published,
        "moderation_status": book.moderation_status or "pending",
        "moderation_reason": book.moderation_reason,
        "moderated_by": str(book.moderated_by) if book.moderated_by else None,
        "moderated_at": book.moderated_at,
        "created_at": book.created_at,
        "updated_at": book.updated_at,
        "subtitle": book.subtitle,
        "original_title": book.original_title,
        "original_language": book.original_language,
        "country_of_origin": book.country_of_origin,
        "original_publication_year": book.original_publication_year,
        "series_name": book.series_name,
        "series_position": book.series_position,
        "themes": themes,
        "motifs": motifs,
        "missing_fields": missing,
        "authors": authors,
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

    author = await find_or_create_author(db, data["author"])

    book = Book(
        title=data["title"],
        author=data["author"],
        author_id=author.id,
        cover=data.get("cover"),
        genres=data.get("genres", []),
        description=data.get("description"),
        total_pages=data.get("total_pages"),
        publication_type=data.get("publication_type", "official"),
        metadata_status="draft",
        moderation_status="pending",
        is_published=data.get("is_published", False),
        created_by=current_user.id,
    )
    db.add(book)
    await db.flush()

    # Link author via M:N (also syncs cache fields)
    await link_author(db, book, author)

    # Sync genre_ids if provided
    genre_ids = data.get("genre_ids", [])
    if genre_ids:
        await _sync_book_genres(db, book, genre_ids)

    await recalculate_metadata_status(db, book)
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

    # Handle author: explicit author_id wins, else find-or-create from author name
    if "author_id" in data and data["author_id"]:
        author_uuid = UUID(data["author_id"]) if isinstance(data["author_id"], str) else data["author_id"]
        author = await db.get(Author, author_uuid)
        if author:
            await link_author(db, book, author)
    elif "author" in data and data["author"] and data["author"] != book.author:
        author = await find_or_create_author(db, data["author"])
        await link_author(db, book, author)

    # Moderators can only edit basic fields; admins/owners can edit everything
    moderator_fields = ["title", "author", "cover", "genres", "description", "publication_type"]
    admin_fields = moderator_fields + ["author_id", "total_pages", "is_published", "metadata_status"]
    allowed_fields = moderator_fields if current_user.role == "moderator" else admin_fields

    for key, value in data.items():
        if key in allowed_fields and key != "genre_ids" and hasattr(book, key):
            setattr(book, key, value)

    # Handle genre_ids separately
    if "genre_ids" in data:
        await _sync_book_genres(db, book, data["genre_ids"] or [])

    await recalculate_metadata_status(db, book)
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

    if data.is_published and book.moderation_status != "approved":
        raise HTTPException(
            status_code=400,
            detail="Cannot publish a book that has not been approved by moderation"
        )

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
# 4. МОДЕРАЦИЯ КНИГ
# ============================================================

class ModerationAction(BaseModel):
    reason: Optional[str] = None

@router.get("/moderation/books", response_model=dict)
async def get_moderation_books(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    query = select(Book)
    count_query = select(func.count()).select_from(Book)

    if status and status != "all":
        query = query.where(Book.moderation_status == status)
        count_query = count_query.where(Book.moderation_status == status)
    # else: no moderation_status filter applied, show all books

    if search:
        search_filter = or_(
            Book.title.contains(search),
            Book.author.contains(search)
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total = await db.scalar(count_query) or 0

    query = query.order_by(Book.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    books = result.scalars().all()

    book_data = []
    for b in books:
        bd = await _build_book_dict(db, b, include_missing=True)
        # Add creator_email
        creator_email = None
        if b.created_by:
            creator = await db.execute(select(User).where(User.id == b.created_by))
            creator_user = creator.scalar_one_or_none()
            if creator_user:
                creator_email = creator_user.email
        bd["created_by"] = str(b.created_by) if b.created_by else None
        bd["created_by_email"] = creator_email
        book_data.append(bd)

    return {
        "data": book_data,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total else 0,
    }

@router.get("/moderation/books/{book_id}")
async def get_moderation_book_detail(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    bd = await _build_book_dict(db, book, include_missing=True)

    creator_email = None
    if book.created_by:
        creator = await db.execute(select(User).where(User.id == book.created_by))
        creator_user = creator.scalar_one_or_none()
        if creator_user:
            creator_email = creator_user.email
    bd["created_by"] = str(book.created_by) if book.created_by else None
    bd["created_by_email"] = creator_email

    return bd

@router.post("/moderation/books/{book_id}/approve")
async def approve_book(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    book.moderation_status = "approved"
    book.moderation_reason = None
    book.moderated_by = current_user.id
    book.moderated_at = datetime.utcnow()
    book.is_published = True

    await db.commit()
    logger.info(f"✅ Book APPROVED: {book.id} '{book.title}' by moderator {current_user.id} — now visible in Global Library")
    return {"message": "Book approved and published"}

@router.post("/moderation/books/{book_id}/reject")
async def reject_book(
    book_id: str,
    data: ModerationAction,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    book.moderation_status = "rejected"
    book.moderation_reason = data.reason
    book.moderated_by = current_user.id
    book.moderated_at = datetime.utcnow()
    book.is_published = False

    await db.commit()
    logger.info(f"❌ Book REJECTED: {book.id} '{book.title}' by moderator {current_user.id} — reason: {data.reason}")
    return {"message": "Book rejected"}

@router.post("/moderation/books/{book_id}/personal-only")
async def set_personal_only(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if book.publication_type != "unofficial":
        raise HTTPException(status_code=400, detail="Personal only is only available for unofficial works")

    book.moderation_status = "approved"
    book.moderation_reason = None
    book.moderated_by = current_user.id
    book.moderated_at = datetime.utcnow()
    book.is_published = False

    await db.commit()
    logger.info(f"🔒 Book set to PERSONAL-ONLY: {book.id} '{book.title}' — not in Global Library, only for owner")
    return {"message": "Book set to personal only — available for owner, not in Global Library"}

# ============================================================
# 4b. METADATA QUEUE (enrichment workflow)
# ============================================================

@router.get("/metadata/books", response_model=dict)
async def get_metadata_books(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin metadata queue — shows books requiring enrichment."""
    await check_admin(current_user)

    query = select(Book)
    count_query = select(func.count()).select_from(Book)

    # Only show approved books
    query = query.where(Book.moderation_status == "approved")
    count_query = count_query.where(Book.moderation_status == "approved")

    if status:
        query = query.where(Book.metadata_status == status)
        count_query = count_query.where(Book.metadata_status == status)
    else:
        query = query.where(Book.metadata_status != "complete")
        count_query = count_query.where(Book.metadata_status != "complete")

    if search:
        search_filter = or_(
            Book.title.contains(search),
            Book.author.contains(search)
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total = await db.scalar(count_query) or 0

    query = query.order_by(Book.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    books = result.scalars().all()

    book_data = []
    for b in books:
        book_data.append(await _build_book_dict(db, b, include_missing=True))

    return {
        "data": book_data,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total else 0,
    }


@router.get("/metadata/books/{book_id}")
async def get_metadata_book_detail(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get full enrichment detail for a book."""
    await check_admin(current_user)

    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    return await _build_book_dict(db, book, include_missing=True)


@router.put("/metadata/books/{book_id}")
async def update_metadata_book(
    book_id: str,
    data: AdminBookEnrichment,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Enrich book metadata (admin only). Author management uses /admin/books/{id}/authors endpoints."""
    if current_user.role == "moderator":
        raise HTTPException(status_code=403, detail="Moderators cannot enrich metadata")

    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    book_fields = ["subtitle", "original_title", "description", "cover",
                   "original_language", "country_of_origin", "original_publication_year",
                   "series_name", "series_position"]
    for field in book_fields:
        val = getattr(data, field, None)
        if val is not None:
            setattr(book, field, val)

    if hasattr(data, 'genre_ids') and data.genre_ids is not None:
        await _sync_book_genres(db, book, data.genre_ids)

    await recalculate_metadata_status(db, book)

    await db.commit()
    await db.refresh(book)

    bd = await _build_book_dict(db, book, include_missing=True)
    return bd


@router.put("/metadata/books/{book_id}/status")
async def set_metadata_status(
    book_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Manually set metadata_status (admin/owner only)."""
    await check_admin(current_user)

    new_status = data.get("status")
    if new_status not in ("draft", "incomplete", "review_ready", "complete"):
        raise HTTPException(status_code=400, detail="Invalid metadata_status")

    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    book.metadata_status = new_status
    await db.commit()
    return {"message": f"Metadata status set to {new_status}"}


# ============================================================
# 5. АВТОРЫ (ПОЛНАЯ РЕАЛИЗАЦИЯ)
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
        query = query.where(Author.nationality == country)
        count_query = count_query.where(Author.nationality == country)

    total = await db.scalar(count_query) or 0
    
    query = query.order_by(Author.name).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    authors = result.scalars().all()

    # Считаем книги для каждого автора (via M:N book_authors)
    authors_data = []
    for author in authors:
        book_count = await get_author_book_count(db, author.id)
        authors_data.append({
            "id": str(author.id),
            "name": author.name,
            "first_name": author.first_name,
            "middle_name": author.middle_name,
            "last_name": author.last_name,
            "native_name": author.native_name,
            "sort_name": author.sort_name,
            "display_name": author.display_name,
            "display_name_mode": author.display_name_mode,
            "pen_names": author.pen_names or [],
            "birth_name": author.birth_name,
            "slug": author.slug,
            "search_aliases": author.search_aliases,
            "pseudonyms": author.pseudonyms or [],
            "nationality": author.nationality,
            "country": author.nationality,  # backward-compat: frontend expects "country"
            "languages": author.languages or [],
            "gender": author.gender or "unknown",
            "official_website": author.official_website,
            "wikipedia_url": author.wikipedia_url,
            "bio": author.bio,
            "birth_year": author.birth_year,
            "death_year": author.death_year,
            "birth_date": author.birth_date,
            "death_date": author.death_date,
            "birth_place": author.birth_place,
            "death_place": author.death_place,
            "occupations": author.occupations or [],
            "literary_movements": author.literary_movements or [],
            "active_from_year": author.active_from_year,
            "active_to_year": author.active_to_year,
            "notable_works": author.notable_works or [],
            "genres": author.genres or [],
            "writing_languages": author.writing_languages or [],
            "photo": author.photo,
            "gallery": author.gallery or [],
            "signature_image": author.signature_image,
            "portrait_caption": author.portrait_caption,
            "creation_type": author.creation_type or "individual_author",
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
    
    book_count = await get_author_book_count(db, author.id)

    # Load awards
    awards_result = await db.execute(
        select(AuthorAward).where(AuthorAward.author_id == author.id).order_by(AuthorAward.year)
    )
    awards = awards_result.scalars().all()
    
    return {
        "id": str(author.id),
        "name": author.name,
        "first_name": author.first_name,
        "middle_name": author.middle_name,
        "last_name": author.last_name,
        "native_name": author.native_name,
        "sort_name": author.sort_name,
        "display_name": author.display_name,
        "display_name_mode": author.display_name_mode,
        "pen_names": author.pen_names or [],
        "birth_name": author.birth_name,
        "slug": author.slug,
        "search_aliases": author.search_aliases,
        "pseudonyms": author.pseudonyms or [],
        "nationality": author.nationality,
        "country": author.nationality,  # backward-compat
        "languages": author.languages or [],
        "gender": author.gender or "unknown",
        "official_website": author.official_website,
        "wikipedia_url": author.wikipedia_url,
        "bio": author.bio,
        "birth_year": author.birth_year,
        "death_year": author.death_year,
        "birth_date": author.birth_date,
        "death_date": author.death_date,
        "birth_place": author.birth_place,
        "death_place": author.death_place,
        "occupations": author.occupations or [],
        "literary_movements": author.literary_movements or [],
        "active_from_year": author.active_from_year,
        "active_to_year": author.active_to_year,
        "notable_works": author.notable_works or [],
        "genres": author.genres or [],
        "writing_languages": author.writing_languages or [],
        "photo": author.photo,
        "gallery": author.gallery or [],
        "signature_image": author.signature_image,
        "portrait_caption": author.portrait_caption,
        "creation_type": author.creation_type or "individual_author",
        "book_count": book_count,
        "awards": [{
            "id": str(a.id),
            "author_id": str(a.author_id),
            "name": a.name,
            "year": a.year,
            "organization": a.organization,
            "work": a.work,
            "created_at": a.created_at,
        } for a in awards],
        "created_at": author.created_at,
        "updated_at": author.updated_at,
    }

def validate_author_slug(slug: Optional[str]) -> None:
    if slug:
        slug = slug.strip().lower()
        if not re.match(r'^[a-z0-9][a-z0-9-]*[a-z0-9]$', slug) and not re.match(r'^[a-z0-9]$', slug):
            raise HTTPException(status_code=422, detail="Slug must be lowercase, URL-safe, and non-empty")


def _make_slug(name: str) -> str:
    import re as _re
    slug = _re.sub(r'[^\w\s-]', '', name.lower())
    slug = _re.sub(r'[-\s]+', '-', slug).strip('-')
    return slug or 'unknown'


def validate_author_dates(birth_date: Optional[str], death_date: Optional[str]) -> None:
    if birth_date:
        try:
            bd = datetime.strptime(birth_date[:10], "%Y-%m-%d")
            if bd > datetime.utcnow():
                raise HTTPException(status_code=422, detail="Birth date cannot be in the future")
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid birth_date format, expected YYYY-MM-DD")
    if death_date:
        try:
            dd = datetime.strptime(death_date[:10], "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid death_date format, expected YYYY-MM-DD")
    if birth_date and death_date:
        try:
            bd = datetime.strptime(birth_date[:10], "%Y-%m-%d")
            dd = datetime.strptime(death_date[:10], "%Y-%m-%d")
            if dd < bd:
                raise HTTPException(status_code=422, detail="Death date cannot be before birth date")
        except ValueError:
            pass


@router.post("/authors")
async def create_author(
    data: AuthorCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    validate_author_dates(data.birth_date, data.death_date)

    # Name uniqueness check
    existing = await db.execute(
        select(Author).where(Author.name == data.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Author already exists")

    # Slug: auto-generate if not provided
    if not data.slug:
        base_slug = _make_slug(data.name)
        slug = base_slug
        counter = 1
        while True:
            existing_slug = await db.execute(
                select(Author).where(Author.slug == slug)
            )
            if not existing_slug.scalar_one_or_none():
                break
            slug = f"{base_slug}-{counter}"
            counter += 1
        data.slug = slug
    else:
        validate_author_slug(data.slug)
        existing_slug = await db.execute(
            select(Author).where(Author.slug == data.slug.strip().lower())
        )
        if existing_slug.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Slug already in use")

    author = Author(**data.model_dump(exclude={"awards"}))
    db.add(author)
    await db.flush()

    # Handle awards from main payload
    if data.awards:
        for award_data in data.awards:
            award = AuthorAward(author_id=author.id, **award_data.model_dump())
            db.add(award)

    # Reload awards relationship
    await db.refresh(author, ["awards"])
    return {
        "id": str(author.id),
        "message": "Author created",
        "slug": author.slug,
        "awards": [{
            "id": str(a.id),
            "author_id": str(a.author_id),
            "name": a.name,
            "year": a.year,
            "organization": a.organization,
            "work": a.work,
            "created_at": a.created_at,
        } for a in (author.awards or [])],
    }

@router.put("/authors/{author_id}")
async def update_author(
    author_id: str,
    data: AuthorUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    validate_author_slug(data.slug)
    validate_author_dates(data.birth_date, data.death_date)

    result = await db.execute(select(Author).where(Author.id == author_id))
    author = result.scalar_one_or_none()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")

    # Slug uniqueness check (exclude current author)
    if data.slug:
        slug = data.slug.strip().lower()
        existing_slug = await db.execute(
            select(Author).where(Author.slug == slug, Author.id != author.id)
        )
        if existing_slug.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Slug already in use")

    update_data = data.model_dump(exclude_unset=True, exclude={"awards"})
    for key, value in update_data.items():
        if hasattr(author, key):
            setattr(author, key, value)

    # Handle awards from main payload
    if "awards" in data.model_dump(exclude_unset=True):
        await db.execute(delete(AuthorAward).where(AuthorAward.author_id == author.id))
        if data.awards:
            for award_data in data.awards:
                award = AuthorAward(author_id=author.id, **award_data.model_dump())
                db.add(award)

    await db.commit()
    await db.refresh(author, ["awards"])
    return {
        "message": "Author updated",
        "awards": [{
            "id": str(a.id),
            "author_id": str(a.author_id),
            "name": a.name,
            "year": a.year,
            "organization": a.organization,
            "work": a.work,
            "created_at": a.created_at,
        } for a in (author.awards or [])],
    }

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

    # Проверяем, есть ли книги у автора (via M:N book_authors)
    book_count = await get_author_book_count(db, author.id)
    
    if book_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete author with {book_count} books. Remove books first."
        )

    await db.delete(author)
    await db.commit()
    return {"message": "Author deleted"}

# ============================================================
# 5a. AUTHOR AWARDS
# ============================================================

@router.get("/authors/{author_id}/awards", response_model=dict)
async def get_author_awards(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    result = await db.execute(select(Author).where(Author.id == author_id))
    author = result.scalar_one_or_none()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")

    awards_result = await db.execute(
        select(AuthorAward).where(AuthorAward.author_id == author_id).order_by(AuthorAward.year)
    )
    awards = awards_result.scalars().all()

    return {
        "data": [{
            "id": str(a.id),
            "author_id": str(a.author_id),
            "name": a.name,
            "year": a.year,
            "organization": a.organization,
            "work": a.work,
            "created_at": a.created_at,
        } for a in awards],
    }


@router.post("/authors/{author_id}/awards", status_code=201)
async def create_author_award(
    author_id: str,
    data: AuthorAwardCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    result = await db.execute(select(Author).where(Author.id == author_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Author not found")

    award = AuthorAward(author_id=author_id, **data.model_dump())
    db.add(award)
    await db.commit()
    await db.refresh(award)
    return {
        "id": str(award.id),
        "author_id": str(award.author_id),
        "name": award.name,
        "year": award.year,
        "organization": award.organization,
        "work": award.work,
        "created_at": award.created_at,
    }


@router.put("/authors/{author_id}/awards/{award_id}")
async def update_author_award(
    author_id: str,
    award_id: str,
    data: AuthorAwardCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    result = await db.execute(
        select(AuthorAward).where(AuthorAward.id == award_id, AuthorAward.author_id == author_id)
    )
    award = result.scalar_one_or_none()
    if not award:
        raise HTTPException(status_code=404, detail="Award not found")

    for key, value in data.model_dump().items():
        setattr(award, key, value)
    await db.commit()
    await db.refresh(award)
    return {
        "id": str(award.id),
        "author_id": str(award.author_id),
        "name": award.name,
        "year": award.year,
        "organization": award.organization,
        "work": award.work,
        "created_at": award.created_at,
    }


@router.delete("/authors/{author_id}/awards/{award_id}", status_code=204)
async def delete_author_award(
    author_id: str,
    award_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    result = await db.execute(
        select(AuthorAward).where(AuthorAward.id == award_id, AuthorAward.author_id == author_id)
    )
    award = result.scalar_one_or_none()
    if not award:
        raise HTTPException(status_code=404, detail="Award not found")

    await db.delete(award)
    await db.commit()


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
            "type": g.type or "literary",
            "parent_id": str(g.parent_id) if g.parent_id else None,
            "book_count": await _get_genre_book_count(db, g.id),
            "children_count": g.children_count if hasattr(g, 'children_count') else 0,
            "created_at": g.created_at,
            "updated_at": g.updated_at,
        } for g in genres],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total else 0,
    }

@router.get("/genres/tree")
async def get_genres_tree(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Return full hierarchical genre tree."""
    await check_admin(current_user)

    result = await db.execute(select(Genre).order_by(Genre.name))
    all_genres = result.scalars().all()

    genre_map = {}
    for g in all_genres:
        bc = await _get_genre_book_count(db, g.id)
        genre_map[str(g.id)] = {
            "id": str(g.id),
            "name": g.name,
            "slug": g.slug,
            "type": g.type or "literary",
            "description": g.description,
            "parent_id": str(g.parent_id) if g.parent_id else None,
            "book_count": bc,
            "children": [],
        }

    roots = []
    for g in all_genres:
        node = genre_map[str(g.id)]
        if g.parent_id and str(g.parent_id) in genre_map:
            genre_map[str(g.parent_id)]["children"].append(node)
        else:
            roots.append(node)

    return roots


async def _get_genre_book_count(db: AsyncSession, genre_id) -> int:
    """Count books linked to a genre via book_genres."""
    result = await db.execute(
        select(func.count()).select_from(book_genres).where(book_genres.c.genre_id == genre_id)
    )
    return result.scalar() or 0

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
        "type": genre.type or "literary",
        "parent_id": str(genre.parent_id) if genre.parent_id else None,
        "book_count": await _get_genre_book_count(db, genre.id),
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
        parent_id=data.parent_id,
        type=data.type if hasattr(data, 'type') else "literary",
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

    if data.parent_id is not None:
        genre.parent_id = data.parent_id

    if data.type is not None:
        genre.type = data.type
    
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