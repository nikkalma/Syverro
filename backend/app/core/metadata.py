"""Metadata completeness calculator for the enrichment workflow."""

from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.book import Book
from app.models.author import Author


REQUIRED_BOOK_FIELDS = ["title", "author_id", "description", "cover"]
REQUIRED_AUTHOR_FIELDS = ["name", "country"]


def calculate_missing_fields(book: Book, author: Author | None) -> List[str]:
    """Return list of field names that are missing for metadata completeness."""
    missing = []

    # Book fields
    for field in REQUIRED_BOOK_FIELDS:
        val = getattr(book, field, None)
        if val is None or (isinstance(val, str) and not val.strip()):
            missing.append(field)

    # At least one genre
    if not book.genres or len(book.genres) == 0:
        missing.append("genres")

    # Author must be linked
    if not author:
        missing.append("author_id")
    else:
        for field in REQUIRED_AUTHOR_FIELDS:
            val = getattr(author, field, None)
            if val is None or (isinstance(val, str) and not val.strip()):
                missing.append(f"author_{field}")

    return missing


def get_metadata_status(missing: List[str]) -> str:
    """Return metadata_status based on missing fields."""
    if len(missing) == 0:
        return "complete"
    return "incomplete"
