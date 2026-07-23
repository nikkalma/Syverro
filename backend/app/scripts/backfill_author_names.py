"""Backfill structured name fields for existing Author records.

Parses the legacy `name` field into first_name, middle_name, last_name,
and sort_name. Only fills empty fields — never overwrites existing values.

Usage:
    python -m app.scripts.backfill_author_names

Safe to run multiple times. Idempotent.
"""
import asyncio
import logging
import sys
from typing import Optional

from sqlalchemy import select

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("backfill_author_names")


def parse_author_name(name: str) -> dict:
    """Parse a full name string into structured components.

    Comma format (e.g. "Брэдбери, Рэй"):
        last_name = before comma
        first_name = first word after comma
        middle_name = remaining words

    Non-comma format:
        1 word  → last_name
        2 words → first_name + last_name
        3+ words → first_name + middle_name(s) + last_name

    Returns dict with first_name, middle_name, last_name, sort_name.
    """
    parts = [p.strip() for p in name.split(",")]
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None

    if len(parts) == 2:
        # "Last, First Middle"
        last_name = parts[0].strip()
        after_comma = [w.strip() for w in parts[1].split() if w.strip()]
        if after_comma:
            first_name = after_comma[0]
            if len(after_comma) > 1:
                middle_name = " ".join(after_comma[1:])
    elif len(parts) == 1:
        # No comma — simple parsing
        words = [w.strip() for w in name.split() if w.strip()]
        if len(words) == 1:
            last_name = words[0]
        elif len(words) == 2:
            first_name = words[0]
            last_name = words[1]
        elif len(words) >= 3:
            first_name = words[0]
            last_name = words[-1]
            middle_name = " ".join(words[1:-1])

    return {
        "first_name": first_name,
        "middle_name": middle_name,
        "last_name": last_name,
        "sort_name": name,
    }


async def run_backfill() -> None:
    from app.database import AsyncSessionLocal
    from app.models.author import Author

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Author).order_by(Author.name))
        authors = result.scalars().all()

        stats = {"total": len(authors), "updated": 0, "skipped": 0}

        for author in authors:
            needs_update = False

            parsed = parse_author_name(author.name)

            # Only fill empty fields — never overwrite
            if not author.first_name and parsed["first_name"]:
                author.first_name = parsed["first_name"]
                needs_update = True

            if not author.middle_name and parsed["middle_name"]:
                author.middle_name = parsed["middle_name"]
                needs_update = True

            if not author.last_name and parsed["last_name"]:
                author.last_name = parsed["last_name"]
                needs_update = True

            if not author.sort_name and parsed["sort_name"]:
                author.sort_name = parsed["sort_name"]
                needs_update = True

            if needs_update:
                stats["updated"] += 1
                logger.info(
                    f"  Updated {author.name!r}: "
                    f"first={author.first_name!r}, "
                    f"middle={author.middle_name!r}, "
                    f"last={author.last_name!r}"
                )
            else:
                stats["skipped"] += 1

        await db.commit()

        print()
        print("=" * 60)
        print("  BACKFILL SUMMARY")
        print("=" * 60)
        print(f"  Total authors:    {stats['total']}")
        print(f"  Updated:          {stats['updated']}")
        print(f"  Skipped (already  {stats['skipped']}")
        print(f"         filled or")
        print(f"         unparseable)")
        print("=" * 60)


def main() -> None:
    asyncio.run(run_backfill())


if __name__ == "__main__":
    main()
