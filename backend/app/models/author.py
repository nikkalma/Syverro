# backend/app/schemas/__init__.py
# Экспортируем все схемы для удобного импорта

from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    TelegramAuthData,
)

from app.schemas.book import (
    BookBase,
    BookCreate,
    BookResponse,
    UserBookCreate,
    UserBookResponse,
)

from app.schemas.author import (
    AuthorBase,
    AuthorCreate,
    AuthorUpdate,
    AuthorResponse,
)

from app.schemas.genre import (
    GenreBase,
    GenreCreate,
    GenreUpdate,
    GenreResponse,
)

from app.schemas.admin import (
    AdminUserResponse,
    AdminUserUpdate,
    AdminBookResponse,
    AdminBookCreate,
    AdminBookUpdate,
    AdminLogResponse,
    RoleUpdate,
    BlockUpdate,
    PublishUpdate,
    AdminStatsResponse,
    SettingsResponse,
)

__all__ = [
    # User
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "TokenResponse",
    "TelegramAuthData",
    # Book
    "BookBase",
    "BookCreate",
    "BookResponse",
    "UserBookCreate",
    "UserBookResponse",
    # Author
    "AuthorBase",
    "AuthorCreate",
    "AuthorUpdate",
    "AuthorResponse",
    # Genre
    "GenreBase",
    "GenreCreate",
    "GenreUpdate",
    "GenreResponse",
    # Admin
    "AdminUserResponse",
    "AdminUserUpdate",
    "AdminBookResponse",
    "AdminBookCreate",
    "AdminBookUpdate",
    "AdminLogResponse",
    "RoleUpdate",
    "BlockUpdate",
    "PublishUpdate",
    "AdminStatsResponse",
    "SettingsResponse",
]