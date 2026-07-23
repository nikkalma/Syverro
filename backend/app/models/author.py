from sqlalchemy import Column, String, Text, Integer, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.database import Base


class Author(Base):
    __tablename__ = "authors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    first_name = Column(String, nullable=True)
    middle_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    native_name = Column(String, nullable=True)
    sort_name = Column(String, nullable=True)
    photo = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    country = Column(String, nullable=True)
    birth_year = Column(Integer, nullable=True)
    death_year = Column(Integer, nullable=True)
    creation_type = Column(String, default="individual_author", nullable=False)
    # individual_author | multiple_authors | anonymous_traditional |
    # religious_canon | oral_tradition | collective_creation

    books = relationship(
        "Book",
        back_populates="author_ref"
    )  # legacy one-to-many via Book.author_id
    book_refs = relationship(
        "Book",
        secondary="book_authors",
        back_populates="authors"
    )  # many-to-many via book_authors

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
