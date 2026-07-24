"""Metadata lifecycle service for the enrichment workflow.

All metadata_status calculations go through this service.
Callers should never calculate metadata_status inline.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.book import Book
from app.core.metadata import calculate_missing_fields, get_metadata_status
from app.services.book_service import get_book_author_count, get_book_genre_ids


async def recalculate_metadata_status(db: AsyncSession, book: Book) -> str:
    """Recalculate and update book.metadata_status based on M:N sources.

    Reads:
      - Book.title, Book.description, Book.cover (direct fields)
      - book_authors count (M:N)
      - book_genres count (M:N)

    Never reads:
      - Book.genres JSON
      - Book.themes
      - Book.motifs
      - Book.author
      - Book.author_id

    Respects the review_ready lock — if the book is in review_ready,
    status is not auto-downgraded.
    """
    if book.metadata_status == "review_ready":
        return book.metadata_status

    author_count = await get_book_author_count(db, book)
    genre_ids = await get_book_genre_ids(db, book)
    genre_count = len(genre_ids)

    missing = calculate_missing_fields(book, author_count=author_count, genre_count=genre_count)
    new_status = get_metadata_status(missing)

    book.metadata_status = new_status
    return new_status
