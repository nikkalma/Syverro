from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey
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

    # === IDENTITY ===
    display_name = Column(String, nullable=True)
    display_name_mode = Column(String, nullable=True)
    pen_names = Column(ARRAY(String), nullable=True, server_default="{}")
    birth_name = Column(String, nullable=True)
    slug = Column(String, nullable=True, unique=True, index=True)
    search_aliases = Column(Text, nullable=True)

    # === BASIC INFORMATION ===
    pseudonyms = Column(ARRAY(String), nullable=True, server_default="{}")
    nationality = Column(String, nullable=True)
    country = Column(String, nullable=True)  # legacy alias, retains DB column
    languages = Column(ARRAY(String), nullable=True, server_default="{}")
    gender = Column(String, nullable=True, server_default="unknown")
    official_website = Column(String, nullable=True)
    wikipedia_url = Column(String, nullable=True)

    # === BIOGRAPHY ===
    bio = Column(Text, nullable=True)
    birth_year = Column(Integer, nullable=True)
    death_year = Column(Integer, nullable=True)
    birth_date = Column(String, nullable=True)
    birth_date_precision = Column(String, server_default="full", nullable=True)
    death_date = Column(String, nullable=True)
    death_date_precision = Column(String, server_default="full", nullable=True)
    birth_place = Column(String, nullable=True)
    birth_place_id = Column(UUID(as_uuid=True), ForeignKey("places.id", ondelete="SET NULL"), nullable=True)
    death_place = Column(String, nullable=True)
    death_place_id = Column(UUID(as_uuid=True), ForeignKey("places.id", ondelete="SET NULL"), nullable=True)

    # === CAREER ===
    occupations = Column(ARRAY(String), nullable=True, server_default="{}")
    literary_movements = Column(ARRAY(String), nullable=True, server_default="{}")
    active_from_year = Column(Integer, nullable=True)
    active_to_year = Column(Integer, nullable=True)

    # === BIBLIOGRAPHY ===
    notable_works = Column(ARRAY(String), nullable=True, server_default="{}")
    genres = Column(ARRAY(String), nullable=True, server_default="{}")
    writing_languages = Column(ARRAY(String), nullable=True, server_default="{}")

    # === TAXONOMY EXTENDED ===
    themes = Column(ARRAY(String), nullable=True, server_default="{}")
    motifs = Column(ARRAY(String), nullable=True, server_default="{}")
    concepts = Column(ARRAY(String), nullable=True, server_default="{}")
    atmospheres = Column(ARRAY(String), nullable=True, server_default="{}")

    # === ABOUT ===
    hero_quote = Column(String, nullable=True)
    about_summary = Column(String, nullable=True)

    # === IDENTITY EXTENDED ===
    ethnic_origin = Column(String, nullable=True)
    cultural_identity = Column(String, nullable=True)

    # === MEDIA ===
    photo = Column(String, nullable=True)
    gallery = Column(ARRAY(String), nullable=True, server_default="{}")
    signature_image = Column(String, nullable=True)
    portrait_caption = Column(String, nullable=True)
    hero_background_url = Column(String, nullable=True)
    author_intro_quote = Column(String, nullable=True)

    # === SYSTEM ===
    creation_type = Column(String, default="individual_author", nullable=False)
    metadata_status = Column(String, default="draft", nullable=False)
    # draft | identity_complete | editorial_complete | knowledge_complete | review_ready | golden

    books = relationship(
        "Book",
        back_populates="author_ref"
    )
    book_refs = relationship(
        "Book",
        secondary="book_authors",
        back_populates="authors"
    )
    knowledge_nodes = relationship(
        "KnowledgeNode",
        back_populates="author"
    )

    awards = relationship("AuthorAward", back_populates="author", cascade="all, delete-orphan")
    timeline_events = relationship(
        "TimelineEvent",
        back_populates="author",
        cascade="all, delete-orphan",
        order_by="TimelineEvent.sort_order"
    )

    citizenships = relationship(
        "AuthorCitizenship",
        back_populates="author",
        cascade="all, delete-orphan",
        order_by="AuthorCitizenship.from_date"
    )

    residences = relationship(
        "AuthorResidence",
        back_populates="author",
        cascade="all, delete-orphan",
        order_by="AuthorResidence.from_date"
    )

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
