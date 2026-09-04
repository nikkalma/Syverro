"""PostgreSQL regressions for atomic Author proposal Apply."""

import json
import os
from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

import app.models  # noqa: F401
from app.api.admin_moderation import BulkApplyRequest, bulk_apply_proposals
from app.database import Base
from app.models.ai_proposal import AIProposal
from app.models.author import Author
from app.models.author_citizenship import AuthorCitizenship
from app.models.place import Place


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


def _proposal(author, field, value, *, status="accepted"):
    return AIProposal(
        entity_type="author",
        entity_id=str(author.id),
        field_name=field,
        suggested_value=json.dumps({"field": field, "value": value}),
        source_type="catalog_bootstrap",
        confidence=1.0,
        status=status,
        review_band="quality_review",
        validation_state="direct_grounded",
        conflict_state="new",
    )


def _request_context():
    return (
        SimpleNamespace(state=SimpleNamespace(request_id="pg-atomic-apply")),
        SimpleNamespace(role="admin", id=None),
    )


@pytest.mark.asyncio
async def test_bradbury_moderated_set_applies_14_and_never_rejected_or_unrelated(pg_session):
    author = Author(
        name="Брэдбери, Рэй", native_name="Брэдбери, Рэй", nationality="American",
        languages=["Русский"], gender="unknown", occupations=[], metadata_status="draft",
    )
    pg_session.add(author)
    await pg_session.flush()
    accepted = [
        _proposal(author, "birth_date", {"date_value": "1920-08-22", "date_precision": "day"}),
        _proposal(author, "death_date", {"date_value": "2012-06-05", "date_precision": "day"}),
        _proposal(author, "birth_place", {"place": "Waukegan", "wikidata_qid": "Q578289"}),
        _proposal(author, "death_place", {"place": "Los Angeles", "wikidata_qid": "Q65"}),
        _proposal(author, "citizenship", {"state_name": "United States", "wikidata_qid": "Q30"}),
        _proposal(author, "birth_name", "Raymond Douglas Bradbury"),
        _proposal(author, "native_name", "Ray Douglas Bradbury"),
        _proposal(author, "gender", "male"),
    ] + [
        _proposal(author, "occupations", value) for value in (
            "screenwriter", "poet", "writer", "novelist", "science fiction writer", "playwright"
        )
    ]
    rejected = [
        _proposal(author, "occupations", "prose writer", status="rejected"),
        _proposal(author, "occupations", "satirical novelist", status="rejected"),
    ]
    pg_session.add_all(accepted + rejected)
    await pg_session.commit()
    request, user = _request_context()
    with patch("app.syvai.apply_author.add_security_event", new=Mock()):
        response = await bulk_apply_proposals(
            BulkApplyRequest(proposal_ids=[str(p.id) for p in accepted]), request, user, db=pg_session
        )
    assert response["succeeded"] == 14 and response["failed"] == 0
    await pg_session.refresh(author)
    assert (author.birth_date, author.birth_date_precision, author.birth_year) == ("1920-08-22", "full", 1920)
    assert (author.death_date, author.death_date_precision, author.death_year) == ("2012-06-05", "full", 2012)
    assert (author.birth_place, author.death_place) == ("Waukegan", "Los Angeles")
    places = {p.wikidata_id: p.name for p in (await pg_session.execute(select(Place))).scalars()}
    assert places == {"Q578289": "Waukegan", "Q65": "Los Angeles"}
    assert author.birth_name == "Raymond Douglas Bradbury"
    assert author.native_name == "Ray Douglas Bradbury" and author.gender == "male"
    assert author.occupations == ["screenwriter", "poet", "writer", "novelist", "science fiction writer", "playwright"]
    assert author.languages == ["Русский"] and author.nationality == "American"
    citizenships = (await pg_session.execute(select(AuthorCitizenship))).scalars().all()
    assert [c.state_name for c in citizenships] == ["United States"]
    assert all(p.applied_at is None for p in rejected)


@pytest.mark.asyncio
async def test_atomic_set_failure_rolls_back_author_and_proposal_lifecycle(pg_session):
    author = Author(name="Rollback Bradbury", nationality="American", languages=["Русский"])
    pg_session.add(author)
    await pg_session.flush()
    first = _proposal(author, "native_name", "Ray Douglas Bradbury")
    bad = _proposal(author, "birth_date", {"date_value": "1920-99-99", "date_precision": "day"})
    pg_session.add_all([first, bad])
    await pg_session.commit()
    author_id = author.id
    first_id = first.id
    bad_id = bad.id
    request, user = _request_context()
    with patch("app.syvai.apply_author.add_security_event", new=Mock()):
        response = await bulk_apply_proposals(
            BulkApplyRequest(proposal_ids=[str(first_id), str(bad_id)]), request, user, db=pg_session
        )
    assert response["succeeded"] == 0 and response["failed"] == 2
    values = (await pg_session.execute(
        select(Author.native_name, Author.birth_date, Author.nationality, Author.languages)
        .where(Author.id == author_id)
    )).one()
    assert values == (None, None, "American", ["Русский"])
    applied = (await pg_session.execute(
        select(AIProposal.applied_at).where(AIProposal.id.in_([first_id, bad_id]))
    )).scalars().all()
    assert applied == [None, None]
    assert (await pg_session.execute(select(Place))).scalars().all() == []
    assert (await pg_session.execute(select(AuthorCitizenship))).scalars().all() == []
