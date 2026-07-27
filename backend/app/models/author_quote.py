from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class AuthorQuote(Base):
    __tablename__ = "author_quotes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = Column(UUID(as_uuid=True), ForeignKey("authors.id", ondelete="CASCADE"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    speaker = Column(String, nullable=True)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id", ondelete="SET NULL"), nullable=True)
    date_value = Column(String, nullable=True)
    confidence = Column(Float, server_default="1.0", nullable=False)
    status = Column(String, server_default="draft", nullable=False)
    sort_order = Column(String, server_default="0", nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    author = relationship("Author", backref="author_quotes")
    source = relationship("Source", backref="author_quotes")
