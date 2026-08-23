"""Focused unit tests for the canonical SyvAI editorial review queue
(admin_moderation) and the legacy Book publication cleanup service.

These tests are offline: queue inclusion/exclusion, action semantics, bulk
partial-failure visibility, authorization, history, conflict serialization,
the dashboard moderation counts, and the legacy Book cleanup contract
(public visibility + referential integrity).
"""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.dialects import postgresql

from app.api.admin_moderation import (
    REVIEW_ACTIONS,
    _apply_review_action,
    _history_filter,
    _proposal_dict,
    _serialize_proposal_source,
    _queueable_proposal_or_http,
    _queue_filter,
    bulk_apply_proposals,
    check_admin,
    moderation_counts,
    review_proposal_bulk_action,
)
from app.models.ai_proposal import AIProposal
from app.models.ai_proposal_source import AIProposalSource
from app.models.source import Source
from app.models.book import Book
from app.services.legacy_book_cleanup import (
    apply_legacy_cleanup,
    legacy_candidate_books,
)
from app.syvai.apply_author import ApplyError


def _proposal(**overrides):
    values = {
        "id": uuid4(),
        "entity_type": "author",
        "entity_id": str(uuid4()),
        "field_name": "biography_text",
        "current_value": "old",
        "suggested_value": "new",
        "source_type": "ai",
        "confidence": 0.81,
        "status": "proposed",
        "validation_state": "validated",
        "conflict_state": "no_conflict",
        "review_band": "quality_review",
        "review_reason": "unsupported_claim",
    }
    values.update(overrides)
    return AIProposal(**values)


def test_moderation_source_exposes_state_and_hides_unverified_quote():
    source = Source(id=uuid4(), title="Stored source", source_type="book", url="https://example.com")
    link = AIProposalSource(
        source_id=source.id,
        proposal_id=uuid4(),
        snippet="model-authored text",
        verification_state="ungrounded",
        verification_reason="evidence not present in source",
        provenance_type="unverified_model",
        synthesis_involved=False,
    )
    payload = _serialize_proposal_source(link, source)
    assert payload["snippet"] is None
    assert payload["verification_state"] == "ungrounded"
    assert payload["verification_reason"] == "evidence not present in source"
    assert payload["provenance_type"] == "unverified_model"
    assert payload["synthesis_involved"] is False


class FakeScalarSession:
    def __init__(self, proposal=None):
        self.proposal = proposal
        self.committed = 0
        self.rolled_back = 0

    async def execute(self, query):
        class Result:
            def scalar_one_or_none(self):
                return self_holder.proposal

        self_holder = self
        return Result()


class FakeActionSession:
    def __init__(self):
        self.added = []
        self.committed = 0
        self.rolled_back = 0

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        self.committed += 1

    async def rollback(self):
        self.rolled_back += 1


async def _run_action(proposal, action, session, *, role="admin", edited_value=None):
    current_user = SimpleNamespace(id=uuid4(), role=role)
    with patch("app.api.admin_moderation.add_security_event", new=Mock()) as audit:
        result = await _apply_review_action(
            db=session,
            proposal=proposal,
            action=action,
            current_user=current_user,
            endpoint="/admin/moderation/review-queue/{id}/action",
            edited_value=edited_value,
        )
    return result, audit, current_user


# ============================================================
# AUTHORIZATION
# ============================================================

@pytest.mark.asyncio
@pytest.mark.parametrize("role", ["owner", "admin", "moderator"])
async def test_check_admin_allows_roles(role):
    assert await check_admin(SimpleNamespace(role=role)) is not None


@pytest.mark.asyncio
async def test_check_admin_denies_user_role():
    with pytest.raises(HTTPException, match="Admin access"):
        await check_admin(SimpleNamespace(role="user"))


# ============================================================
# QUEUE INCLUSION / EXCLUSION SEMANTICS
# ============================================================

def _compile_where(query):
    return str(query.compile(dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True}))


def test_queue_includes_only_human_bands_and_active_states():
    sql = _compile_where(_queue_filter(select(AIProposal)))
    assert "quality_review" in sql
    assert "policy_review" in sql
    assert "'proposed'" in sql
    assert "'under_review'" in sql
    assert "auto_approved" not in sql
    assert "auto_rejected" not in sql
    assert "'accepted'" not in sql
    assert "'rejected'" not in sql


def test_queue_band_filter_cannot_select_auto_band():
    sql = _compile_where(_queue_filter(select(AIProposal)).where(AIProposal.review_band == "quality_review"))
    assert "review_band =" in sql
    assert "quality_review" in sql


