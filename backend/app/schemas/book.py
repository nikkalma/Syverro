# backend/app/schemas/book.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from uuid import UUID


class GenreBrief(BaseModel):
    id: UUID
    name: str
    slug: str

    class Config:
        from_attributes = True


class BookBase(BaseModel):
    title: str
    author: str
    cover: Optional[str] = None
    genres: Optional[List[str]] = []
    genre_ids: Optional[List[UUID]] = []
    description: Optional[str] = None
    total_pages: Optional[int] = None
    publication_type: str = "official"


class BookCreate(BookBase):
    pass


class BookResponse(BookBase):
    id: UUID
    author_id: Optional[UUID] = None
    author_name: Optional[str] = None
    author_country: Optional[str] = None
    author_bio: Optional[str] = None
    author_slug: Optional[str] = None
    subtitle: Optional[str] = None
    original_title: Optional[str] = None
    original_language: Optional[str] = None
    country_of_origin: Optional[str] = None
    original_publication_year: Optional[int] = None
    series_name: Optional[str] = None
    series_position: Optional[int] = None
    themes: List[str] = []
    motifs: List[str] = []
    metadata_status: str = "draft"
    moderation_status: str = "pending"
    moderation_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]
    genre_objects: List[GenreBrief] = []

    class Config:
        from_attributes = True


class UserBookCreate(BaseModel):
    book_id: UUID
    status: str = "planned"
    rating: Optional[int] = None
    current_page: Optional[int] = 0
    start_date: Optional[datetime] = None
    notes: Optional[str] = None


class UserBookResponse(BaseModel):
    id: UUID
    user_id: UUID
    book_id: UUID
    book: BookResponse
    status: str
    rating: Optional[int]
    current_page: int
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    notes: Optional[str]
    is_favorite: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
