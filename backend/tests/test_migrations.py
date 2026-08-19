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


def test_expected_head_is_syvai_source_discovery_revision():
    from app.migrations import expected_head

    assert expected_head() == "0024_source_discovery"


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
        proposal_columns = await conn.run_sync(
            lambda sync_conn: {
                column["name"] for column in inspect(sync_conn).get_columns("ai_proposals")
            }
        )
        run_columns = await conn.run_sync(
            lambda sync_conn: {
                column["name"] for column in inspect(sync_conn).get_columns("syvai_runs")
            }
        )
        source_columns = await conn.run_sync(
            lambda sync_conn: {
                column["name"] for column in inspect(sync_conn).get_columns("sources")
            }
        )
        candidate_columns = await conn.run_sync(
            lambda sync_conn: {
                column["name"] for column in inspect(sync_conn).get_columns("source_candidates")
            }
        )

    assert revision == "0024_source_discovery"
    assert {
        "email_verified",
        "email_verification_token_hash",
        "email_verification_expires_at",
    } <= columns
    assert "refresh_sessions" in table_names
    assert "security_audit_logs" in table_names
    assert "syvai_runs" in table_names
    assert "ai_proposal_sources" in table_names
    assert {
        "validation_state",
        "conflict_state",
        "review_band",
        "review_reason",
        "edited_value",
        "run_id",
        "applied_at",
        "timeline_event_id",
    } <= proposal_columns
    assert {
        "status",
        "provider",
        "model",
        "input_tokens",
        "output_tokens",
        "total_tokens",
        "duration_ms",
        "estimated_cost_usd",
        "error",
    } <= run_columns
    assert {
        "authority_tier",
        "review_status",
        "normalized_url",
        "discovered_by",
        "discovered_at",
    } <= source_columns
    assert {
        "author_id",
        "run_id",
        "source_id",
        "url",
        "normalized_url",
        "authority_tier",
        "quality_score",
        "assessment",
        "assessment_reason",
        "status",
        "review_action",
        "reviewed_at",
        "reviewed_by",
    } <= candidate_columns

    assert _run_migration_command("check").returncode == 0


@pytest.mark.asyncio
async def test_revision_0017_is_upgraded_before_backend_start(migration_engine):
    initial = _run_migration_command("upgrade")
    assert initial.returncode == 0, initial.stdout + initial.stderr

    async with migration_engine.begin() as conn:
        await conn.execute(text("DROP TABLE author_source_links"))
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
        await conn.execute(text("DROP TABLE ai_proposal_sources"))
        await conn.execute(
            text(
                "ALTER TABLE ai_proposals "
                "DROP COLUMN validation_state, "
                "DROP COLUMN conflict_state, "
                "DROP COLUMN review_band, "
                "DROP COLUMN review_reason, "
                "DROP COLUMN edited_value, "
                "DROP COLUMN run_id, "
                "DROP COLUMN applied_at, "
                "DROP COLUMN timeline_event_id"
            )
        )
        await conn.execute(text("DROP TABLE source_candidates"))
        await conn.execute(text("DROP TABLE syvai_runs"))
        await conn.execute(
            text(
                "ALTER TABLE sources "
                "DROP COLUMN authority_tier, "
                "DROP COLUMN review_status, "
                "DROP COLUMN normalized_url, "
                "DROP COLUMN discovered_by, "
                "DROP COLUMN discovered_at"
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

    assert revision == "0024_source_discovery"
    assert "email_verified" in columns


@pytest.mark.asyncio
async def test_unversioned_nonempty_database_is_rejected(migration_engine):
    async with migration_engine.begin() as conn:
        await conn.execute(text("CREATE TABLE legacy_data (id INTEGER PRIMARY KEY)"))

    result = _run_migration_command("upgrade")

    assert result.returncode != 0
    assert "Refusing to stamp an unversioned non-empty database" in result.stderr
