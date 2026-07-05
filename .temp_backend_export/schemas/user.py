from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: Optional[EmailStr] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ===== TELEGRAM (оставляем для будущего) =====
class TelegramAuthData(BaseModel):
    id: str
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str


# ===== BOOKS =====
class BookBase(BaseModel):
    title: str
    author: str
    cover: Optional[str] = None
    genres: Optional[List[str]] = []
    total_pages: Optional[int] = None


class BookCreate(BookBase):
    pass


class BookResponse(BookBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

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