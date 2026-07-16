# backend/app/schemas/genre.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class GenreBase(BaseModel):
    """Базовые поля жанра"""
    name: str
    description: Optional[str] = None


class GenreCreate(GenreBase):
    """Для создания жанра"""
    pass


class GenreUpdate(GenreBase):
    """Для обновления жанра (все поля опциональны)"""
    name: Optional[str] = None
    description: Optional[str] = None


class GenreResponse(GenreBase):
    """Для ответа с данными жанра"""
    id: UUID
    slug: str
    book_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True