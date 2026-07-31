"""One-time migration: materialize the Author taxonomy cache columns from the
KnowledgeGraph relations.

The KnowledgeGraph (KnowledgeNode + AuthorKnowledgeRelation) is the single
source of truth; the Author plain-text array/scalar columns are a cache.
This script re-derives the cache for every author.

Idempotent — safe to run multiple times.

Usage:
    python -m app.scripts.materialize_author_taxonomy            # normal
    python -m app.scripts.materialize_author_taxonomy --dry-run  # preview
"""
import asyncio
import logging
import sys

from sqlalchemy import select

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("materialize_author_taxonomy")


async def run(dry_run: bool = False) -> None:
    from app.database import AsyncSessionLocal
    from app.models.author import Author
    from app.services.knowledge_graph import materialize_author_taxonomy_cache

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Author.id))
        author_ids = result.scalars().all()

        processed = 0
        for author_id in author_ids:
            if dry_run:
                processed += 1
                continue
            try:
                await materialize_author_taxonomy_cache(db, author_id)
                await db.commit()
                processed += 1
            except Exception as e:
                await db.rollback()
                logger.error("Failed to materialize author %s: %s", author_id, e)

        print(
            f"{'[DRY-RUN] Would process' if dry_run else 'Materialized cache for'} "
            f"{processed} authors"
        )


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    asyncio.run(run(dry_run=dry_run))


if __name__ == "__main__":
    main()
