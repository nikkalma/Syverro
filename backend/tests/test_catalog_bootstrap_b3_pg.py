"""PostgreSQL-backed B3 pending-proposal deduplication regression."""

import os
import json
from types import SimpleNamespace
from uuid import uuid4

import pytest
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

import app.models  # noqa: F401
from app.database import Base
from app.models.ai_proposal import AIProposal
from app.models.ai_proposal_source import AIProposalSource
from app.models.author import Author
from app.models.source import Source
from app.models.syvai_run import SyvaiRun
from app.syvai.bootstrap_author import (
    DOMAIN, AcquiredFact, CanonicalIdentity, PROPERTY_RULES, _persist_fact,
)
from app.api.admin_syvai import preview_author_catalog_evidence

DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    os.environ.get("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/syverro_test"),
)


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
        yield session
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.mark.asyncio
async def test_repeated_runs_and_statements_reuse_one_pending_logical_proposal(pg_session):
    author = Author(name="Ray Bradbury", metadata_status="draft")
    source = Source(
        title="Wikidata Q310732", source_type="wikidata",
        url="https://www.wikidata.org/wiki/Q310732",
        normalized_url="https://www.wikidata.org/wiki/Q310732",
    )
    run1 = SyvaiRun(author_id=author.id, domain=DOMAIN, status="running")
    pg_session.add_all([author, source])
    await pg_session.flush()
    run1.author_id = author.id
    pg_session.add(run1)
    await pg_session.flush()

    identity = CanonicalIdentity(
        qid="Q310732", query_variant="Ray Bradbury", resolved_title="Ray Bradbury",
        resolved_page_id=1, resolved_site="en", canonical_title="Ray Bradbury",
        canonical_url="https://en.wikipedia.org/wiki/Ray_Bradbury", canonical_site="en",
    )
    rule = next(rule for rule in PROPERTY_RULES if rule.property_id == "P106")
    fact = AcquiredFact(
        rule=rule, value={"value": "screenwriter", "wikidata_qid": "Q28389"},
        statement_id="Q310732$occupation", rank="normal", qualifiers={},
        raw_datavalue={"id": "Q28389"},
    )
    first = await _persist_fact(
        pg_session, author=author, run=run1, fact=fact, identity=identity, source=source,
    )
    # Same logical fact appears as a repeated statement in the same run.
    repeated_fact = AcquiredFact(
        rule=rule, value=fact.value, statement_id="Q310732$occupation-duplicate",
        rank="normal", qualifiers={}, raw_datavalue={"id": "Q28389"},
    )
    repeated = await _persist_fact(
        pg_session, author=author, run=run1, fact=repeated_fact, identity=identity, source=source,
    )
    run2 = SyvaiRun(author_id=author.id, domain=DOMAIN, status="running")
    pg_session.add(run2)
    await pg_session.flush()
    # And again in a later explicit Bootstrap run.
    rerun = await _persist_fact(
        pg_session, author=author, run=run2, fact=fact, identity=identity, source=source,
    )
    await pg_session.commit()

    proposal_count = await pg_session.scalar(select(func.count()).select_from(AIProposal))
    link_count = await pg_session.scalar(select(func.count()).select_from(AIProposalSource))
    assert first.id == repeated.id == rerun.id
    assert proposal_count == 1
    assert link_count == 1
    assert first.status == "proposed"
    assert first.review_band == "quality_review"
    assert first.validation_state == "direct_grounded"
    assert json.loads(first.suggested_value)["evidence"]["additional_statements"][0][
        "statement_id"
    ] == "Q310732$occupation-duplicate"
    assert author.metadata_status == "draft"


@pytest.mark.asyncio
async def test_canonical_value_retires_a_previously_pending_duplicate(pg_session):
    author = Author(name="Ray Bradbury", metadata_status="draft", occupations=[])
    source = Source(
        title="Wikidata Q310732", source_type="wikidata",
        url="https://www.wikidata.org/wiki/Q310732",
        normalized_url="https://www.wikidata.org/wiki/Q310732",
    )
    pg_session.add_all([author, source])
    await pg_session.flush()
    run1 = SyvaiRun(author_id=author.id, domain=DOMAIN, status="running")
    pg_session.add(run1)
    await pg_session.flush()

    identity = CanonicalIdentity(
        qid="Q310732", query_variant="Ray Bradbury", resolved_title="Ray Bradbury",
        resolved_page_id=1, resolved_site="en", canonical_title="Ray Bradbury",
        canonical_url="https://en.wikipedia.org/wiki/Ray_Bradbury", canonical_site="en",
    )
    rule = next(rule for rule in PROPERTY_RULES if rule.property_id == "P106")
    fact = AcquiredFact(
        rule=rule, value={"value": "screenwriter", "wikidata_qid": "Q28389"},
        statement_id="Q310732$occupation", rank="normal", qualifiers={},
        raw_datavalue={"id": "Q28389"},
    )
    pending = await _persist_fact(
        pg_session, author=author, run=run1, fact=fact, identity=identity, source=source,
    )
    await pg_session.flush()
    assert pending.status == "proposed"

    author.occupations = ["screenwriter"]
    run2 = SyvaiRun(author_id=author.id, domain=DOMAIN, status="running")
    pg_session.add(run2)
    await pg_session.flush()
    redundant = await _persist_fact(
        pg_session, author=author, run=run2, fact=fact, identity=identity, source=source,
    )
    await pg_session.commit()

    assert redundant is None
    assert pending.status == "rejected"
    assert pending.validation_state == "duplicate"
    assert pending.conflict_state == "duplicate"
    assert pending.review_band == "auto_rejected"
    assert pending.review_reason == "already_present_in_canonical_author"
    assert await pg_session.scalar(select(func.count()).select_from(AIProposal)) == 1
    assert author.metadata_status == "draft"


@pytest.mark.asyncio
async def test_b4_preview_savepoint_persists_no_run_or_proposal(pg_session, monkeypatch):
    author = Author(name="Ray Bradbury", metadata_status="draft")
    pg_session.add(author)
    await pg_session.flush()

    async def fake_pipeline(db, target_author):
        run = SyvaiRun(
            author_id=target_author.id, domain=DOMAIN, status="completed",
            provider="wikimedia", model="catalog_bootstrap_acquisition_v1",
        )
        db.add(run)
        await db.flush()
        return SimpleNamespace(
            run=run, identity=SimpleNamespace(provenance=lambda: {"qid": "Q310732"}),
            wikipedia_source=None, proposals=[], fields_skipped=[], error=None,
        )

    monkeypatch.setattr("app.api.admin_syvai.run_author_bootstrap", fake_pipeline)
    response = await preview_author_catalog_evidence(
        author_id=str(author.id), current_user=SimpleNamespace(role="admin"), db=pg_session,
    )

    assert response["preview"] is True
    assert await pg_session.scalar(select(func.count()).select_from(SyvaiRun)) == 0
    assert await pg_session.scalar(select(func.count()).select_from(AIProposal)) == 0
