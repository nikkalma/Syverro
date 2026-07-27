from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class AuthorQuoteBase(BaseModel):
    text: str
    speaker: Optional[str] = None
    source_id: Optional[UUID] = None
    date_value: Optional[str] = None
    confidence: Optional[float] = 1.0
    status: Optional[str] = "draft"
    sort_order: Optional[str] = "0"


class AuthorQuoteCreate(AuthorQuoteBase):
    pass


class AuthorQuoteUpdate(BaseModel):
    text: Optional[str] = None
    speaker: Optional[str] = None
    source_id: Optional[UUID] = None
    date_value: Optional[str] = None
    confidence: Optional[float] = None
    status: Optional[str] = None
    sort_order: Optional[str] = None


class AuthorQuoteResponse(AuthorQuoteBase):
    id: UUID
    author_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
