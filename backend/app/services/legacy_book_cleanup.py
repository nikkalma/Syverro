"""Legacy Book publication cleanup (dev/local only, never production).

SyvAI's author core now owns canonical author/publication data. Books that are
published or moderation-approved but carry no canonical ``publication_id``
backing are legacy rows created before that flow existed. The cleanup action
resets their moderation and publication state in place — it never deletes rows,
never breaks author/publication relationships, and never touches Author data.

The selection predicate and the reset action are separated so callers can
report exact counts and export a backup before mutating anything.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import or_
from sqlalchemy.orm import Query

from app.models.book import Book

PUBLIC_VISIBILITY_PREDICATE = "is_published IS TRUE AND moderation_status = 'approved' AND deleted_at IS NULL"


def legacy_candidate_books(query: Query) -> Query:
    """Books that look published/approved but lack canonical publication backing."""
    return query.where(
        or_(
            Book.is_published.is_(True),
            Book.moderation_status == "approved",
        ),
        Book.publication_id.is_(None),
    )


def apply_legacy_cleanup(books: list[Book]) -> None:
    """Reset moderation/publication state in place; rows and relations are kept."""
    now = datetime.now(timezone.utc)
    for book in books:
        book.is_published = False
        book.moderation_status = "pending"
        book.moderation_reason = "legacy_cleanup"
        book.moderated_at = now