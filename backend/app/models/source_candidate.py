from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class SourceCandidate(Base):
    """A candidate source page surfaced by the bounded discovery layer.

    Every candidate is assessed deterministically into one of:
      * ``auto_usable``  — high authority + high score, promoted to ``sources``
        automatically (review by exception means no human is asked);
      * ``needs_review`` — a human must approve or reject it;
      * ``rejected``     — deterministically excluded (duplicate, spam signals).

    ``status`` tracks whether a human decision has been taken; ``review_action``
    records the final decision for telemetry (human_actions_per_author).
    """

    __tablename__ = "source_candidates"
    __table_args__ = (
        UniqueConstraint("author_id", "normalized_url", name="uq_source_candidates_author_normalized"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = Column(UUID(as_uuid=True), ForeignKey("authors.id", ondelete="CASCADE"), nullable=False, index=True)
    run_id = Column(UUID(as_uuid=True), ForeignKey("syvai_runs.id", ondelete="SET NULL"), nullable=True, index=True)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id", ondelete="SET NULL"), nullable=True, index=True)
    url = Column(String, nullable=False)
    normalized_url = Column(String, nullable=False)
    title = Column(String, nullable=True)
    source_type = Column(String, nullable=True)
    authority_tier = Column(String, nullable=False)
    quality_score = Column(Float, nullable=True)
    assessment = Column(String, nullable=False, index=True)
    assessment_reason = Column(String, nullable=True)
    provider = Column(String, nullable=True)
    origin = Column(String, nullable=True)
    evidence = Column(Text, nullable=True)
    identity_verification = Column(JSON, nullable=True)
    content_capabilities = Column(JSON, nullable=True)
    capability_evidence = Column(JSON, nullable=True)
    status = Column(String, server_default="pending", nullable=False, index=True)
    review_action = Column(String, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
