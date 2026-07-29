"""Backfill structured name fields for existing Author records.

Parses the legacy `name` field into first_name, middle_name, last_name.
Recomputes sort_name for every author using the canonical algorithm:

  if last_name exists:
    sort_name = "{last_name}, {first_name} {middle_name}"
  else:
    sort_name = display_name or name

Usage:
    python -m app.scripts.backfill_author_names

Safe to run multiple times. Idempotent.
"""
import asyncio
import logging
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

    Returns dict with first_name, middle_name, last_name.
    """
    parts = [p.strip() for p in name.split(",")]
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None

    if len(parts) == 2:
        last_name = parts[0].strip()
        after_comma = [w.strip() for w in parts[1].split() if w.strip()]
        if after_comma:
            first_name = after_comma[0]
            if len(after_comma) > 1:
                middle_name = " ".join(after_comma[1:])
    elif len(parts) == 1:
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
    }


def compute_sort_name(last_name: Optional[str], first_name: Optional[str], middle_name: Optional[str], display_name: Optional[str], name: str) -> str:
    """Compute sort_name using the canonical algorithm."""
    if last_name:
        given = [p for p in [first_name, middle_name] if p]
        return last_name + ", " + " ".join(given) if given else last_name
    return display_name or name


async def run_backfill() -> None:
    from app.database import AsyncSessionLocal
    from app.models.author import Author

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Author).order_by(Author.name))
        authors = result.scalars().all()

        stats = {
            "total_authors": len(authors),
            "gen_from_last_name": 0,
            "gen_from_display_name": 0,
            "gen_from_name": 0,
            "updated_existing": 0,
            "already_correct": 0,
            "errors": 0,
        }

        for author in authors:
            needs_update = False

            try:
                parsed = parse_author_name(author.name)

                if not author.first_name and parsed["first_name"]:
                    author.first_name = parsed["first_name"]
                    needs_update = True

                if not author.middle_name and parsed["middle_name"]:
                    author.middle_name = parsed["middle_name"]
                    needs_update = True

                if not author.last_name and parsed["last_name"]:
                    author.last_name = parsed["last_name"]
                    needs_update = True

                # Always recompute sort_name with the canonical algorithm
                new_sort_name = compute_sort_name(
                    author.last_name,
                    author.first_name,
                    author.middle_name,
                    author.display_name,
                    author.name,
                )

                if new_sort_name != author.sort_name:
                    was_null = not author.sort_name

                    if was_null and author.last_name:
                        stats["gen_from_last_name"] += 1
                    elif was_null and author.display_name:
                        stats["gen_from_display_name"] += 1
                    elif was_null:
                        stats["gen_from_name"] += 1
                    else:
                        stats["updated_existing"] += 1

                    author.sort_name = new_sort_name
                    needs_update = True
                elif not needs_update:
                    stats["already_correct"] += 1

                if needs_update:
                    logger.info(
                        f"  Updated {author.name!r}: "
                        f"first={author.first_name!r}, "
                        f"middle={author.middle_name!r}, "
                        f"last={author.last_name!r}, "
                        f"sort={author.sort_name!r}"
                    )
            except Exception as e:
                stats["errors"] += 1
                logger.error(f"  Error processing {author.name!r}: {e}")

        await db.commit()

        print()
        print("=" * 60)
        print("  Author sort_name backfill report")
        print("=" * 60)
        print(f"  Total authors: {stats['total_authors']}")
        print()
        print("  Generated:")
        print(f"    from last_name:      {stats['gen_from_last_name']}")
        print(f"    from display_name:   {stats['gen_from_display_name']}")
        print(f"    from name:           {stats['gen_from_name']}")
        print()
        print(f"  Updated existing: {stats['updated_existing']}")
        print(f"  Already correct:  {stats['already_correct']}")
        print(f"  Errors:           {stats['errors']}")
        print("=" * 60)


def main() -> None:
    asyncio.run(run_backfill())


if __name__ == "__main__":
    main()
