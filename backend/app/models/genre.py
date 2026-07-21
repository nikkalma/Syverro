# backend/app/models/genre.py
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid

class Genre(Base):
    __tablename__ = "genres"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(String, nullable=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("genres.id"), nullable=True)
    type = Column(String, default="literary", nullable=False)
    # literary | non_fiction | spiritual | cultural | practical
    book_count = Column(Integer, default=0)  # kept for backward compat, prefer dynamic count
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    parent = relationship("Genre", remote_side="Genre.id", back_populates="children")
    children = relationship("Genre", back_populates="parent")
    books = relationship("Book", secondary="book_genres", back_populates="genres_rel")