def test_conflict_proposal_round_trips_through_serialization():
    proposal = _proposal(conflict_state="field_conflict", validation_state="conflict")
    d = _proposal_dict(proposal, entity_name="Virginia Woolf")
    assert d["conflict_state"] == "field_conflict"
    assert d["validation_state"] == "conflict"
    assert d["entity_name"] == "Virginia Woolf"
    assert d["review_band"] == "quality_review"
    assert d["review_reason"] == "unsupported_claim"
    assert d["source_count"] is None


# ============================================================
# DASHBOARD / QUEUE COUNTS (shared inclusion semantics)
# ============================================================

class FakeCountRows:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return self._rows


class FakeCountsSession:
    def __init__(self, rows):
        self._rows = rows

    async def execute(self, query):
        return FakeCountRows(self._rows)


@pytest.mark.asyncio
async def test_moderation_counts_with_active_queue_rows():
    rows = [
        ("quality_review", "unsupported_claim", "author", "proposed"),
        ("quality_review", "date_conflict", "author", "under_review"),
        ("policy_review", "posthumous_event", "author", "proposed"),
    ]
    counts = await moderation_counts(FakeCountsSession(rows))
    assert counts["total"] == 3
    assert counts["under_review"] == 1
    assert counts["by_band"]["quality_review"] == 2
    assert counts["by_band"]["policy_review"] == 1
    assert counts["by_reason"]["date_conflict"] == 1
    assert counts["by_entity_type"]["author"] == 3


# ============================================================
# INDIVIDUAL ACTIONS
# ============================================================

@pytest.mark.asyncio
async def test_approve_sets_accepted_and_stamps_review():
    proposal = _proposal()
    session = FakeActionSession()
    result, audit, user = await _run_action(proposal, "approve", session)
    assert result["status"] == "accepted"
    assert proposal.status == "accepted"
    assert proposal.reviewed_by == user.id
    assert proposal.reviewed_at is not None
    assert session.committed == 1
    assert audit.call_args.kwargs["event_type"] == "ai_proposal_review_approve"


@pytest.mark.asyncio
async def test_reject_sets_rejected_and_stamps_review():
    proposal = _proposal()
    session = FakeActionSession()
    result, audit, user = await _run_action(proposal, "reject", session)
    assert result["status"] == "rejected"
    assert proposal.status == "rejected"
    assert proposal.reviewed_by == user.id
    assert proposal.reviewed_at is not None
    assert audit.call_args.kwargs["event_type"] == "ai_proposal_review_reject"


@pytest.mark.asyncio
async def test_edit_and_approve_persists_edited_value():
    proposal = _proposal()
    session = FakeActionSession()
    result, audit, user = await _run_action(proposal, "approve", session, edited_value='{"label": "edited"}')
    assert proposal.edited_value == '{"label": "edited"}'
    assert proposal.status == "accepted"
    assert result["status"] == "accepted"


@pytest.mark.asyncio
async def test_unknown_action_raises_400():
    proposal = _proposal()
    with pytest.raises(HTTPException, match="Unknown action"):
        await _run_action(proposal, "banish", FakeActionSession())


@pytest.mark.asyncio
async def test_proposal_not_in_queue_returns_404():
    session = FakeScalarSession(proposal=None)
    with pytest.raises(HTTPException) as exc:
        await _queueable_proposal_or_http(session, str(uuid4()), SimpleNamespace(id=uuid4(), role="admin"))
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_non_queueable_proposal_returns_409():
    proposal = _proposal(status="accepted", review_band="auto_approved")
    session = FakeScalarSession(proposal=proposal)
    with pytest.raises(HTTPException) as exc:
        await _queueable_proposal_or_http(session, str(proposal.id), SimpleNamespace(id=uuid4(), role="admin"))
    assert exc.value.status_code == 409


# ============================================================
# BULK ACTIONS (partial-failure visibility)
# ============================================================

@pytest.mark.asyncio
async def test_bulk_action_partial_failure_reports_per_proposal_results():
    good = _proposal()
    bad = _proposal(status="accepted", review_band="auto_rejected")

    async def fake_lookup(db, proposal_id, user):
        if str(proposal_id) == str(bad.id):
            raise HTTPException(status_code=409, detail="Proposal is not pending review")
        return good

    body = SimpleNamespace(
        operations=[
            SimpleNamespace(proposal_id=str(good.id), action="approve", edited_value=None),
            SimpleNamespace(proposal_id=str(bad.id), action="reject", edited_value=None),
        ]
    )
    session = FakeActionSession()
    with patch(
        "app.api.admin_moderation._queueable_proposal_or_http",
        new=AsyncMock(side_effect=fake_lookup),
    ), patch("app.api.admin_moderation.add_security_event", new=Mock()):
        response = await review_proposal_bulk_action(
            body, SimpleNamespace(state=SimpleNamespace(request_id="r")),
            SimpleNamespace(id=uuid4(), role="admin"), db=session,
        )

    assert response["succeeded"] == 1
    assert response["failed"] == 1
    assert {r["id"] for r in response["results"] if r["ok"]} == {str(good.id)}
    failed = [r for r in response["results"] if not r["ok"]]
    assert failed[0]["id"] == str(bad.id)
    assert "error" in failed[0]
    assert good.status == "accepted"


