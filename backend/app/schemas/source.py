from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class SourceBase(BaseModel):
    title: str
    source_type: str
    url: Optional[str] = None
    citation: Optional[str] = None
    notes: Optional[str] = None
    language: Optional[str] = None
    reliability_score: Optional[str] = "3"
    source_origin: Optional[str] = "manual"


class SourceCreate(SourceBase):
    pass


class SourceUpdate(BaseModel):
    title: Optional[str] = None
    source_type: Optional[str] = None
    url: Optional[str] = None
    citation: Optional[str] = None
    notes: Optional[str] = None
    language: Optional[str] = None
    reliability_score: Optional[str] = None
    source_origin: Optional[str] = None


class SourceResponse(SourceBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
