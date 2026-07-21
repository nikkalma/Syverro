# backend/app/schemas/genre.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from uuid import UUID


class GenreBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    type: str = "literary"


class GenreCreate(GenreBase):
    pass


class GenreUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    type: Optional[str] = None


class GenreResponse(GenreBase):
    id: UUID
    slug: str
    book_count: int = 0
    children_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GenreTreeNode(BaseModel):
    id: UUID
    name: str
    slug: str
    type: str
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    book_count: int = 0
    children: List["GenreTreeNode"] = []

    class Config:
        from_attributes = True
