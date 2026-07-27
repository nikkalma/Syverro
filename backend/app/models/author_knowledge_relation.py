from sqlalchemy import Column, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class AuthorKnowledgeRelation(Base):
    __tablename__ = "author_knowledge_relations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = Column(UUID(as_uuid=True), ForeignKey("authors.id", ondelete="CASCADE"), nullable=False, index=True)
    node_id = Column(UUID(as_uuid=True), ForeignKey("knowledge_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    relation_type = Column(String, nullable=False, index=True)
    source = Column(String, server_default="curator", nullable=False)
    status = Column(String, server_default="verified", nullable=False, index=True)
    confidence = Column(Float, server_default="1.0", nullable=False)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("author_id", "node_id", "relation_type", name="uq_author_knowledge_relations"),
    )
