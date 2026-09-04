from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID


class AuthorPublicationBase(BaseModel):
    title: str
    original_title: Optional[str] = None
    publication_year: int
    publication_date: Optional[date] = None
    publication_type: str
    description: Optional[str] = None
    pen_name: Optional[str] = None
    wikipedia_url: Optional[str] = None
    source_id: Optional[UUID] = None


class AuthorPublicationCreate(AuthorPublicationBase):
    pass


class AuthorPublicationUpdate(BaseModel):
    title: Optional[str] = None
    original_title: Optional[str] = None
    publication_year: Optional[int] = None
    publication_date: Optional[date] = None
    publication_type: Optional[str] = None
    description: Optional[str] = None
    pen_name: Optional[str] = None
    wikipedia_url: Optional[str] = None
    source_id: Optional[UUID] = None


class WorkAuthorInput(BaseModel):
    author_id: UUID
    position: int
    credited_name: Optional[str] = None


class WorkAuthorshipReplace(BaseModel):
    authors: List[WorkAuthorInput]


class AuthorPublicationResponse(AuthorPublicationBase):
    id: UUID
    author_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
