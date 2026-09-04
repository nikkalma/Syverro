from sqlalchemy import CheckConstraint, Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class AuthorPublicationAuthor(Base):
    """Canonical, ordered authorship of an AuthorPublication Work."""

    __tablename__ = "author_publication_authors"

    publication_id = Column(
        UUID(as_uuid=True),
        ForeignKey("author_publications.id", ondelete="CASCADE"),
        primary_key=True,
    )
    author_id = Column(
        UUID(as_uuid=True),
        ForeignKey("authors.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    position = Column(Integer, nullable=False)
    credited_name = Column(String, nullable=True)

    publication = relationship("AuthorPublication", back_populates="authorships")
    author = relationship("Author")

    __table_args__ = (
        UniqueConstraint(
            "publication_id",
            "position",
            name="uq_author_publication_authors_position",
        ),
        CheckConstraint("position >= 1", name="ck_author_publication_authors_position_positive"),
    )
