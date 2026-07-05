from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, JSON, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class Book(Base):
    __tablename__ = "books"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)  # Денормализовано для быстрых запросов
    author_id = Column(UUID(as_uuid=True), ForeignKey("authors.id"), nullable=True)
    cover = Column(String, nullable=True)
    genres = Column(JSON, default=[])
    total_pages = Column(Integer, nullable=True)
    is_published = Column(Boolean, default=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
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
    user_books = relationship("UserBook", back_populates="book", cascade="all, delete-orphan")
    author_ref = relationship("Author", back_populates="books")
    
    __table_args__ = (
        UniqueConstraint('title', 'author', name='unique_book_title_author'),
    )