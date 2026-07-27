from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class AuthorResidenceBase(BaseModel):
    place_id: UUID
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    source_id: Optional[UUID] = None
    confidence: Optional[float] = 1.0
    status: Optional[str] = "verified"


class AuthorResidenceCreate(AuthorResidenceBase):
    pass


class AuthorResidenceUpdate(BaseModel):
    place_id: Optional[UUID] = None
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    source_id: Optional[UUID] = None
    confidence: Optional[float] = None
    status: Optional[str] = None


class AuthorResidenceResponse(AuthorResidenceBase):
    id: UUID
    author_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
