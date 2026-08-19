import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

import pytest

from app.api.admin_syvai import check_admin, apply_author_proposal
from app.models.ai_proposal import AIProposal
from app.models.author import Author
from app.models.timeline_event import TimelineEvent


class FakeScalarResult:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value


class FakeApplySession:
    def __init__(self, existing_event=None):
        self.existing_event = existing_event
        self.added = []
        self.committed = False

    async def execute(self, query):
        return FakeScalarResult(self.existing_event)

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        for obj in self.added:
            if getattr(obj, "id", None) is None:
                obj.id = uuid4()

    async def commit(self):
        self.committed = True


def _proposal(**overrides):
    values = {
        "entity_type": "author",
        "entity_id": str(uuid4()),
        "field_name": "timeline_event",
        "suggested_value": json.dumps(
            {
                "event_type": "milestone",
                "date_value": "1831",
                "date_precision": "year",
                "label": "Enrolled at Roe Head School",
                "description": "Enrolled at Roe Head.",
            }
        ),
        "status": "accepted",
        "source_type": "ai",
        "confidence": 0.8,
    }
    values.update(overrides)
    return AIProposal(**values)


async def _apply(proposal, session, *, role="admin"):
    author_id = proposal.entity_id
    request = SimpleNamespace(state=SimpleNamespace(request_id="req-1"))
    current_user = SimpleNamespace(id=uuid4(), role=role)

    with patch("app.api.admin_syvai.get_author_or_404", new=AsyncMock(return_value=SimpleNamespace(id=author_id))), patch(
        "app.api.admin_syvai.get_proposal_or_404", new=AsyncMock(return_value=proposal)
    ), patch("app.syvai.apply_author.add_security_event", new=Mock()) as audit:
        return await apply_author_proposal(
            author_id=author_id,
            proposal_id=str(proposal.id),
            request=request,
            current_user=current_user,
            db=session,
        ), audit


@pytest.mark.asyncio
async def test_apply_creates_timeline_event():
    proposal = _proposal()
    session = FakeApplySession()

    result, audit = await _apply(proposal, session)

    assert result["applied"] is True
    assert result["already_applied"] is False
    event = [obj for obj in session.added if isinstance(obj, TimelineEvent)]
    assert len(event) == 1
    assert event[0].extraction_source == "ai"
    assert event[0].event_type == "milestone"
    assert event[0].date_value == "1831"
    assert event[0].date_precision == "year"
    assert str(event[0].id) == result["timeline_event_id"]
    assert proposal.applied_at is not None
    assert str(proposal.timeline_event_id) == str(event[0].id)
    assert session.committed is True
    audit.assert_called_once()
    assert audit.call_args.kwargs["event_type"] == "ai_proposal_apply"


@pytest.mark.asyncio
async def test_apply_updates_matched_event():
    existing = TimelineEvent(
        id=uuid4(),
        author_id=uuid4(),
        event_type="education",
        date_value="1824",
        date_precision="year",
        label="Cowan Bridge school",
    )
    existing.author_id = uuid4()
    proposal = _proposal(
        entity_id=str(existing.author_id),
        current_value=json.dumps(
            {
                "id": str(existing.id),
                "event_type": "education",
                "date_value": "1824",
                "date_precision": "year",
                "label": "Cowan Bridge school",
            }
        ),
    )
    session = FakeApplySession(existing_event=existing)

    result, audit = await _apply(proposal, session)

    assert result["already_applied"] is False
    assert result["timeline_event_id"] == str(existing.id)
    assert existing.event_type == "milestone"
    assert existing.date_value == "1831"
    assert existing.extraction_source == "ai"
    assert session.added == []


