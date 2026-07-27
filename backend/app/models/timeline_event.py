from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = Column(UUID(as_uuid=True), ForeignKey("authors.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String, nullable=False, index=True)
    date_value = Column(String, nullable=False)
    date_precision = Column(String, nullable=False, server_default="full")
    label = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    place_id = Column(UUID(as_uuid=True), ForeignKey("places.id", ondelete="SET NULL"), nullable=True)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id", ondelete="SET NULL"), nullable=True)
    confidence = Column(Float, server_default="1.0", nullable=False)
    status = Column(String, server_default="verified", nullable=False)
    sort_order = Column(Integer, server_default="0", nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    author = relationship("Author", back_populates="timeline_events")
