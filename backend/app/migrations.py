"""Explicit database migration and bootstrap entrypoint.

Schema changes belong to the deployment phase, not API process startup.  The
only compatibility exception is a completely empty database: the historical
``0001_baseline`` migration represents a schema that was originally created
with SQLAlchemy metadata, so a fresh installation must create that baseline
before it can be stamped at the current head.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import inspect

import app.models  # noqa: F401 -- register every model on Base.metadata
from app.database import Base, engine
from app.schema_check import assert_schema_matches


BACKEND_DIR = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class DatabaseState:
    revision: str | None
    tables: frozenset[str]


def alembic_config() -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    return config


def expected_head() -> str:
    return ScriptDirectory.from_config(alembic_config()).get_current_head()


async def inspect_database() -> DatabaseState:
    async with engine.connect() as conn:
        def inspect_sync(sync_conn):
            inspector = inspect(sync_conn)
            return DatabaseState(
                revision=MigrationContext.configure(sync_conn).get_current_revision(),
                tables=frozenset(inspector.get_table_names()),
            )

        return await conn.run_sync(inspect_sync)


async def _bootstrap_empty_database() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(lambda sync_conn: assert_schema_matches(sync_conn, Base.metadata))


async def _run_and_dispose(awaitable):
    try:
        return await awaitable
    finally:
        await engine.dispose()


async def assert_database_at_head() -> None:
    state = await inspect_database()
    head = expected_head()
    if state.revision != head:
        raise RuntimeError(
            f"Database migration required: current={state.revision!r}, expected={head!r}. "
            "Run `python -m app.migrations upgrade` before starting the API."
        )
    async with engine.connect() as conn:
        await conn.run_sync(lambda sync_conn: assert_schema_matches(sync_conn, Base.metadata))


def upgrade_database() -> None:
    """Bring an existing DB to head, or initialize a provably empty DB."""
    state = asyncio.run(_run_and_dispose(inspect_database()))
    config = alembic_config()

    if state.revision is None:
        application_tables = state.tables - {"alembic_version"}
        if application_tables:
            names = ", ".join(sorted(application_tables))
            raise RuntimeError(
                "Refusing to stamp an unversioned non-empty database. "
                f"Found tables: {names}. Reconcile it explicitly first."
            )
        asyncio.run(_run_and_dispose(_bootstrap_empty_database()))
        command.stamp(config, "head")
    else:
        command.upgrade(config, "head")

    asyncio.run(_run_and_dispose(assert_database_at_head()))


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Manage the Syverro database schema")
    parser.add_argument("action", choices=("upgrade", "check"))
    args = parser.parse_args()
    if args.action == "upgrade":
        upgrade_database()
    else:
        asyncio.run(_run_and_dispose(assert_database_at_head()))


if __name__ == "__main__":
    main()
