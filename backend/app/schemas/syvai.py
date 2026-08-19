from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class ProposalSourceResponse(BaseModel):
    id: UUID
    title: str
    url: Optional[str] = None
    source_type: Optional[str] = None
    reliability_score: Optional[str] = None
    reliability_tier: Optional[str] = None


class AIProposalExtendedResponse(BaseModel):
    id: UUID
    entity_type: str
    entity_id: Optional[str] = None
    field_name: str
    current_value: Optional[str] = None
    suggested_value: str
    edited_value: Optional[str] = None
    source_type: str
    confidence: float
    status: str
    validation_state: Optional[str] = None
    conflict_state: Optional[str] = None
    run_id: Optional[UUID] = None
    applied_at: Optional[datetime] = None
    timeline_event_id: Optional[UUID] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[UUID] = None
    sources: list[ProposalSourceResponse] = []


class SyvaiRunResponse(BaseModel):
    id: UUID
    author_id: UUID
    domain: str
    status: str
    provider: Optional[str] = None
    model: Optional[str] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    total_tokens: Optional[int] = None
    duration_ms: Optional[int] = None
    estimated_cost_usd: Optional[float] = None
    calls: Optional[int] = None
    source_count: Optional[int] = None
    error: Optional[str] = None
    created_at: datetime
    finished_at: Optional[datetime] = None


class TimelineRunResponse(BaseModel):
    run: SyvaiRunResponse
    proposals: list[AIProposalExtendedResponse]
    message: str


class ApplyProposalResponse(BaseModel):
    applied: bool
    already_applied: bool
    timeline_event_id: UUID
