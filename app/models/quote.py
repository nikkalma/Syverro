from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"), nullable=False)
    book_title = Column(String, nullable=False)
    book_author = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    page = Column(Integer, nullable=True)
    note = Column(Text, nullable=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("reading_sessions.id"), nullable=True)
    session_time_minutes = Column(Integer, nullable=True)
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
    session = relationship("ReadingSession", back_populates="quotes")