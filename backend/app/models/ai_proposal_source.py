from sqlalchemy import Boolean, Column, String, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class AIProposalSource(Base):
    __tablename__ = "ai_proposal_sources"
    __table_args__ = (UniqueConstraint("proposal_id", "source_id", name="uq_ai_proposal_sources_proposal_source"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    proposal_id = Column(UUID(as_uuid=True), ForeignKey("ai_proposals.id", ondelete="CASCADE"), nullable=False, index=True)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id", ondelete="CASCADE"), nullable=False, index=True)
    snippet = Column(Text, nullable=True)
    reliability_tier = Column(String, nullable=True)
    verification_state = Column(String, server_default="ungrounded", nullable=False)
    verification_reason = Column(Text, nullable=True)
    provenance_type = Column(String, server_default="unverified_model", nullable=False)
    synthesis_involved = Column(Boolean, server_default="false", nullable=False)

    source = relationship("Source", lazy="joined")
