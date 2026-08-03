"""Import legacy books.json catalog into the Syverro database.

Usage:
    python -m app.scripts.import_legacy_books
    python -m app.scripts.import_legacy_books --file path/to/books.json

The script connects to the configured database and imports books
with pending moderation status. Idempotent — safe to run multiple times.
"""
import argparse
import asyncio
import json
import logging
import re
import unicodedata
import sys
from pathlib import Path
from typing import Optional

from sqlalchemy import select, text

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s: %(message)s",
)
logger = logging.getLogger("import_legacy_books")

# Default path relative to project root
DEFAULT_JSON_PATH = "web/src/data/books.json"


# =============================================================================
# NORMALIZATION
# =============================================================================


def normalize_name(name: str) -> str:
    """Normalize a name for idempotent duplicate detection.

    Handles case folding, whitespace collapse, Unicode NFKC normalization,
    and smart/curly quote conversion to straight quotes.
    """
    name = unicodedata.normalize("NFKC", name)
    name = name.strip().lower()
    name = re.sub(r"\s+", " ", name)
    name = name.replace("\u2018", "'").replace("\u2019", "'")
    name = name.replace("\u201c", '"').replace("\u201d", '"')
    return name


# =============================================================================
# IMPORT
# =============================================================================


async def run_import(file_path: str) -> None:
    """Load JSON, deduplicate, create books and authors, print summary."""
    from app.database import AsyncSessionLocal
    from app.models.book import Book
    from app.models.author import Author
    from app.models.genre import Genre  # noqa: F401 — registers Genre class for relationship resolution
    from app.models.user_book import UserBook  # noqa: F401 — registers UserBook class for relationship resolution
    from app.models.book_author import book_authors
    from app.models.book_genre import book_genres  # noqa: F401 — registers book_genres secondary table
    from app.services.book_slug import generate_unique_book_slug

    # ---- Load JSON ----
    json_path = Path(file_path)
    if not json_path.exists():
        logger.error(f"File not found: {json_path.resolve()}")
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        raw_books = json.load(f)

    if not isinstance(raw_books, list):
        logger.error("JSON must be a top-level array of books")
        sys.exit(1)

    logger.info(f"Loaded {len(raw_books)} entries from {json_path}")

    # ---- Connect ----
    async with AsyncSessionLocal() as db:
        try:
            await db.execute(text("SELECT 1"))
            logger.info("Database connection OK")
        except Exception as exc:
            logger.error(f"Database connection failed: {exc}")
            sys.exit(1)

        # ---- Build dedup set ----
        existing_result = await db.execute(select(Book.title, Book.author))
        existing_set: set[tuple[str, str]] = set()
        for row in existing_result:
            existing_set.add((normalize_name(row.title), normalize_name(row.author)))
        logger.info(f"Existing books in DB: {len(existing_set)}")

        # ---- Build author map ----
        author_result = await db.execute(select(Author))
        author_map: dict[str, Author] = {}
        for author in author_result.scalars().all():
            author_map[normalize_name(author.name)] = author
        logger.info(f"Existing authors in DB: {len(author_map)}")

        # ---- Stats ----
        stats = {
            "total_in_file": len(raw_books),
            "imported": 0,
            "skipped_duplicates": 0,
            "skipped_invalid": 0,
            "authors_created": 0,
            "authors_reused": 0,
        }

        # ---- Process ----
        for idx, raw in enumerate(raw_books):
            # -- Validate title --
            title = raw.get("title")
            if not title or not isinstance(title, str) or not title.strip():
                stats["skipped_invalid"] += 1
                continue

            # -- Validate author --
            author_name = raw.get("author", "")
            if not author_name or not isinstance(author_name, str) or not author_name.strip():
                stats["skipped_invalid"] += 1
                logger.warning(
                    f"[{idx + 1}] Skipped: no author for \"{title.strip()[:60]}\""
                )
                continue

            title = title.strip()
            author_name = author_name.strip()
            norm_title = normalize_name(title)
            norm_author = normalize_name(author_name)

            # -- Dedup check --
            if (norm_title, norm_author) in existing_set:
                stats["skipped_duplicates"] += 1
                continue

            # -- Find or create Author --
            author = author_map.get(norm_author)
            if author is None:
                author = Author(
                    name=author_name,
                    country=(
                        raw.get("authorCountry")
                        if isinstance(raw.get("authorCountry"), str)
                        and raw["authorCountry"].strip()
                        else None
                    ),
                )
                db.add(author)
                await db.flush()
                author_map[norm_author] = author
                stats["authors_created"] += 1
            else:
                stats["authors_reused"] += 1

            # -- Create Book --
            cover: Optional[str] = raw.get("cover")
            if not isinstance(cover, str) or not cover.strip():
                cover = None

            description: Optional[str] = raw.get("description")
            if not isinstance(description, str) or not description.strip():
                description = None

            total_pages: Optional[int] = raw.get("totalPages")
            if not isinstance(total_pages, int):
                total_pages = None

            orig_year: Optional[int] = raw.get("originalYear")
            if not isinstance(orig_year, int):
                orig_year = None

            orig_lang: Optional[str] = raw.get("originalLanguage")
            if not isinstance(orig_lang, str) or not orig_lang.strip():
                orig_lang = None

            book = Book(
                title=title,
                author=author_name,
                author_id=author.id,
                cover=cover,
                description=description,
                total_pages=total_pages,
                original_publication_year=orig_year,
                original_language=orig_lang,
                is_published=False,
                publication_type="official",
                metadata_status="incomplete",
                moderation_status="pending",
            )
            book.slug = await generate_unique_book_slug(
                db,
                title,
                publication_year=orig_year,
            )
            db.add(book)
            await db.flush()

            # Link via book_authors
            await db.execute(
                book_authors.insert().values(book_id=book.id, author_id=author.id)
            )

            existing_set.add((norm_title, norm_author))
            stats["imported"] += 1

        await db.commit()

        # ---- Summary ----
        print()
        print("=" * 60)
        print("  IMPORT SUMMARY")
        print("=" * 60)
        print(f"  Total entries in file:  {stats['total_in_file']}")
        print(f"  Imported:               {stats['imported']}")
        print(f"  Skipped duplicates:     {stats['skipped_duplicates']}")
        print(f"  Skipped invalid:        {stats['skipped_invalid']}")
        print(f"  Authors created:        {stats['authors_created']}")
        print(f"  Authors reused:         {stats['authors_reused']}")
        print("=" * 60)


# =============================================================================
# CLI ENTRY POINT
# =============================================================================


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Import legacy books.json into Syverro database"
    )
    parser.add_argument(
        "--file",
        default=DEFAULT_JSON_PATH,
        help=f"Path to books.json (default: {DEFAULT_JSON_PATH})",
    )
    args = parser.parse_args()
    asyncio.run(run_import(args.file))


if __name__ == "__main__":
    main()
