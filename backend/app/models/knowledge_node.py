from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class KnowledgeNode(Base):
    __tablename__ = "knowledge_nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    slug = Column(String, nullable=False)
    node_type = Column(String, nullable=False, index=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("knowledge_nodes.id", ondelete="SET NULL"), nullable=True, index=True)
    meta = Column("metadata", JSONB, server_default="{}", nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    parent = relationship("KnowledgeNode", remote_side="KnowledgeNode.id", back_populates="children")
    children = relationship("KnowledgeNode", back_populates="parent")

    __table_args__ = (
        UniqueConstraint("slug", name="uq_knowledge_nodes_slug"),
    )
