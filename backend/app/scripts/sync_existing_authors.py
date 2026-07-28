"""One-time migration: backfill KnowledgeNodes + AuthorKnowledgeRelations
from existing Author plain-text columns (occupations, literary_movements, genres).

Idempotent — safe to run multiple times. Only creates missing nodes/relations.

Usage:
    python -m app.scripts.sync_existing_authors          # normal
    python -m app.scripts.sync_existing_authors --dry-run # preview only
"""
import asyncio
import logging
import sys

from sqlalchemy import select

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("sync_existing_authors")


async def run_sync(dry_run: bool = False) -> None:
    from app.database import AsyncSessionLocal
    from app.models.author import Author
    from app.services.knowledge_graph import (
        GRAPH_FIELD_MAP,
        sync_author_graph_fields,
    )

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Author).order_by(Author.name))
        authors = result.scalars().all()

        stats = {"total": len(authors), "updated": 0, "skipped": 0}
        field_counts = {f: 0 for f in GRAPH_FIELD_MAP}

        for author in authors:
            update_data = {}
            for field_name in GRAPH_FIELD_MAP:
                values = getattr(author, field_name, None)
                if values and isinstance(values, list) and any(v for v in values if v.strip()):
                    update_data[field_name] = values
                    field_counts[field_name] += 1

            if not update_data:
                stats["skipped"] += 1
                continue

            if dry_run:
                logger.info(
                    "[DRY-RUN] Would sync author %s (%s) — fields: %s",
                    author.id, author.name,
                    {k: v for k, v in update_data.items()},
                )
                stats["updated"] += 1
                continue

            try:
                await sync_author_graph_fields(db, author.id, update_data)
                await db.commit()
                stats["updated"] += 1
                logger.info("Synced author %s (%s)", author.id, author.name)
            except Exception as e:
                await db.rollback()
                logger.error("Failed to sync author %s (%s): %s", author.id, author.name, e)
                stats["skipped"] += 1

        print()
        print("=" * 60)
        print(f"  SYNC SUMMARY{' (DRY-RUN)' if dry_run else ''}")
        print("=" * 60)
        print(f"  Total authors:    {stats['total']}")
        print(f"  Updated:          {stats['updated']}")
        print(f"  Skipped:          {stats['skipped']}")
        if not dry_run:
            print("  ---")
            for field_name, count in field_counts.items():
                print(f"  {field_name}: {count} authors with values")
        print("=" * 60)


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    asyncio.run(run_sync(dry_run=dry_run))


if __name__ == "__main__":
    main()
