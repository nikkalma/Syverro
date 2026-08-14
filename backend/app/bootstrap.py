"""Application startup checks and idempotent reference-data bootstrap."""

import logging

from app.database import AsyncSessionLocal, engine
from app.migrations import assert_database_at_head
from app.seeds.catalog_seed import (
    migrate_json_genres_to_relations,
    seed_books,
    seed_genres,
)
from app.seeds.knowledge_graph_seed import seed_knowledge_graph

logger = logging.getLogger(__name__)


async def bootstrap_application() -> None:
    """Validate the schema, then ensure required reference data exists."""
    await assert_database_at_head()
    async with engine.begin() as conn:
        await seed_genres(conn)
        await migrate_json_genres_to_relations(conn)
        await seed_books(conn)
    async with AsyncSessionLocal() as session:
        await seed_knowledge_graph(session)
    logger.info("Database bootstrap complete")
