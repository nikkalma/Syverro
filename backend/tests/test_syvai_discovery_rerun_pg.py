"""0.3A corrective integration regression against real Postgres.

Proves the invariant: re-running discovery for an author who already has
``source_candidates`` rows (pending, rejected, or approved/promoted) never
violates ``uq_source_candidates_author_normalized`` — the prior URL must be
treated as an existing duplicate and skipped, while review decisions survive.
"""

from __future__ import annotations

import os

import pytest
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

import app.models  # noqa: F401 — populate Base.metadata
from app.database import Base
from app.models.author import Author
from app.models.source import Source
from app.models.source_candidate import SourceCandidate
from app.models.syvai_run import SyvaiRun
from app.syvai.discovery import run_discovery
from app.syvai.discovery.dedupe import RawCandidate

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


@pytest.fixture
async def session(pg_engine):
    async with AsyncSession(pg_engine, expire_on_commit=False) as session:
        yield session


class ReplayProvider:
    name = "stub-replay"

    def __init__(self, candidates):
        self._candidates = candidates

    async def discover(self, author, terms):
        return list(self._candidates)


def _candidate(url, title="Anne Brontë"):
    return RawCandidate(
        url=url,
        title=title,
        source_type="encyclopedia",
        origin="stub",
        evidence="Anne Brontë was an English novelist and poet.",
    )


async def _seed_author_with_prior_candidate(session, *, review_action, status):
    author = Author(name="Anne Brontë", display_name="Anne Brontë")
    session.add(author)
    await session.flush()

    prior_run = SyvaiRun(author_id=author.id, domain="source_discovery", status="review_needed")
    session.add(prior_run)
    await session.flush()

    prior = SourceCandidate(
        author_id=author.id,
        run_id=prior_run.id,
        url="https://en.wikipedia.org/wiki/Anne_Bront%C3%AB",
        normalized_url="https://en.wikipedia.org/wiki/Anne_Bront%C3%AB",
        title="Anne Brontë",
        source_type="encyclopedia",
        authority_tier="medium",
        quality_score=70.0,
        assessment="needs_review",
        provider="wikipedia-discovery",
        status=status,
        review_action=review_action,
    )
    session.add(prior)
    await session.commit()
    return author, prior


@pytest.mark.asyncio
async def test_rerun_rejected_candidate_skipped_and_constraint_never_violated(session):
    author, prior = await _seed_author_with_prior_candidate(
        session, review_action="rejected", status="reviewed"
    )

    outcome = await run_discovery(session, author, [ReplayProvider([_candidate(prior.url)])])

    assert outcome.error is None
    assert outcome.duplicate_skipped == 1
    assert outcome.candidates == []

    result = await session.execute(
        select(SourceCandidate).where(SourceCandidate.author_id == author.id)
    )
    rows = result.scalars().all()
    assert len(rows) == 1
    assert rows[0].id == prior.id
    assert rows[0].review_action == "rejected"
    assert rows[0].status == "reviewed"


@pytest.mark.asyncio
async def test_rerun_pending_candidate_skipped_and_constraint_never_violated(session):
    author, prior = await _seed_author_with_prior_candidate(
        session, review_action=None, status="pending"
    )

    outcome = await run_discovery(session, author, [ReplayProvider([_candidate(prior.url)])])

    assert outcome.error is None
    assert outcome.duplicate_skipped == 1
    assert outcome.candidates == []

    result = await session.execute(
        select(SourceCandidate).where(SourceCandidate.author_id == author.id)
    )
    rows = result.scalars().all()
    assert len(rows) == 1
    assert rows[0].id == prior.id
    assert rows[0].status == "pending"
    assert rows[0].review_action is None


@pytest.mark.asyncio
async def test_rerun_approved_promoted_candidate_skipped_keeps_single_source(session):
    author = Author(name="Anne Brontë", display_name="Anne Brontë")
    session.add(author)
    await session.flush()

    promoted = Source(
        title="Anne Brontë",
        source_type="encyclopedia",
        url="https://en.wikipedia.org/wiki/Anne_Bront%C3%AB",
        citation="Anne Brontë was an English novelist and poet.",
        source_origin="syvai_discovery",
        authority_tier="medium",
        review_status="auto_approved",
        normalized_url="https://en.wikipedia.org/wiki/Anne_Bront%C3%AB",
        discovered_by="wikipedia-discovery",
    )
    session.add(promoted)
    await session.flush()

    prior_run = SyvaiRun(author_id=author.id, domain="source_discovery", status="completed")
    session.add(prior_run)
    await session.flush()

    prior = SourceCandidate(
        author_id=author.id,
        run_id=prior_run.id,
        source_id=promoted.id,
        url="https://en.wikipedia.org/wiki/Anne_Bront%C3%AB",
        normalized_url="https://en.wikipedia.org/wiki/Anne_Bront%C3%AB",
        title="Anne Brontë",
        source_type="encyclopedia",
        authority_tier="medium",
        quality_score=80.0,
        assessment="auto_usable",
        provider="wikipedia-discovery",
        status="reviewed",
        review_action="auto_approved",
    )
    session.add(prior)
    await session.commit()

    outcome = await run_discovery(session, author, [ReplayProvider([_candidate(prior.url)])])

    assert outcome.error is None
    assert outcome.duplicate_skipped == 1
    assert outcome.candidates == []
    assert outcome.created_sources == []

    sources = (
        await session.execute(select(Source).where(Source.id == promoted.id))
    ).scalars().all()
    assert len(sources) == 1  # no duplicate promotion


@pytest.mark.asyncio
async def test_rerun_with_new_urls_only_persists_new_ones(session):
    author, prior = await _seed_author_with_prior_candidate(
        session, review_action="rejected", status="reviewed"
    )

    outcome = await run_discovery(
        session,
        author,
        [ReplayProvider([_candidate(prior.url), _candidate("https://www.loc.gov/item/annebronte0001")])],
    )

    assert outcome.error is None
    assert outcome.duplicate_skipped == 1
    assert len(outcome.candidates) == 1
    assert outcome.candidates[0].normalized_url == "https://www.loc.gov/item/annebronte0001"

    result = await session.execute(
        select(SourceCandidate).where(SourceCandidate.author_id == author.id)
    )
    rows = result.scalars().all()
    assert len(rows) == 2


@pytest.mark.asyncio
async def test_rerun_twice_idempotent_no_new_rows(session):
    author, _ = await _seed_author_with_prior_candidate(
        session, review_action=None, status="pending"
    )

    first = await run_discovery(session, author, [ReplayProvider([_candidate("https://www.loc.gov/item/annebronte0001")])])
    assert first.error is None
    assert len(first.candidates) == 1

    second = await run_discovery(session, author, [ReplayProvider([_candidate("https://www.loc.gov/item/annebronte0001")])])
    assert second.error is None
    assert second.duplicate_skipped == 1
    assert second.candidates == []

    result = await session.execute(
        select(SourceCandidate).where(SourceCandidate.author_id == author.id)
    )
    rows = result.scalars().all()
    assert len(rows) == 2  # prior reject + single new row, never a third