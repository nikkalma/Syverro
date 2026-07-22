from sqlalchemy import Column, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class BookKnowledgeRelation(Base):
    __tablename__ = "book_knowledge_relations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    node_id = Column(UUID(as_uuid=True), ForeignKey("knowledge_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    relation_type = Column(String, nullable=False)
    source = Column(String, nullable=False)
    status = Column(String, server_default="proposed", nullable=False, index=True)
    confidence = Column(Float, server_default="0.5", nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("book_id", "node_id", "relation_type", "source", name="uq_book_knowledge_relations"),
    )
