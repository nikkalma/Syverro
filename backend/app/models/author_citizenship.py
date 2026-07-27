from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class AuthorCitizenship(Base):
    __tablename__ = "author_citizenships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = Column(UUID(as_uuid=True), ForeignKey("authors.id", ondelete="CASCADE"), nullable=False, index=True)
    state_name = Column(String, nullable=False)
    from_date = Column(String, nullable=True)
    to_date = Column(String, nullable=True)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id", ondelete="SET NULL"), nullable=True)
    confidence = Column(Float, server_default="1.0", nullable=False)
    status = Column(String, server_default="verified", nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    author = relationship("Author", back_populates="citizenships")
