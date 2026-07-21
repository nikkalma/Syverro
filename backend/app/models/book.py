from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, JSON, Text, UniqueConstraint
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
    description = Column(Text, nullable=True)
    total_pages = Column(Integer, nullable=True)
    is_published = Column(Boolean, default=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # ============================================
    # SYNC FIELDS
    # ============================================
    version = Column(Integer, default=1, nullable=False)
    last_modified_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    device_id = Column(String, nullable=True)
    
    # ============================================
    # PUBLICATION & MODERATION FIELDS
    # ============================================
    publication_type = Column(String, default="official", nullable=False)  # official | unofficial
    metadata_status = Column(String, default="draft", nullable=False)  # draft | incomplete | review_ready | complete
    moderation_status = Column(String, default="pending", nullable=False)  # pending | approved | rejected
    moderation_reason = Column(Text, nullable=True)
    moderated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    moderated_at = Column(DateTime, nullable=True)

    # ============================================
    # ENRICHMENT FIELDS (admin metadata)
    # ============================================
    subtitle = Column(String, nullable=True)
    original_title = Column(String, nullable=True)
    original_language = Column(String, nullable=True)
    country_of_origin = Column(String, nullable=True)
    original_publication_year = Column(Integer, nullable=True)
    series_name = Column(String, nullable=True)
    series_position = Column(Integer, nullable=True)
    themes = Column(JSON, default=[])       # List[str]
    motifs = Column(JSON, default=[])       # List[str]

    # Relationships
    user_books = relationship("UserBook", back_populates="book", cascade="all, delete-orphan")
    author_ref = relationship("Author", back_populates="books")
    genres_rel = relationship("Genre", secondary="book_genres", back_populates="books")
    
    __table_args__ = (
        UniqueConstraint('title', 'author', name='unique_book_title_author'),
    )