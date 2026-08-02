# backend/app/schemas/book.py
from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Any, Optional, List
from uuid import UUID


class GenreBrief(BaseModel):
    id: UUID
    name: str
    slug: str

    class Config:
        from_attributes = True


class PublicBookAuthor(BaseModel):
    id: UUID
    name: str
    display_name: Optional[str] = None
    slug: Optional[str] = None
    role: Optional[str] = None
    is_primary: Optional[bool] = None


class PublicBookGenre(BaseModel):
    id: UUID
    name: str
    slug: str
    type: Optional[str] = None


class PublicBookPublication(BaseModel):
    id: UUID
    author_id: UUID
    title: str
    original_title: Optional[str] = None
    publication_year: int
    publication_date: Optional[date] = None
    publication_type: str
    description: Optional[str] = None
    pen_name: Optional[str] = None
    wikipedia_url: Optional[str] = None
    source_id: Optional[UUID] = None


class PublicBookKnowledgeItem(BaseModel):
    node_id: UUID
    name: str
    slug: str
    node_type: str
    relation_type: str
    confidence: float
    source: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class PublicBookDetailResponse(BaseModel):
    id: UUID
    title: str
    subtitle: Optional[str] = None
    original_title: Optional[str] = None
    description: Optional[str] = None
    cover: Optional[str] = None
    publication_id: Optional[UUID] = None
    publication_year: Optional[int] = None
    original_language: Optional[str] = None
    country_of_origin: Optional[str] = None
    total_pages: Optional[int] = None
    publication_type: str
    series_name: Optional[str] = None
    series_position: Optional[int] = None
    authors: List[PublicBookAuthor] = Field(default_factory=list)
    publication: Optional[PublicBookPublication] = None
    genres: List[PublicBookGenre] = Field(default_factory=list)
    knowledge: List[PublicBookKnowledgeItem] = Field(default_factory=list)


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
    publication_id: Optional[UUID] = None
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
