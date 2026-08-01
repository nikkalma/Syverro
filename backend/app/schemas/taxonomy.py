from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from uuid import UUID


# ============================================================
# Knowledge Node Schemas
# ============================================================

class KnowledgeNodeBase(BaseModel):
    name: str
    slug: Optional[str] = None
    node_type: str
    parent_id: Optional[UUID] = None
    meta: Optional[dict] = {}
    description: Optional[str] = None
    status: Optional[str] = "draft"
    is_sapphire: Optional[bool] = False
    explorer_visible: Optional[bool] = False


class KnowledgeNodeCreate(KnowledgeNodeBase):
    pass


class KnowledgeNodeUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    parent_id: Optional[UUID] = None
    meta: Optional[dict] = None
    description: Optional[str] = None
    status: Optional[str] = None
    is_sapphire: Optional[bool] = None
    explorer_visible: Optional[bool] = None


class KnowledgeNodeResponse(KnowledgeNodeBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class KnowledgeNodeTree(KnowledgeNodeResponse):
    children: List["KnowledgeNodeTree"] = []

    class Config:
        from_attributes = True


# ============================================================
# Knowledge Relation Schemas
# ============================================================

class KnowledgeRelationBase(BaseModel):
    source_node_id: UUID
    target_node_id: UUID
    relation_type: str
    weight: float = 0.5
    meta: Optional[dict] = {}


class KnowledgeRelationCreate(KnowledgeRelationBase):
    pass


class KnowledgeRelationResponse(KnowledgeRelationBase):
    id: UUID
    created_at: datetime
    source_name: Optional[str] = None
    source_type: Optional[str] = None
    target_name: Optional[str] = None
    target_type: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# Book Knowledge Relation Schemas
# ============================================================

class BookKnowledgeRelationBase(BaseModel):
    book_id: UUID
    node_id: UUID
    relation_type: str
    source: str
    status: str = "proposed"
    confidence: float = 0.5


class BookKnowledgeRelationCreate(BookKnowledgeRelationBase):
    pass


class BookKnowledgeRelationUpdate(BaseModel):
    status: str
    confidence: Optional[float] = None


class BookKnowledgeRelationResponse(BookKnowledgeRelationBase):
    id: UUID
    created_at: datetime
    node_name: Optional[str] = None
    node_type: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# User Book Experience Schemas
# ============================================================

class UserBookExperienceBase(BaseModel):
    book_id: UUID
    atmosphere_node_id: Optional[UUID] = None
    mood_node_id: Optional[UUID] = None
    intensity: float = 0.5
    note: Optional[str] = None


class UserBookExperienceCreate(UserBookExperienceBase):
    pass


class UserBookExperienceResponse(UserBookExperienceBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    atmosphere_name: Optional[str] = None
    mood_name: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# Query / Filter Schemas
# ============================================================

class KnowledgeGraphResponse(BaseModel):
    nodes: List[KnowledgeNodeResponse]
    relations: List[KnowledgeRelationResponse]


class BookKnowledgeResponse(BaseModel):
    book_id: UUID
    book_title: Optional[str] = None
    relations: List[BookKnowledgeRelationResponse]
