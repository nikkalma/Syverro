from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID

class BookCreate(BaseModel):
    title: str
    author: str
    status: Optional[str] = "planned"
    rating: Optional[int] = None
    cover: Optional[str] = None
    section: Optional[str] = None
    genres: List[str] = []
    total_pages: int = 0
    current_page: int = 0
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: str = ""
    languages: List[str] = []
    review: str = ""
    favorite: bool = False
    author_country: Optional[str] = None
    series: Optional[str] = None
    series_position: Optional[int] = None
    original_year: Optional[int] = None
    reading_format: str = "reading"
    last_read: Optional[str] = None

class BookResponse(BaseModel):
    id: UUID
    title: str
    author: str
    status: Optional[str] = None
    rating: Optional[int] = None
    cover: Optional[str] = None
    section: Optional[str] = None
    genres: List[str] = []
    total_pages: int = 0
    current_page: int = 0
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: str = ""
    languages: List[str] = []
    review: str = ""
    favorite: bool = False
    author_country: Optional[str] = None
    series: Optional[str] = None
    series_position: Optional[int] = None
    original_year: Optional[int] = None
    reading_format: str = "reading"
    last_read: Optional[str] = None
    created_at: int

class UserBookResponse(BaseModel):
    id: UUID
    user_id: UUID
    book_id: UUID
    status: str
    book: BookResponse