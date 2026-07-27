from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class TimelineEventBase(BaseModel):
    author_id: UUID
    event_type: str
    date_value: str
    date_precision: str = "full"
    label: str
    description: Optional[str] = None
    place_id: Optional[UUID] = None
    source_id: Optional[UUID] = None
    confidence: float = 1.0
    status: str = "verified"
    sort_order: int = 0


class TimelineEventCreate(BaseModel):
    event_type: str
    date_value: str
    date_precision: str = "full"
    label: str
    description: Optional[str] = None
    place_id: Optional[UUID] = None
    source_id: Optional[UUID] = None
    confidence: float = 1.0
    status: str = "verified"
    sort_order: int = 0


class TimelineEventUpdate(BaseModel):
    event_type: Optional[str] = None
    date_value: Optional[str] = None
    date_precision: Optional[str] = None
    label: Optional[str] = None
    description: Optional[str] = None
    place_id: Optional[UUID] = None
    source_id: Optional[UUID] = None
    confidence: Optional[float] = None
    status: Optional[str] = None
    sort_order: Optional[int] = None


class TimelineEventResponse(TimelineEventBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
