"""Author publication boundary (``app.services.author_publication``) — offline
unit tests (no DB, no provider). Covers readiness evaluation, the promote gate,
idempotency and the audit trail.
"""

from __future__ import annotations

from uuid import uuid4

import pytest

from app.models.author import Author
from app.services.author_publication import (
    AuthorPublicationBlocked,
    author_golden_readiness,
    promote_author_to_golden,
)


class FakeSession:
    """Records staged audit events and applied status mutations."""

    def __init__(self):
        self.events = []
        self.added = []

    def add(self, obj):
        self.added.append(obj)


def _author(**overrides):
    data = dict(
        id=uuid4(),
        name="Author X",
        display_name="Author X",
        metadata_status="draft",
        sort_name=None,
        nationality=None,
        country=None,
        birth_date=None,
        birth_year=None,
        languages=[],
        occupations=[],
        bio=None,
        photo=None,
        wikipedia_url=None,
        official_website=None,
        portrait_caption=None,
        author_intro_quote=None,
        genres=[],
        themes=[],
        motifs=[],
        concepts=[],
        atmospheres=[],
        literary_movements=[],
        writing_languages=[],
    )
    data.update(overrides)
    return Author(**data)


# ============================================================
# READINESS
# ============================================================


def test_readiness_blocks_empty_draft():
    r = author_golden_readiness(_author(name=None, display_name=None))
    assert r["ready"] is False
    assert set(r["missing_required_fields"]) == {
        "Sort name",
        "Nationality",
        "Birth date or birth year",
        "Languages",
        "Occupations",
        "Biography",
    }


def test_readiness_of_complete_author_is_ready():
    a = _author(
        sort_name="X, Author",
        nationality="France",
        birth_year=1840,
        languages=["French"],
        occupations=["writer"],
        bio="Bio",
    )
    r = author_golden_readiness(a)
    assert r["ready"] is True
    assert r["missing_required_fields"] == []


def test_birth_year_counts_as_birth_for_readiness():
    a = _author(
        sort_name="X, Author",
        nationality="France",
        birth_year=1840,
        languages=["French"],
        occupations=["writer"],
        bio="Bio",
    )
    assert author_golden_readiness(a)["ready"] is True


def test_country_falls_back_for_nationality():
    a = _author(
        sort_name="X, Author",
        country="Poland",
        birth_date="1840-01-01",
        languages=["Polish"],
        occupations=["poet"],
        bio="Bio",
    )
    r = author_golden_readiness(a)
    assert r["ready"] is True
    assert "Nationality" not in r["missing_required_fields"]


def test_display_name_falls_back_for_sort_name():
    a = _author(
        display_name="Author X",
        nationality="France",
        birth_year=1840,
        languages=["French"],
        occupations=["writer"],
        bio="Bio",
    )
    r = author_golden_readiness(a)
    assert r["ready"] is True
    assert "Sort name" not in r["missing_required_fields"]


def test_manual_enrichments_are_warnings_not_blockers():
    a = _author(
        sort_name="X, Author",
        nationality="France",
        birth_year=1840,
        languages=["French"],
        occupations=["writer"],
        bio="Bio",
    )
    r = author_golden_readiness(a)
    assert r["ready"] is True
    assert any("portrait photo" in w for w in r["warnings"])
    assert any("external links" in w for w in r["warnings"])


def test_manual_enrichments_present_clear_warnings():
    a = _author(
        sort_name="X, Author",
        nationality="France",
        birth_year=1840,
        languages=["French"],
        occupations=["writer"],
        bio="Bio",
        photo="x.jpg",
        wikipedia_url="https://example.org",
        portrait_caption="Cap",
        author_intro_quote="Quote",
    )
    r = author_golden_readiness(a, publications_count=3)
    assert r["ready"] is True
    assert not any("portrait photo" in w for w in r["warnings"])
    assert not any("external links" in w for w in r["warnings"])
    assert not any("publications" in w for w in r["warnings"])


def test_no_publications_is_a_warning_only():
    a = _author(
        sort_name="X, Author",
        nationality="France",
        birth_year=1840,
        languages=["French"],
        occupations=["writer"],
        bio="Bio",
    )
    r = author_golden_readiness(a, publications_count=0)
    assert r["ready"] is True
    assert any("publications" in w for w in r["warnings"])


# ============================================================
# PROMOTE GATE
# ============================================================


@pytest.mark.asyncio
async def test_promote_refuses_when_not_ready():
    db = FakeSession()
    author = _author()
    with pytest.raises(AuthorPublicationBlocked) as exc:
        await promote_author_to_golden(
            db, author=author, actor_id=uuid4(), endpoint="/admin/authors/{id}/promote"
        )
    assert exc.value.readiness["ready"] is False
    assert author.metadata_status == "draft"
    assert db.events == []


@pytest.mark.asyncio
async def test_promote_updates_status_and_audits():
    db = FakeSession()
    author = _author(
        sort_name="X, Author",
        nationality="France",
        birth_year=1840,
        languages=["French"],
        occupations=["writer"],
        bio="Bio",
    )
    result = await promote_author_to_golden(
        db, author=author, actor_id=uuid4(), endpoint="/admin/authors/{id}/promote"
    )
    assert result["already_golden"] is False
    assert author.metadata_status == "golden"
    assert any(e.event_type == "author_promote_golden" for e in db.added)


@pytest.mark.asyncio
async def test_promote_is_idempotent_when_already_golden():
    db = FakeSession()
    author = _author(
        metadata_status="golden",
        sort_name="X, Author",
        nationality="France",
        birth_year=1840,
        languages=["French"],
        occupations=["writer"],
        bio="Bio",
    )
    result = await promote_author_to_golden(
        db, author=author, actor_id=uuid4(), endpoint="/admin/authors/{id}/promote"
    )
    assert result["already_golden"] is True
    assert author.metadata_status == "golden"
    # idempotent: no second audit event
    assert db.added == []


@pytest.mark.asyncio
async def test_promote_never_touches_other_fields():
    db = FakeSession()
    author = _author(
        sort_name="X, Author",
        nationality="France",
        birth_year=1840,
        languages=["French"],
        occupations=["writer"],
        bio="Bio",
        genres=[],
    )
    original_bio = author.bio
    original_genres = list(author.genres)
    await promote_author_to_golden(
        db, author=author, actor_id=uuid4(), endpoint="/admin/authors/{id}/promote"
    )
    assert author.bio == original_bio
    assert author.genres == original_genres