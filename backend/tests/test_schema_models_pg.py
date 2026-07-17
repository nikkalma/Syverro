"""Integration: real SQLAlchemy models vs Postgres schema."""

from __future__ import annotations

import os

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Import all models so Base.metadata is fully populated.
import app.models  # noqa: F401
from app.database import Base
from app.schema_check import assert_schema_matches, diff_schema

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://test:test@localhost:5432/syverro_test",
    ),
)


def _normalize_async_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


async def _postgres_reachable(url: str) -> bool:
    engine = create_async_engine(url)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
    finally:
        await engine.dispose()


@pytest.fixture
async def pg_engine():
    url = _normalize_async_url(TEST_DATABASE_URL)
    if not await _postgres_reachable(url):
        pytest.skip(f"Postgres not reachable at {url}")

    engine = create_async_engine(url, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.mark.asyncio
async def test_models_match_fresh_database(pg_engine):
    async with pg_engine.connect() as conn:
        await conn.run_sync(lambda c: assert_schema_matches(c, Base.metadata))


@pytest.mark.asyncio
async def test_detects_stale_database_missing_model_column(pg_engine):
    """Simulate: backend models gained a column, DB was not migrated."""
    async with pg_engine.begin() as conn:
        await conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS first_name"))

    async with pg_engine.connect() as conn:
        issues = await conn.run_sync(lambda c: diff_schema(c, Base.metadata))

    assert any(
        i.kind == "missing_column" and "users.first_name" in i.message for i in issues
    )


@pytest.mark.asyncio
async def test_detects_database_ahead_with_required_column(pg_engine):
    """Simulate: DB migration added a required column the backend models lack."""
    async with pg_engine.begin() as conn:
        await conn.execute(
            text(
                "ALTER TABLE users "
                "ADD COLUMN IF NOT EXISTS migration_marker VARCHAR(64) NOT NULL "
                "DEFAULT 'pending'"
            )
        )
        # Make it strictly required without a default for new rows (Postgres).
        await conn.execute(
            text("ALTER TABLE users ALTER COLUMN migration_marker DROP DEFAULT")
        )

    # Build a "stale" model metadata without migration_marker (use real models).
    async with pg_engine.connect() as conn:
        issues = await conn.run_sync(lambda c: diff_schema(c, Base.metadata))

    assert any(
        i.kind == "unexpected_required_column"
        and "migration_marker" in i.message
        for i in issues
    )


@pytest.mark.asyncio
async def test_query_using_model_columns_fails_when_schema_stale(pg_engine):
    """End-to-end symptom: selecting a model column that DB no longer has."""
    from sqlalchemy import select
    from app.models.user import User

    async with pg_engine.begin() as conn:
        await conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS username"))

    async with pg_engine.connect() as conn:
        with pytest.raises(Exception):
            await conn.execute(select(User.id, User.username).limit(1))
