import re
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncSession
from unidecode import unidecode

from app.models.book import Book


UUID_SHAPED_SLUG = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
)


def slugify_book_title(title: str) -> str:
    """Return a locale-independent, URL-safe slug base for a book title."""
    value = unidecode(title or "").lower()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    value = value or "book"
    return f"book-{value}" if UUID_SHAPED_SLUG.fullmatch(value) else value


async def generate_unique_book_slug(
    db: AsyncSession | AsyncConnection,
    title: str,
    *,
    publication_year: Optional[int] = None,
    book_id: Optional[UUID] = None,
) -> str:
    """Generate a readable unique slug; callers persist it unchanged on edits."""
    base = slugify_book_title(title)
    candidates = [base]
    if publication_year:
        candidates.append(f"{base}-{publication_year}")

    stable_id = book_id or uuid4()
    candidates.append(f"{base}-{str(stable_id)[:8]}")

    for candidate in candidates:
        result = await db.execute(select(Book.id).where(Book.slug == candidate))
        if result.scalar_one_or_none() is None:
            return candidate

    return f"{base}-{stable_id}"
