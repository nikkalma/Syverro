from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class AuthorKnowledgeRelationBase(BaseModel):
    author_id: UUID
    node_id: UUID
    relation_type: str
    source: str = "curator"
    status: str = "verified"
    confidence: float = 1.0
    source_id: Optional[UUID] = None


class AuthorKnowledgeRelationCreate(BaseModel):
    node_id: UUID
    relation_type: str
    source: str = "curator"
    status: str = "verified"
    confidence: float = 1.0
    source_id: Optional[UUID] = None


class AuthorKnowledgeRelationUpdate(BaseModel):
    status: Optional[str] = None
    confidence: Optional[float] = None
    source_id: Optional[UUID] = None


class AuthorKnowledgeRelationResponse(AuthorKnowledgeRelationBase):
    id: UUID
    created_at: datetime
    node_name: Optional[str] = None
    node_type: Optional[str] = None

    class Config:
        from_attributes = True
