from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class AIProposal(Base):
    __tablename__ = "ai_proposals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String, nullable=False, index=True)
    entity_id = Column(String, nullable=True, index=True)
    field_name = Column(String, nullable=False)
    current_value = Column(Text, nullable=True)
    suggested_value = Column(Text, nullable=False)
    source_type = Column(String, server_default="ai", nullable=False)
    confidence = Column(Float, server_default="0.0", nullable=False)
    status = Column(String, server_default="proposed", nullable=False)
    validation_state = Column(String, nullable=True)
    conflict_state = Column(String, nullable=True)
    edited_value = Column(Text, nullable=True)
    run_id = Column(UUID(as_uuid=True), ForeignKey("syvai_runs.id", ondelete="SET NULL"), nullable=True, index=True)
    applied_at = Column(DateTime, nullable=True)
    timeline_event_id = Column(UUID(as_uuid=True), ForeignKey("timeline_events.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    sources = relationship(
        "AIProposalSource",
        backref="proposal",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
