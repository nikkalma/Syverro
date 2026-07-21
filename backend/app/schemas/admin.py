# backend/app/schemas/admin.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict
from uuid import UUID

# Импортируем схемы авторов и жанров
from app.schemas.genre import GenreResponse, GenreCreate, GenreUpdate
from app.schemas.author import AuthorResponse, AuthorCreate, AuthorUpdate


# ============================================================
# СХЕМЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ В АДМИНКЕ
# ============================================================

class AdminUserResponse(BaseModel):
    """Ответ с данными пользователя для админки"""
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


class AdminUserUpdate(BaseModel):
    """Обновление пользователя в админке"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    phone: Optional[str] = None


# ============================================================
# СХЕМЫ ДЛЯ КНИГ В АДМИНКЕ
# ============================================================

class AdminBookResponse(BaseModel):
    """Ответ с данными книги для админки"""
    id: str
    title: str
    author: str
    author_id: Optional[str] = None
    cover: Optional[str] = None
    genres: List[str] = []
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
    # Author enrichment
    author_name: Optional[str] = None
    author_country: Optional[str] = None
    author_bio: Optional[str] = None
    author_birth_year: Optional[int] = None
    author_death_year: Optional[int] = None
    author_creation_type: Optional[str] = None


class AdminBookCreate(BaseModel):
    """Создание книги в админке"""
    title: str
    author: str
    author_id: Optional[str] = None
    cover: Optional[str] = None
    genres: List[str] = []
    description: Optional[str] = None
    total_pages: Optional[int] = None
    publication_type: str = "official"
    is_published: bool = False


class AdminBookUpdate(BaseModel):
    """Обновление книги в админке"""
    title: Optional[str] = None
    author: Optional[str] = None
    author_id: Optional[str] = None
    cover: Optional[str] = None
    genres: Optional[List[str]] = None
    description: Optional[str] = None
    total_pages: Optional[int] = None
    publication_type: Optional[str] = None
    is_published: Optional[bool] = None
    metadata_status: Optional[str] = None


class AdminBookEnrichment(BaseModel):
    """Обогащение метаданных книги (только admin/owner)"""
    subtitle: Optional[str] = None
    original_title: Optional[str] = None
    description: Optional[str] = None
    cover: Optional[str] = None
    genres: Optional[List[str]] = None
    author_id: Optional[str] = None
    original_language: Optional[str] = None
    country_of_origin: Optional[str] = None
    original_publication_year: Optional[int] = None
    series_name: Optional[str] = None
    series_position: Optional[int] = None
    themes: Optional[List[str]] = None
    motifs: Optional[List[str]] = None
    # Author fields
    author_name: Optional[str] = None
    author_country: Optional[str] = None
    author_bio: Optional[str] = None
    author_birth_year: Optional[int] = None
    author_death_year: Optional[int] = None
    author_creation_type: Optional[str] = None


# ============================================================
# СХЕМЫ ДЛЯ ЛОГОВ
# ============================================================

class AdminLogResponse(BaseModel):
    """Ответ с данными лога"""
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


# ============================================================
# СХЕМЫ ДЛЯ ДЕЙСТВИЙ (ROLE, BLOCK, PUBLISH)
# ============================================================

class RoleUpdate(BaseModel):
    """Обновление роли пользователя"""
    role: str


class BlockUpdate(BaseModel):
    """Блокировка/разблокировка пользователя"""
    is_active: bool


class PublishUpdate(BaseModel):
    """Публикация/скрытие книги"""
    is_published: bool


# ============================================================
# СХЕМА СТАТИСТИКИ
# ============================================================

class AdminStatsResponse(BaseModel):
    """Ответ со статистикой для дашборда"""
    total_users: int
    total_books: int
    total_authors: int
    total_genres: int
    active_users: int
    new_users_24h: int
    new_books_24h: int
    users_by_role: Dict[str, int]


# ============================================================
# СХЕМА НАСТРОЕК
# ============================================================

class SettingsResponse(BaseModel):
    """Настройки системы"""
    registration_enabled: bool = True
    max_file_size_mb: int = 10
    site_name: str = "Syverro"
    site_description: str = "Пространство для чтения"
    maintenance_mode: bool = False
    require_email_verification: bool = False
    default_user_role: str = "user"