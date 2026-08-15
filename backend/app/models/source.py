from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class Source(Base):
    __tablename__ = "sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    source_type = Column(String, nullable=False, index=True)
    url = Column(String, nullable=True)
    citation = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    language = Column(String, nullable=True)
    reliability_score = Column(String, server_default="3", nullable=False)
    source_origin = Column(String, server_default="manual", nullable=False)
    authority_tier = Column(String, nullable=True)
    review_status = Column(String, server_default="pending", nullable=False, index=True)
    normalized_url = Column(String, nullable=True, index=True)
    discovered_by = Column(String, nullable=True)
    discovered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class AuthorSourceLink(Base):
    __tablename__ = "author_source_links"

    author_id = Column(UUID(as_uuid=True), ForeignKey("authors.id", ondelete="CASCADE"), primary_key=True)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
