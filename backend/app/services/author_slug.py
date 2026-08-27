"""Deterministic, LLM-free Author slug generation and read-only audit helpers."""

from __future__ import annotations

import re
import unicodedata
from collections import Counter
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from unidecode import unidecode

from app.models.author import Author


def author_slug_base(canonical_name: str | None) -> str | None:
    text = unicodedata.normalize("NFKC", canonical_name or "").strip()
    if not text:
        return None
    ascii_text = unidecode(text).casefold()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text).strip("-")
    return slug or None


async def _available(db: AsyncSession, slug: str, author_id: UUID) -> bool:
    result = await db.execute(select(Author.id).where(Author.slug == slug, Author.id != author_id))
    return result.scalar_one_or_none() is None


async def generate_author_slug(
    db: AsyncSession,
    *,
    canonical_name: str,
    author_id: UUID,
    birth_year: int | None = None,
    existing_slug: str | None = None,
) -> str:
    """Return a stable unique slug, preserving an existing slug by default."""
    if existing_slug and existing_slug.strip():
        return existing_slug.strip()
    base = author_slug_base(canonical_name)
    if not base:
        raise ValueError("canonical Author name cannot produce a URL-safe slug")
    if await _available(db, base, author_id):
        return base
    if birth_year is not None:
        dated = f"{base}-{birth_year}"
        if await _available(db, dated, author_id):
            return dated
    for length in (8, 12, 32):
        stable = f"{base}-{author_id.hex[:length]}"
        if await _available(db, stable, author_id):
            return stable
    raise ValueError("stable Author slug collision could not be resolved")


@dataclass(frozen=True)
class AuthorSlugAuditRow:
    author_id: str
    name: str | None
    existing_slug: str | None
    proposed_base: str | None
    classifications: tuple[str, ...]
    suspicious_language_overlap: tuple[str, ...]


def audit_author_slug_records(authors: list[Author]) -> list[AuthorSlugAuditRow]:
    """Pure read-only compatibility report; never changes the supplied rows."""
    bases = [author_slug_base(author.name) for author in authors]
    base_counts = Counter(base for base in bases if base)
    rows = []
    for author, base in zip(authors, bases):
        existing = (author.slug or "").strip() or None
        classes: list[str] = []
        if not base:
            classes.append("insufficient_canonical_name")
        elif not existing:
            classes.append("missing_slug")
        elif existing == base:
            classes.append("valid_existing_slug")
        else:
            classes.append("slug_differs_from_deterministic_proposal")
        if base and base_counts[base] > 1:
            classes.append("potential_collision")
        spoken = {str(value).strip().casefold() for value in (author.languages or []) if str(value).strip()}
        written = {str(value).strip().casefold() for value in (author.writing_languages or []) if str(value).strip()}
        rows.append(AuthorSlugAuditRow(
            str(author.id), author.name, existing, base, tuple(classes), tuple(sorted(spoken & written))
        ))
    return rows


async def audit_existing_authors(db: AsyncSession) -> list[AuthorSlugAuditRow]:
    result = await db.execute(select(Author).order_by(Author.name, Author.id))
    return audit_author_slug_records(list(result.scalars().all()))
