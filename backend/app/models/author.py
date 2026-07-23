from sqlalchemy import Column, String, Text, Integer, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
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

    # === BASIC INFORMATION ===
    pseudonyms = Column(ARRAY(String), nullable=True, server_default="{}")
    nationality = Column(String, nullable=True)
    languages = Column(ARRAY(String), nullable=True, server_default="{}")
    gender = Column(String, nullable=True, server_default="unknown")
    official_website = Column(String, nullable=True)
    wikipedia_url = Column(String, nullable=True)

    # === BIOGRAPHY ===
    bio = Column(Text, nullable=True)
    birth_year = Column(Integer, nullable=True)
    death_year = Column(Integer, nullable=True)
    birth_date = Column(String, nullable=True)
    death_date = Column(String, nullable=True)
    birth_place = Column(String, nullable=True)
    death_place = Column(String, nullable=True)

    # === CAREER ===
    occupations = Column(ARRAY(String), nullable=True, server_default="{}")
    literary_movements = Column(ARRAY(String), nullable=True, server_default="{}")
    active_from_year = Column(Integer, nullable=True)
    active_to_year = Column(Integer, nullable=True)

    # === BIBLIOGRAPHY ===
    notable_works = Column(ARRAY(String), nullable=True, server_default="{}")
    genres = Column(ARRAY(String), nullable=True, server_default="{}")
    writing_languages = Column(ARRAY(String), nullable=True, server_default="{}")

    # === MEDIA ===
    photo = Column(String, nullable=True)
    gallery = Column(ARRAY(String), nullable=True, server_default="{}")
    signature_image = Column(String, nullable=True)
    portrait_caption = Column(String, nullable=True)

    # === SYSTEM ===
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

    awards = relationship("AuthorAward", back_populates="author", cascade="all, delete-orphan")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
