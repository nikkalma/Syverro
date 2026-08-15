"""Integration coverage for the deployment migration boundary."""

from __future__ import annotations

import os
from pathlib import Path
import subprocess
import sys

import pytest
from alembic.migration import MigrationContext
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine


BACKEND_DIR = Path(__file__).parents[1]
TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://test:test@localhost:5432/syverro_test",
    ),
)


def _run_migration_command(action: str) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env["DATABASE_URL"] = TEST_DATABASE_URL
    env.setdefault("SECRET_KEY", "test-secret-key")
    env["ENVIRONMENT"] = "test"
    return subprocess.run(
        [sys.executable, "-m", "app.migrations", action],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )


@pytest.fixture
async def migration_engine():
    engine = create_async_engine(TEST_DATABASE_URL)
    initialized = False
    try:
        try:
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
        except Exception:
            await engine.dispose()
            pytest.skip(f"Postgres not reachable at {TEST_DATABASE_URL}")
        async with engine.begin() as conn:
            await conn.execute(text("DROP SCHEMA public CASCADE"))
            await conn.execute(text("CREATE SCHEMA public"))
        initialized = True
        yield engine
    finally:
        if initialized:
            async with engine.begin() as conn:
                await conn.execute(text("DROP SCHEMA public CASCADE"))
                await conn.execute(text("CREATE SCHEMA public"))
        await engine.dispose()


def test_expected_head_is_security_audit_revision():
    from app.migrations import expected_head

    assert expected_head() == "0020_security_audit_logs"


@pytest.mark.asyncio
async def test_empty_database_bootstraps_to_head(migration_engine):
    result = _run_migration_command("upgrade")
    assert result.returncode == 0, result.stdout + result.stderr

    async with migration_engine.connect() as conn:
        revision = await conn.run_sync(
            lambda sync_conn: MigrationContext.configure(sync_conn).get_current_revision()
        )
        columns = await conn.run_sync(
            lambda sync_conn: {
                column["name"] for column in inspect(sync_conn).get_columns("users")
            }
        )
        table_names = await conn.run_sync(
            lambda sync_conn: set(inspect(sync_conn).get_table_names())
        )

    assert revision == "0020_security_audit_logs"
    assert {
        "email_verified",
        "email_verification_token_hash",
        "email_verification_expires_at",
    } <= columns
    assert "refresh_sessions" in table_names
    assert "security_audit_logs" in table_names
    assert _run_migration_command("check").returncode == 0


@pytest.mark.asyncio
async def test_revision_0017_is_upgraded_before_backend_start(migration_engine):
    initial = _run_migration_command("upgrade")
    assert initial.returncode == 0, initial.stdout + initial.stderr

    async with migration_engine.begin() as conn:
        await conn.execute(text("DROP TABLE security_audit_logs"))
        await conn.execute(text("DROP TABLE refresh_sessions"))
        await conn.execute(
            text(
                "ALTER TABLE users "
                "DROP COLUMN email_verification_expires_at, "
                "DROP COLUMN email_verification_token_hash, "
                "DROP COLUMN email_verified"
            )
        )
        await conn.execute(
            text("UPDATE alembic_version SET version_num = '0017_book_slugs'")
        )

    result = _run_migration_command("upgrade")
    assert result.returncode == 0, result.stdout + result.stderr

    async with migration_engine.connect() as conn:
        revision = await conn.run_sync(
            lambda sync_conn: MigrationContext.configure(sync_conn).get_current_revision()
        )
        columns = await conn.run_sync(
            lambda sync_conn: {
                column["name"] for column in inspect(sync_conn).get_columns("users")
            }
        )

    assert revision == "0020_security_audit_logs"
    assert "email_verified" in columns


@pytest.mark.asyncio
async def test_unversioned_nonempty_database_is_rejected(migration_engine):
    async with migration_engine.begin() as conn:
        await conn.execute(text("CREATE TABLE legacy_data (id INTEGER PRIMARY KEY)"))

    result = _run_migration_command("upgrade")

    assert result.returncode != 0
    assert "Refusing to stamp an unversioned non-empty database" in result.stderr
