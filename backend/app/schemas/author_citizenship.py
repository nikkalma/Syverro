from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class AuthorCitizenshipBase(BaseModel):
    state_name: str
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    source_id: Optional[UUID] = None
    confidence: Optional[float] = 1.0
    status: Optional[str] = "verified"


class AuthorCitizenshipCreate(AuthorCitizenshipBase):
    pass


class AuthorCitizenshipUpdate(BaseModel):
    state_name: Optional[str] = None
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    source_id: Optional[UUID] = None
    confidence: Optional[float] = None
    status: Optional[str] = None


class AuthorCitizenshipResponse(AuthorCitizenshipBase):
    id: UUID
    author_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
