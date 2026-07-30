"""
Migrate existing author notable_works strings into AuthorPublication records.

This script parses notable_works entries in the format:
  "RussianTitle (OriginalTitle, Year) — type"
or
  "RussianTitle (OriginalTitle, Year)"
or
  "RussianTitle (OriginalTitle)"

Creates AuthorPublication records for each parseable entry.
Existing notable_works are preserved as a legacy fallback.
"""
import asyncio
import re
import sys
import os
from typing import Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_db
from app.models.author import Author
from app.models.author_publication import AuthorPublication
from sqlalchemy import select


NOTABLE_WORK_PATTERN = re.compile(
    r'^(?P<title>.+?)\s*\((?P<original_title>[^,]+?)(?:,\s*(?P<year>\d{4}))?\)(?:\s*[—–-]\s*(?P<pub_type>.+))?$'
)


def parse_notable_work(entry: str) -> Optional[dict]:
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


async def migrate_author(author: Author) -> int:
    if not author.notable_works:
        return 0

    result = await db_session.execute(
        select(AuthorPublication).where(AuthorPublication.author_id == author.id).limit(1)
    )
    existing = result.scalar_one_or_none()
    if existing:
        print(f"  SKIP (publications already exist) — {author.display_name or author.name}")
        return 0

    created = 0
    for entry in author.notable_works:
        parsed = parse_notable_work(entry)
        if not parsed:
            print(f"  SKIP (unparseable): {entry[:60]}")
            continue
        pub = AuthorPublication(author_id=author.id, **parsed)
        db_session.add(pub)
        created += 1

    if created:
        await db_session.commit()
        print(f"  Created {created} publications for {author.display_name or author.name}")
    return created


async def main():
    global db_session
    async for session in get_db():
        db_session = session
        result = await db_session.execute(
            select(Author).where(Author.notable_works.isnot(None))
        )
        authors = result.scalars().all()
        print(f"Found {len(authors)} authors with notable_works")
        total = 0
        for author in authors:
            count = await migrate_author(author)
            total += count
        print(f"\nDone. Created {total} publication records total.")
        break


if __name__ == "__main__":
    asyncio.run(main())