@pytest.mark.asyncio
async def test_apply_is_idempotent_when_already_applied():
    event = TimelineEvent(id=uuid4(), author_id=uuid4(), event_type="milestone", date_value="1831", date_precision="year", label="Roe Head")
    proposal = _proposal(
        entity_id=str(event.author_id),
        applied_at=__import__("datetime").datetime.now(__import__("datetime").timezone.utc),
        timeline_event_id=event.id,
    )
    session = FakeApplySession(existing_event=event)

    result, audit = await _apply(proposal, session)

    assert result["already_applied"] is True
    assert result["timeline_event_id"] == str(event.id)
    assert session.added == []
    audit.assert_not_called()


@pytest.mark.asyncio
async def test_apply_rejects_non_accepted_timeline_proposal():
    proposal = _proposal(status="proposed")
    with pytest.raises(Exception, match="Only accepted proposals"):
        await _apply(proposal, FakeApplySession())


# ============================================================
# 0.6B — author-field Apply (single boundary, safe contract)
# ============================================================


def _field_proposal(field_name, value, **overrides):
    values = {
        "entity_type": "author",
        "entity_id": str(uuid4()),
        "field_name": field_name,
        "suggested_value": json.dumps(
            {
                "field": field_name,
                "value": value,
                "label": str(value),
                "value_type": "list_text",
            }
        ),
        "status": "accepted",
        "review_band": "quality_review",
        "review_reason": "ungrounded",
        "source_type": "ai",
        "confidence": 0.8,
    }
    values.update(overrides)
    return AIProposal(**values)


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


class FakeGenreSession:
    def __init__(self, genre_names=None):
        self.genre_names = genre_names or []
        self.committed = False

    async def execute(self, query):
        return FakeRows([(name,) for name in self.genre_names])

    def add(self, obj):
        pass

    async def flush(self):
        pass

    async def commit(self):
        self.committed = True

    async def rollback(self):
        pass


