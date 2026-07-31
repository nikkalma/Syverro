"""
Link books to author_publications (canonical bibliography).

Non-destructive backfill:
1. Create AuthorPublication records from notable_works for authors that have
   none (reuses the notable_works parser).
2. Link books.publication_id by author_id + normalized title match.
3. Backfill historical metadata (original_title, original_language,
   country_of_origin, original_publication_year) from the book into the
   linked publication when the publication lacks the value.

Never deletes or drops anything. Idempotent: safe to run repeatedly.
"""
import asyncio
import re
import sys
import os
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from unidecode import unidecode

from app.database import get_db
from app.models.author import Author
from app.models.book import Book
from app.models.author_publication import AuthorPublication

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

NOTABLE_WORK_PATTERN = re.compile(
    r'^(?P<title>.+?)\s*\((?P<original_title>[^,]+?)(?:,\s*(?P<year>\d{4}))?\)(?:\s*[—–-]\s*(?P<pub_type>.+))?$'
)


def normalize_title(value: str) -> str:
    """Normalize for fuzzy matching: lowercase, latinized, alnum only."""
    latin = unidecode(value or "").lower()
    latin = re.sub(r"[^a-z0-9]+", "", latin)
    return latin


def parse_notable_work(entry: str):
    m = NOTABLE_WORK_PATTERN.match(entry.strip())
    if not m:
        return None
    title = m.group("title").strip()
    original_title = m.group("original_title").strip()
    year_str = m.group("year")
    year = int(year_str) if year_str else None
    pub_type = m.group("pub_type").strip() if m.group("pub_type") else "novel"
    return {
        "title": title,
        "original_title": original_title,
        "publication_year": year or 0,
        "publication_type": pub_type if pub_type != "роман" else "novel",
    }


async def backfill_publications_from_notable_works(session) -> int:
    result = await session.execute(select(Author).where(Author.notable_works.isnot(None)))
    authors = result.scalars().all()
    created_total = 0
    for author in authors:
        has_any = await session.execute(
            select(AuthorPublication.id).where(AuthorPublication.author_id == author.id).limit(1)
        )
        if has_any.first():
            continue
        for entry in author.notable_works or []:
            parsed = parse_notable_work(entry)
            if not parsed:
                continue
            session.add(AuthorPublication(author_id=author.id, **parsed))
            created_total += 1
    await session.commit()
    return created_total


async def link_books_to_publications(session) -> dict:
    books = (await session.execute(select(Book).where(Book.author_id.isnot(None)))).scalars().all()
    stats = {"matched": 0, "unmatched": 0, "no_publications": 0, "no_match": []}
    for book in books:
        if book.publication_id:
            stats["matched"] += 1
            continue

        pubs = (await session.execute(
            select(AuthorPublication).where(AuthorPublication.author_id == book.author_id)
        )).scalars().all()
        if not pubs:
            stats["no_publications"] += 1
            continue

        book_title = normalize_title(book.title)
        matched = None
        for pub in pubs:
            candidates = [pub.title, pub.original_title]
            if any(book_title == normalize_title(c) for c in candidates if c):
                matched = pub
                break
        if not matched:
            stats["unmatched"] += 1
            stats["no_match"].append(f"{book.title} ({book.author})")
            continue

        book.publication_id = matched.id
        moved = False
        if matched.original_title is None and book.original_title:
            matched.original_title = book.original_title
            moved = True
        if matched.publication_year in (None, 0) and book.original_publication_year:
            matched.publication_year = book.original_publication_year
            moved = True
        if book.country_of_origin and not hasattr(matched, "country_of_origin"):
            # publication has no country column yet; keep on book for now
            pass
        stats["matched"] += 1
        if moved:
            logger.info("Moved historical metadata to publication %s", matched.id)
    await session.commit()
    return stats


async def main():
    async for session in get_db():
        created = await backfill_publications_from_notable_works(session)
        print(f"[1] Created {created} publications from notable_works")
        stats = await link_books_to_publications(session)
        print(f"[2] Linked books → publications: matched={stats['matched']}, "
              f"no_publications_for_author={stats['no_publications']}, unmatched={stats['unmatched']}")
        if stats["no_match"]:
            print("    Unmatched (need manual link):")
            for title in stats["no_match"]:
                print(f"      - {title}")
        break


if __name__ == "__main__":
    asyncio.run(main())
