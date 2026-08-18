"""SyvAI 0.6B — focused tests for the safe canonical Apply boundary
(``app.syvai.apply_author``): eligibility matrix, overwrite/conflict policy,
list merge idempotency, entity canonical resolution, taxonomy guard, audit and
idempotency. These are offline unit tests (no DB, no provider).
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from uuid import uuid4

import pytest

from app.models.ai_proposal import AIProposal
from app.models.author import Author
from app.models.author_citizenship import AuthorCitizenship
from app.models.author_residence import AuthorResidence
from app.models.genre import Genre
from app.models.place import Place
from app.syvai.apply_author import (
    ApplyError,
    apply_author_field_proposal,
    apply_timeline_proposal,
)


class FakeScalarResult:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value


class FakeRows:
    def __init__(self, rows):
        self._rows = rows

    def __iter__(self):
        return iter(self._rows)

    def scalars(self):
        return self

    def first(self):
        return self._rows[0] if self._rows else None

    def all(self):
        return self._rows


class FakeEntityDB:
    """Responds to the exact queries the entity apply paths issue."""

    def __init__(self, *, place=None, citizenship_id=None, residence_id=None):
        self.place = place
        self.citizenship_id = citizenship_id
        self.residence_id = residence_id
        self.added = []

    async def execute(self, query):
        for desc in query.column_descriptions:
            entity = desc.get("entity")
            name = desc.get("name")
            if entity is AuthorCitizenship and name == "id":
                return FakeScalarResult(self.citizenship_id)
            if entity is Place:
                return FakeRows([self.place] if self.place else [])
            if entity is AuthorResidence and name == "id":
                return FakeScalarResult(self.residence_id)
        return FakeRows([])

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        for obj in self.added:
            if getattr(obj, "id", None) is None:
                obj.id = uuid4()


class FakeTaxonomyDB(FakeEntityDB):
    def __init__(self, genre_names=None, **kwargs):
        super().__init__(**kwargs)
        self.genre_names = genre_names or []

    async def execute(self, query):
        for desc in query.column_descriptions:
            entity = desc.get("entity")
            name = desc.get("name")
            if entity is Genre:
                return FakeRows([(n,) for n in self.genre_names])
        return await super().execute(query)


def _proposal(field_name, value, **overrides):
    values = {
        "entity_type": "author",
        "entity_id": str(uuid4()),
        "field_name": field_name,
        "suggested_value": json.dumps({"field": field_name, "value": value, "label": str(value)}),
        "source_type": "ai",
        "confidence": 0.8,
        "status": "proposed",
        "review_band": "auto_approved",
        "review_reason": "new_grounded",
        "validation_state": "validated",
        "conflict_state": "new",
    }
    values.update(overrides)
    return AIProposal(**values)


def _author(**overrides):
    data = dict(
        id=uuid4(),
        name="Author X",
        display_name="Author X",
        native_name=None,
        birth_name=None,
        nationality=None,
        gender=None,
        bio=None,
        active_from_year=None,
        active_to_year=None,
        pen_names=[],
        pseudonyms=[],
        languages=[],
        occupations=[],
        literary_movements=[],
        genres=[],
        themes=[],
        motifs=[],
        concepts=[],
        atmospheres=[],
        writing_languages=[],
    )
    data.update(overrides)
    return Author(**data)


async def _apply(db, proposal, author, *, band=None):
    return await apply_author_field_proposal(
        db,
        proposal=proposal,
        author=author,
        actor_id=uuid4(),
        endpoint="/admin/authors/{id}/proposals/{pid}/apply",
        request=None,
    )


# ============================================================
# ELIGIBILITY MATRIX
# ============================================================


@pytest.mark.asyncio
async def test_eligibility_rejects_pending_human_review():
    proposal = _proposal("nationality", "British", status="proposed", review_band="quality_review")
    with pytest.raises(ApplyError, match="Only accepted or auto-approved"):
        await _apply(FakeEntityDB(), proposal, _author())


@pytest.mark.asyncio
async def test_eligibility_rejects_rejected():
    proposal = _proposal("nationality", "British", status="rejected", review_band="auto_rejected")
    with pytest.raises(ApplyError, match="Rejected proposals cannot be applied"):
        await _apply(FakeEntityDB(), proposal, _author())


@pytest.mark.asyncio
async def test_eligibility_rejects_invalid():
    proposal = _proposal("nationality", "British", review_band="quality_review", validation_state="invalid")
    with pytest.raises(ApplyError, match="Invalid proposals cannot be applied"):
        await _apply(FakeEntityDB(), proposal, _author())


@pytest.mark.asyncio
async def test_accepted_human_review_is_applyable():
    proposal = _proposal("nationality", "British", status="accepted", review_band="quality_review")
    author = _author()
    result = await _apply(FakeEntityDB(), proposal, author)
    assert result["applied"] is True
    assert author.nationality == "British"
    assert proposal.applied_at is not None


# ============================================================
# OVERWRITE / CONFLICT POLICY
# ============================================================


@pytest.mark.asyncio
async def test_auto_approved_never_silently_overwrites_populated_scalar():
    proposal = _proposal("nationality", "British")
    author = _author(nationality="American")
    with pytest.raises(ApplyError, match="silently overwrite"):
        await _apply(FakeEntityDB(), proposal, author)
    assert author.nationality == "American"


@pytest.mark.asyncio
async def test_auto_approved_same_value_is_idempotent_noop():
    proposal = _proposal("nationality", "American")
    author = _author(nationality="American")
    result = await _apply(FakeEntityDB(), proposal, author)
    assert result["already_applied"] is False
    assert author.nationality == "American"


@pytest.mark.asyncio
async def test_human_accepted_scalar_overwrites_explicitly():
    proposal = _proposal("nationality", "British", status="accepted", review_band="field_conflict" if False else "quality_review")
    author = _author(nationality="American")
    result = await _apply(FakeEntityDB(), proposal, author)
    assert result["applied"] is True
    assert author.nationality == "British"


@pytest.mark.asyncio
async def test_placeholder_gender_is_never_a_conflict():
    proposal = _proposal("gender", "male")
    author = _author(gender="unknown")
    result = await _apply(FakeEntityDB(), proposal, author)
    assert result["applied"] is True
    assert author.gender == "male"


# ============================================================
# LIST MERGE DETERMINISM + IDEMPOTENCY
# ============================================================


@pytest.mark.asyncio
async def test_list_merge_appends_without_losing_existing_items():
    proposal = _proposal("languages", "French")
    author = _author(languages=["English", "German"])
    result = await _apply(FakeEntityDB(), proposal, author)
    assert result["applied"] is True
    assert author.languages == ["English", "German", "French"]


@pytest.mark.asyncio
async def test_list_merge_is_case_insensitive_dedupe():
    proposal = _proposal("languages", "ENGLISH")
    author = _author(languages=["English"])
    await _apply(FakeEntityDB(), proposal, author)
    assert author.languages == ["English"]


# ============================================================
# ENTITY FIELDS — CANONICAL RESOLUTION
# ============================================================


@pytest.mark.asyncio
async def test_active_years_written_when_empty():
    proposal = _proposal("active_years", {"from_year": 1840, "to_year": 1860}, suggested_value=json.dumps(
        {"field": "active_years", "value": {"from_year": 1840, "to_year": 1860}, "label": "Active"}
    ))
    author = _author()
    await _apply(FakeEntityDB(), proposal, author)
    assert author.active_from_year == 1840
    assert author.active_to_year == 1860


@pytest.mark.asyncio
async def test_active_years_auto_approved_blocks_overwrite():
    proposal = _proposal("active_years", {"from_year": 1840, "to_year": 1860}, suggested_value=json.dumps(
        {"field": "active_years", "value": {"from_year": 1840, "to_year": 1860}, "label": "Active"}
    ))
    author = _author(active_from_year=1900, active_to_year=1920)
    with pytest.raises(ApplyError, match="active_years"):
        await _apply(FakeEntityDB(), proposal, author)


@pytest.mark.asyncio
async def test_citizenship_appends_and_skips_existing():
    proposal = _proposal("citizenship", {"state_name": "British", "from_date": "1840", "to_date": None}, suggested_value=json.dumps(
        {"field": "citizenship", "value": {"state_name": "British", "from_date": "1840", "to_date": None}, "label": "Citizenship"}
    ))
    author = _author()
    db = FakeEntityDB()
    await _apply(db, proposal, author)
    assert any(isinstance(obj, AuthorCitizenship) and obj.state_name == "British" for obj in db.added)
    # duplicate state_name → idempotent no-op
    db2 = FakeEntityDB(citizenship_id=uuid4())
    proposal2 = _proposal("citizenship", {"state_name": "British"}, suggested_value=json.dumps(
        {"field": "citizenship", "value": {"state_name": "British"}, "label": "Citizenship"}
    ))
    await _apply(db2, proposal2, author)
    assert not any(isinstance(obj, AuthorCitizenship) for obj in db2.added)


@pytest.mark.asyncio
async def test_residence_uses_canonical_place_or_creates_one():
    author = _author()
    db = FakeEntityDB()
    proposal = _proposal("residence", {"place": "London, England", "from_date": "1924", "to_date": None}, suggested_value=json.dumps(
        {"field": "residence", "value": {"place": "London, England", "from_date": "1924", "to_date": None}, "label": "Residence"}
    ))
    await _apply(db, proposal, author)
    place = next((obj for obj in db.added if isinstance(obj, Place)), None)
    assert place is not None and place.name == "London, England"
    assert any(isinstance(obj, AuthorResidence) and obj.place_id == place.id for obj in db.added)


@pytest.mark.asyncio
async def test_residence_reuses_existing_place_node():
    existing = Place(id=uuid4(), name="London, England")
    author = _author()
    db = FakeEntityDB(place=existing)
    proposal = _proposal("residence", {"place": "London, England"}, suggested_value=json.dumps(
        {"field": "residence", "value": {"place": "London, England"}, "label": "Residence"}
    ))
    await _apply(db, proposal, author)
    residence = next((obj for obj in db.added if isinstance(obj, AuthorResidence)), None)
    assert residence is not None
    assert residence.place_id == existing.id
    assert not any(isinstance(obj, Place) for obj in db.added)


# ============================================================
# TAXONOMY GUARD — only canonical labels are written
# ============================================================


@pytest.mark.asyncio
async def test_taxonomy_guard_blocks_unresolved_label():
    proposal = _proposal("genres", "invented genre", suggested_value=json.dumps(
        {"field": "genres", "value": "invented genre", "label": "invented genre",
         "taxonomy_match": {"resolved": False}}
    ))
    author = _author()
    with pytest.raises(ApplyError, match="does not resolve to a canonical genre"):
        await _apply(FakeTaxonomyDB(genre_names=["Science Fiction"]), proposal, author)


@pytest.mark.asyncio
async def test_taxonomy_guard_accepts_resolved_match():
    proposal = _proposal("genres", "science fiction", suggested_value=json.dumps(
        {"field": "genres", "value": "science fiction", "label": "science fiction",
         "taxonomy_match": {"resolved": True, "slug": "science-fiction"}}
    ))
    author = _author()
    result = await _apply(FakeTaxonomyDB(genre_names=["Science Fiction"]), proposal, author)
    assert result["applied"] is True
    assert author.genres == ["science fiction"]


@pytest.mark.asyncio
async def test_taxonomy_guard_resolves_canonical_label_from_table():
    proposal = _proposal("genres", "science fiction", suggested_value=json.dumps(
        {"field": "genres", "value": "science fiction", "label": "science fiction",
         "taxonomy_match": {"resolved": False}}
    ))
    author = _author()
    result = await _apply(FakeTaxonomyDB(genre_names=["Science Fiction"]), proposal, author)
    assert result["applied"] is True
    assert author.genres == ["science fiction"]


# ============================================================
# IDEMPOTENCY (applied_at)
# ============================================================


@pytest.mark.asyncio
async def test_already_applied_proposal_is_idempotent():
    proposal = _proposal(
        "nationality", "British",
        applied_at=datetime.now(timezone.utc),
    )
    author = _author()
    result = await _apply(FakeEntityDB(), proposal, author)
    assert result["already_applied"] is True
    assert author.nationality is None  # nothing else was written


# ============================================================
# TIMELINE boundary (accepted-only preserved)
# ============================================================


@pytest.mark.asyncio
async def test_timeline_apply_requires_accepted():
    proposal = _proposal(
        "timeline_event",
        {"event_type": "milestone", "date_value": "1831", "label": "X"},
        review_band="quality_review",
        status="proposed",
    )
    with pytest.raises(ApplyError, match="Only accepted proposals"):
        await apply_timeline_proposal(
            FakeEntityDB(), proposal=proposal, author_id=str(uuid4()),
            actor_id=uuid4(), endpoint="x",
        )