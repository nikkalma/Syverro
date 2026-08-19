from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class SyvaiRun(Base):
    __tablename__ = "syvai_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = Column(UUID(as_uuid=True), ForeignKey("authors.id", ondelete="CASCADE"), nullable=False, index=True)
    domain = Column(String, nullable=False, server_default="timeline")
    status = Column(String, nullable=False, server_default="running", index=True)
    provider = Column(String, nullable=True)
    model = Column(String, nullable=True)
    input_tokens = Column(Integer, nullable=True)
    output_tokens = Column(Integer, nullable=True)
    total_tokens = Column(Integer, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    estimated_cost_usd = Column(Float, nullable=True)
    calls = Column(Integer, nullable=True)
    source_count = Column(Integer, nullable=True)
    error = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    finished_at = Column(DateTime, nullable=True)