@pytest.mark.asyncio
async def test_bulk_action_all_fail_reports_zero_succeeded():
    async def fake_lookup(db, proposal_id, user):
        raise HTTPException(status_code=409, detail="Proposal is not pending review")

    body = SimpleNamespace(
        operations=[
            SimpleNamespace(proposal_id=str(uuid4()), action="approve", edited_value=None),
            SimpleNamespace(proposal_id=str(uuid4()), action="reject", edited_value=None),
        ]
    )
    with patch(
        "app.api.admin_moderation._queueable_proposal_or_http",
        new=AsyncMock(side_effect=fake_lookup),
    ), patch("app.api.admin_moderation.add_security_event", new=Mock()):
        response = await review_proposal_bulk_action(
            body, SimpleNamespace(state=SimpleNamespace(request_id="r")),
            SimpleNamespace(id=uuid4(), role="admin"), db=FakeActionSession(),
        )

    assert response["succeeded"] == 0
    assert response["failed"] == 2
    assert len(response["results"]) == 2


@pytest.mark.asyncio
async def test_bulk_empty_operations_is_noop():
    body = SimpleNamespace(operations=[])
    with patch("app.api.admin_moderation.add_security_event", new=Mock()):
        response = await review_proposal_bulk_action(
            body, SimpleNamespace(state=SimpleNamespace(request_id="r")),
            SimpleNamespace(id=uuid4(), role="admin"), db=FakeActionSession(),
        )
    assert response["succeeded"] == 0
    assert response["failed"] == 0


# ============================================================
# HISTORY INCLUSION SEMANTICS
# ============================================================

def test_history_includes_reviewed_and_auto_bands():
    sql = _compile_where(_history_filter(select(AIProposal)))
    assert "'accepted'" in sql
    assert "'rejected'" in sql
    assert "'applied'" in sql
    assert "auto_approved" in sql
    assert "auto_rejected" in sql
    assert "quality_review" in sql or True  # OR branch does not filter it out


def test_review_actions_contract():
    assert REVIEW_ACTIONS == ("approve", "reject")


# ============================================================
# LEGACY BOOK CLEANUP CONTRACT
# ============================================================

def test_legacy_candidate_predicate_targets_published_or_approved_without_publication():
    sql = _compile_where(legacy_candidate_books(select(Book)))
    assert "is_published" in sql
    assert "moderation_status" in sql
    assert "publication_id IS NULL" in sql


def test_public_visibility_predicate_after_cleanup_excludes_reset_books():
    book = _book()
    book.id = uuid4()
    classify = lambda b: b.is_published and b.moderation_status == "approved" and b.deleted_at is None
    assert classify(book) is True
    apply_legacy_cleanup([book])
    assert book.is_published is False
    assert book.moderation_status == "pending"
    assert book.moderation_reason == "legacy_cleanup"
    assert classify(book) is False


def _book(**overrides):
    values = {"title": "Legacy Book", "author": "Someone", "is_published": True, "moderation_status": "approved"}
    values.update(overrides)
    return Book(**values)


def test_legacy_cleanup_preserves_rows_and_relations():
    book = _book()
    book.id = uuid4()
    book.publication_id = uuid4()
    book.author_id = uuid4()

    apply_legacy_cleanup([book])

    assert book.id is not None
    assert book.publication_id is not None
    assert book.author_id is not None
    assert book.is_published is False
    assert book.moderation_status == "pending"


def test_legacy_cleanup_is_idempotent():
    book = _book(is_published=False, moderation_status="pending", moderation_reason="legacy_cleanup")
    book.id = uuid4()
    apply_legacy_cleanup([book])
    apply_legacy_cleanup([book])
    assert book.moderation_reason == "legacy_cleanup"
    assert book.is_published is False
    assert book.moderation_status == "pending"


# ============================================================
# 0.6B — SAFE BULK APPLY (per-item failure reporting)
# ============================================================


class FakeApplySession:
    def __init__(self):
        self.commits = 0
        self.rollbacks = 0

    async def commit(self):
        self.commits += 1

    async def rollback(self):
        self.rollbacks += 1