def _make_author(**overrides):
    data = dict(
        id=uuid4(),
        name="Test Author",
        display_name="Test Author",
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


async def _apply_field(proposal, session, author=None):
    author_id = proposal.entity_id
    request = SimpleNamespace(state=SimpleNamespace(request_id="req-1"))
    current_user = SimpleNamespace(id=uuid4(), role="admin")
    with patch(
        "app.api.admin_syvai.get_author_or_404",
        new=AsyncMock(return_value=author or _make_author()),
    ), patch(
        "app.api.admin_syvai.get_proposal_or_404", new=AsyncMock(return_value=proposal)
    ), patch("app.syvai.apply_author.add_security_event", new=Mock()) as audit:
        return await apply_author_proposal(
            author_id=author_id,
            proposal_id=str(proposal.id),
            request=request,
            current_user=current_user,
            db=session,
        ), audit, author or _make_author()


@pytest.mark.asyncio
async def test_apply_writes_accepted_field_scalar():
    proposal = _field_proposal("nationality", "English", review_reason="ungrounded")
    author = _make_author()
    result, audit, _ = await _apply_field(proposal, FakeGenreSession(), author=author)
    assert result["applied"] is True
    assert result["already_applied"] is False
    assert author.nationality == "English"
    assert proposal.applied_at is not None
    audit.assert_called_once()
    assert audit.call_args.kwargs["event_type"] == "ai_proposal_apply"


@pytest.mark.asyncio
async def test_apply_merges_list_field_without_duplicates():
    author = _make_author(languages=["English"])
    proposal = _field_proposal("languages", "French")
    result, _, _ = await _apply_field(proposal, FakeGenreSession(), author=author)
    assert result["applied"] is True
    assert author.languages == ["English", "French"]
    # idempotent second apply
    duplicate = _field_proposal("languages", "french")
    result2, _, _ = await _apply_field(duplicate, FakeGenreSession(), author=author)
    assert result2["applied"] is True
    assert author.languages == ["English", "French"]


@pytest.mark.asyncio
async def test_apply_auto_approved_blocks_silent_overwrite():
    proposal = _field_proposal(
        "nationality", "American", review_band="auto_approved", review_reason="new_grounded"
    )
    author = _make_author(nationality="English")
    with pytest.raises(Exception, match="silently overwrite"):
        await _apply_field(proposal, FakeGenreSession(), author=author)


@pytest.mark.asyncio
async def test_apply_auto_approved_writes_placeholder_gender():
    proposal = _field_proposal("gender", "male", review_band="auto_approved", review_reason="new_grounded")
    author = _make_author(gender="unknown")
    result, _, _ = await _apply_field(proposal, FakeGenreSession(), author=author)
    assert result["applied"] is True
    assert author.gender == "male"


@pytest.mark.asyncio
async def test_apply_rejects_pending_human_review_proposal():
    proposal = _field_proposal("nationality", "English", status="proposed", review_reason="ungrounded")
    with pytest.raises(Exception, match="Only accepted or auto-approved"):
        await _apply_field(proposal, FakeGenreSession())


@pytest.mark.asyncio
async def test_apply_rejects_unsupported_field():
    proposal = _field_proposal("awards_total", "1")
    with pytest.raises(Exception, match="not supported"):
        await _apply_field(proposal, FakeGenreSession())


@pytest.mark.asyncio
async def test_apply_taxonomy_guard_requires_canonical_genre():
    proposal = _field_proposal(
        "genres",
        "invented genre",
        suggested_value=json.dumps(
            {
                "field": "genres",
                "value": "invented genre",
                "label": "invented genre",
                "value_type": "list_text",
                "taxonomy_match": {"resolved": False},
            }
        ),
    )
    with pytest.raises(Exception, match="does not resolve to a canonical genre"):
        await _apply_field(proposal, FakeGenreSession(genre_names=["Science Fiction"]))


@pytest.mark.asyncio
async def test_apply_taxonomy_guard_allows_resolved_canonical_genre():
    proposal = _field_proposal(
        "genres",
        "science fiction",
        suggested_value=json.dumps(
            {
                "field": "genres",
                "value": "science fiction",
                "label": "science fiction",
                "value_type": "list_text",
                "taxonomy_match": {"resolved": True, "slug": "science-fiction"},
            }
        ),
    )
    author = _make_author()
    result, _, _ = await _apply_field(proposal, FakeGenreSession(), author=author)
    assert result["applied"] is True
    assert author.genres == ["science fiction"]


@pytest.mark.asyncio
async def test_apply_rejects_invalid_payload_json():
    proposal = _proposal(suggested_value="not-json")
    with pytest.raises(Exception, match="not valid JSON"):
        await _apply(proposal, FakeApplySession())


@pytest.mark.asyncio
async def test_apply_rejects_missing_required_fields():
    proposal = _proposal(suggested_value=json.dumps({"event_type": "milestone"}))
    with pytest.raises(Exception, match="missing required fields"):
        await _apply(proposal, FakeApplySession())


@pytest.mark.asyncio
async def test_apply_rejects_invalid_date():
    proposal = _proposal(
        suggested_value=json.dumps(
            {"event_type": "milestone", "date_value": "not-a-date", "label": "X"}
        )
    )
    with pytest.raises(Exception, match="date is invalid"):
        await _apply(proposal, FakeApplySession())


@pytest.mark.asyncio
async def test_apply_infers_date_precision_when_missing():
    proposal = _proposal(
        suggested_value=json.dumps(
            {
                "event_type": "milestone",
                "date_value": "1854-06-29",
                "label": "Something",
            }
        )
    )
    session = FakeApplySession()

    result, audit = await _apply(proposal, session)

    event = [obj for obj in session.added if isinstance(obj, TimelineEvent)][0]
    assert event.date_precision == "full"


@pytest.mark.asyncio
async def test_check_admin_allows_roles():
    for role in ["owner", "admin", "moderator"]:
        assert await check_admin(SimpleNamespace(role=role)) is not None


@pytest.mark.asyncio
async def test_check_admin_denies_user_role():
    from fastapi import HTTPException

    with pytest.raises(HTTPException, match="Admin access"):
        await check_admin(SimpleNamespace(role="user"))
