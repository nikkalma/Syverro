from sqlalchemy import Column, String, Text, Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class AuthorPublication(Base):
    __tablename__ = "author_publications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = Column(UUID(as_uuid=True), ForeignKey("authors.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    original_title = Column(String, nullable=True)
    publication_year = Column(Integer, nullable=False, index=True)
    publication_date = Column(Date, nullable=True)
    publication_type = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    pen_name = Column(String, nullable=True)
    wikipedia_url = Column(String, nullable=True)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    author = relationship("Author", backref="author_publications")
    source = relationship("Source", backref="author_publications")
    books = relationship("Book", back_populates="publication")
