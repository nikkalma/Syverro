from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class ReadingSession(Base):
    __tablename__ = "reading_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"), nullable=False)
    book_title = Column(String, nullable=False)
    book_author = Column(String, nullable=False)
    start_page = Column(Integer, nullable=False)
    end_page = Column(Integer, nullable=False)
    pages_read = Column(Integer, nullable=False)
    duration_seconds = Column(Integer, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    date = Column(DateTime, nullable=False)
    status = Column(String, default="completed")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # ============================================
    # ✅ SYNC FIELDS (НОВЫЕ)
    # ============================================
    version = Column(Integer, default=1, nullable=False)
    last_modified_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    device_id = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User")
    book = relationship("Book")
    quotes = relationship("Quote", back_populates="session")