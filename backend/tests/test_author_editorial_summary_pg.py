"""PostgreSQL integration for the set-based Author editorial projection."""

import os
from datetime import datetime, timezone

import pytest
from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

import app.models  # noqa: F401
from app.database import Base
from app.models.ai_proposal import AIProposal
from app.models.author import Author
from app.models.source import Source
from app.models.source_candidate import SourceCandidate
from app.models.syvai_run import SyvaiRun
from app.services.author_editorial_summary import author_editorial_summaries
from app.syvai.discovery.verification import CONTENT_INSPECTOR_VERSION


DATABASE_URL = os.environ.get("TEST_DATABASE_URL", os.environ.get("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/syverro_test"))


async def _reachable(url):
    engine = create_async_engine(url)
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
    finally:
        await engine.dispose()


@pytest.fixture
async def pg_session():
    if not await _reachable(DATABASE_URL):
        pytest.skip("PostgreSQL test database is unavailable")
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session, engine
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.mark.asyncio
async def test_projection_isolated_paginated_rows_and_constant_query_count(pg_session):
    session, engine = pg_session
    sparse = Author(name="Sparse", metadata_status="draft")
    ready = Author(
        name="Ready", metadata_status="review_ready", sort_name="Ready, Author",
        nationality="GB", birth_year=1900, languages=["English"], occupations=["Writer"], bio="Biography",
    )
    session.add_all([sparse, ready])
    await session.flush()

    current = Source(
        title="Current", source_type="encyclopedia", content_capabilities=["BIOGRAPHY"],
        capability_evidence={"BIOGRAPHY": [{"span": "Biography"}]}, content_inspector_version=CONTENT_INSPECTOR_VERSION,
    )
    stale = Source(
        title="Stale", source_type="website", content_capabilities=["BIOGRAPHY"],
        capability_evidence={"BIOGRAPHY": [{}]}, content_inspector_version="content_v1",
    )
    session.add_all([current, stale])
    await session.flush()
    session.add_all([
        SourceCandidate(author_id=ready.id, source_id=current.id, url="https://example.test/current", normalized_url="https://example.test/current", authority_tier="high", assessment="auto_usable", status="reviewed", review_action="approved"),
        SourceCandidate(author_id=sparse.id, url="https://example.test/pending", normalized_url="https://example.test/pending", authority_tier="medium", assessment="needs_review", status="pending"),
        SourceCandidate(author_id=sparse.id, url="https://example.test/rejected", normalized_url="https://example.test/rejected", authority_tier="low", assessment="rejected", status="reviewed", review_action="rejected"),
        SourceCandidate(author_id=sparse.id, source_id=stale.id, url="https://example.test/stale", normalized_url="https://example.test/stale", authority_tier="high", assessment="auto_usable", status="reviewed", review_action="auto_approved", identity_verification={"state": "verified"}),
        AIProposal(entity_type="author", entity_id=str(sparse.id), field_name="bio", suggested_value="Bio", status="proposed", review_band="quality_review"),
        AIProposal(entity_type="author", entity_id=str(ready.id), field_name="languages", suggested_value="English", status="accepted", review_band="policy_review"),
        AIProposal(entity_type="author", entity_id=str(ready.id), field_name="occupations", suggested_value="Writer", status="accepted", review_band="policy_review", applied_at=datetime.now(timezone.utc).replace(tzinfo=None)),
        SyvaiRun(author_id=ready.id, domain="biography", status="skipped", routing_reason="INSUFFICIENT_CORPUS:BIOGRAPHY_UNSUPPORTED"),
    ])
    await session.commit()

    queries = 0
    def count_query(*_args):
        nonlocal queries
        queries += 1
    event.listen(engine.sync_engine, "before_cursor_execute", count_query)
    summaries = await author_editorial_summaries(session, [sparse, ready])
    event.remove(engine.sync_engine, "before_cursor_execute", count_query)

    assert queries == 5
    assert summaries[str(sparse.id)]["pending_source_candidate_count"] == 1
    assert summaries[str(sparse.id)]["rejected_source_candidate_count"] == 1
    assert summaries[str(sparse.id)]["verified_source_count"] == 0
    assert summaries[str(sparse.id)]["pending_proposal_count"] == 1
    assert summaries[str(ready.id)]["verified_source_count"] == 1
    assert summaries[str(ready.id)]["accepted_unapplied_proposal_count"] == 1
    assert summaries[str(ready.id)]["applied_proposal_count"] == 1
    assert summaries[str(ready.id)]["publication_ready"] is True
    assert summaries[str(ready.id)]["last_syvai_run_status"] == "skipped"
    assert summaries[str(ready.id)]["last_syvai_run_reason"].startswith("INSUFFICIENT_CORPUS")
