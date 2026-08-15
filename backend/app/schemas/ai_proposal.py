from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class AIProposalBase(BaseModel):
    entity_type: str
    entity_id: Optional[str] = None
    field_name: str
    current_value: Optional[str] = None
    suggested_value: str
    source_type: Optional[str] = "ai"
    confidence: Optional[float] = 0.0


class AIProposalCreate(AIProposalBase):
    pass


class AIProposalUpdate(BaseModel):
    status: Optional[str] = None
    validation_state: Optional[str] = None
    conflict_state: Optional[str] = None
    edited_value: Optional[str] = None


class AIProposalResponse(AIProposalBase):
    id: UUID
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[UUID] = None

    class Config:
        from_attributes = True