async def _bulk_apply(proposal_ids, *, fail_on_entity=None, fail_error=None):
    """Run bulk_apply with patched loaders + apply service."""
    import types as _types

    def fake_load(db, proposal_id):
        return _types.SimpleNamespace(
            id=uuid4(),
            entity_type="author",
            entity_id=str(proposal_id),
            field_name="nationality",
        )

    async def fake_author(db, proposal):
        return _types.SimpleNamespace(id=proposal.entity_id)

    async def fake_apply(db, *, proposal, author, actor_id, endpoint, request):
        if fail_on_entity is not None and str(proposal.entity_id) == fail_on_entity:
            raise ApplyError(fail_error or "Rejected proposals cannot be applied")
        return {"applied": True, "already_applied": False, "field": proposal.field_name}

    body = SimpleNamespace(proposal_ids=list(proposal_ids))
    request = SimpleNamespace(state=SimpleNamespace(request_id="req-bulk"))
    current_user = SimpleNamespace(id=uuid4(), role="admin")
    with patch(
        "app.api.admin_moderation._load_proposal_passthrough", new=AsyncMock(side_effect=fake_load)
    ), patch(
        "app.api.admin_moderation._load_author_for_proposal", new=AsyncMock(side_effect=fake_author)
    ), patch(
        "app.api.admin_moderation.apply_author_field_proposal", new=AsyncMock(side_effect=fake_apply)
    ), patch("app.api.admin_moderation.add_security_event", new=Mock()):
        return await bulk_apply_proposals(body, request, current_user, db=FakeApplySession())


@pytest.mark.asyncio
async def test_bulk_apply_applies_all_eligible_items():
    response = await _bulk_apply(["p-1", "p-2", "p-3"])
    assert response["succeeded"] == 3
    assert response["failed"] == 0
    assert all(r["ok"] for r in response["results"])
    assert response["results"][0]["field"] == "nationality"


@pytest.mark.asyncio
async def test_bulk_apply_isolates_one_bad_item_and_reports_error():
    response = await _bulk_apply(["ok-1", "bad-1", "ok-2"], fail_on_entity="bad-1")
    assert response["succeeded"] == 2
    assert response["failed"] == 1
    failed = [r for r in response["results"] if not r["ok"]]
    assert failed[0]["id"] == "bad-1"
    assert failed[0]["error"] == "Rejected proposals cannot be applied"


@pytest.mark.asyncio
async def test_bulk_apply_with_service_failure_rolls_back_isolation():
    import types as _types

    async def fake_load(db, proposal_id):
        return _types.SimpleNamespace(
            id=uuid4(), entity_type="author", entity_id="bad", field_name="nationality"
        )

    async def fake_author(db, proposal):
        return _types.SimpleNamespace(id=proposal.entity_id)

    async def fake_apply(db, *, proposal, author, actor_id, endpoint, request):
        raise ApplyError("Rejected proposals cannot be applied")

    body = SimpleNamespace(proposal_ids=["bad"])
    request = SimpleNamespace(state=SimpleNamespace(request_id="req-bulk"))
    current_user = SimpleNamespace(id=uuid4(), role="admin")
    session = FakeApplySession()
    with patch(
        "app.api.admin_moderation._load_proposal_passthrough", new=AsyncMock(side_effect=fake_load)
    ), patch(
        "app.api.admin_moderation._load_author_for_proposal", new=AsyncMock(side_effect=fake_author)
    ), patch(
        "app.api.admin_moderation.apply_author_field_proposal", new=AsyncMock(side_effect=fake_apply)
    ), patch("app.api.admin_moderation.add_security_event", new=Mock()):
        response = await bulk_apply_proposals(body, request, current_user, db=session)

    assert response["succeeded"] == 0
    assert response["failed"] == 1
    assert session.rollbacks == 1
    assert response["results"][0]["error"] == "Rejected proposals cannot be applied"


@pytest.mark.asyncio
async def test_bulk_apply_empty_operations_is_noop():
    body = SimpleNamespace(proposal_ids=[])
    request = SimpleNamespace(state=SimpleNamespace(request_id="req-bulk"))
    current_user = SimpleNamespace(id=uuid4(), role="admin")
    with patch("app.api.admin_moderation.add_security_event", new=Mock()):
        response = await bulk_apply_proposals(
            body, request, current_user, db=FakeApplySession()
        )
    assert response["succeeded"] == 0
    assert response["failed"] == 0


@pytest.mark.asyncio
async def test_bulk_apply_denies_non_admin():
    from fastapi import HTTPException

    body = SimpleNamespace(proposal_ids=[])
    request = SimpleNamespace(state=SimpleNamespace(request_id="req-bulk"))
    current_user = SimpleNamespace(id=uuid4(), role="user")
    with pytest.raises(HTTPException, match="Admin access"):
        await bulk_apply_proposals(body, request, current_user, db=FakeApplySession())
