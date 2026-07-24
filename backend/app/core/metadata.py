"""Metadata completeness calculator for the enrichment workflow."""

from typing import List
from app.models.book import Book


REQUIRED_BOOK_FIELDS = ["title", "description", "cover"]


def calculate_missing_fields(book: Book, author_count: int = 0, genre_count: int = 0) -> List[str]:
    """Return list of field names that are missing for metadata completeness.

    author_count and genre_count should be queried from the M:N relations
    (book_authors and book_genres respectively) by the caller.
    """
    missing = []

    for field in REQUIRED_BOOK_FIELDS:
        val = getattr(book, field, None)
        if val is None or (isinstance(val, str) and not val.strip()):
            missing.append(field)

    if genre_count == 0:
        missing.append("genres")

    if author_count == 0:
        missing.append("authors")

    return missing


def get_metadata_status(missing: List[str]) -> str:
    """Return metadata_status based on missing fields."""
    if len(missing) == 0:
        return "complete"
    return "incomplete"
