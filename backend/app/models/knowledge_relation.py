from sqlalchemy import Column, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.database import Base
import uuid


class KnowledgeRelation(Base):
    __tablename__ = "knowledge_relations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_node_id = Column(UUID(as_uuid=True), ForeignKey("knowledge_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    target_node_id = Column(UUID(as_uuid=True), ForeignKey("knowledge_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    relation_type = Column(String, nullable=False, index=True)
    weight = Column(Float, server_default="0.5", nullable=False)
    meta = Column("metadata", JSONB, server_default="{}", nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("source_node_id", "target_node_id", "relation_type", name="uq_knowledge_relations"),
    )
