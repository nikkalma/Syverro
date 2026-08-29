import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.admin_syvai import _bootstrap_response, preview_author_catalog_evidence
from app.models.ai_proposal import AIProposal


def _proposal(field, value, *, conflict="new", proposal_id=None):
    return AIProposal(
        id=proposal_id or uuid4(), entity_type="author", entity_id=str(uuid4()),
        field_name=field, current_value=json.dumps({"field": field, "value": "1919"}) if conflict != "new" else None,
        suggested_value=json.dumps({
            "field_name": field, "value": value,
            "source": {"wikidata_qid": "Q310732", "property_id": "P569"},
            "evidence": {"statement_id": "Q310732$statement"},
            "verification": {"verdict": "verified"},
        }),
        source_type="catalog_bootstrap", confidence=1.0, status="proposed",
        conflict_state=conflict, review_reason="bootstrap_semantic_verified_human_review_required",
    )


def _outcome(*, error=None):
    identity = SimpleNamespace(provenance=lambda: {"qid": "Q310732", "canonical_title": "Ray Bradbury"})
    return SimpleNamespace(
        run=SimpleNamespace(id=uuid4(), status="failed" if error else "completed"),
        identity=None if error else identity,
        proposals=[] if error else [
            _proposal("birth_date", {"date_value": "1920-08-22", "date_precision": "day"}),
            _proposal("death_date", {"date_value": "2012-06-05", "date_precision": "day"}, conflict="canonical_conflict"),
        ],
        fields_skipped=[] if error else [
            {"field": "occupations", "reason": "already_present_in_canonical_author", "proposed_value": "writer", "current_value": ["writer"]},
            {"field": "languages", "reason": "preserve_existing"},
        ],
        error=error,
    )


def test_preview_contract_categorizes_conflicts_existing_and_skipped():
    outcome = _outcome()
    reused_id = str(outcome.proposals[0].id)

    response = _bootstrap_response(outcome, existing_ids={reused_id}, preview=True)

    assert response["preview"] is True
    assert response["run_id"] is None
    assert response["counts"] == {"created": 1, "reused": 1, "already_present": 1, "skipped": 1}
    assert response["categories"]["verified"][0]["disposition"] == "reused"
    assert response["categories"]["conflicts"][0]["current_value"] == "1919"
    assert response["categories"]["already_present"] == [
        {"field": "occupations", "reason": "already_present_in_canonical_author", "proposed_value": "writer", "current_value": ["writer"]}
    ]
    assert response["automatic_approval"] is False
    assert response["automatic_apply"] is False


def test_preview_and_persistence_serialize_the_same_structured_reference():
    outcome = _outcome()

    preview = _bootstrap_response(outcome, existing_ids=set(), preview=True)
    persistence = _bootstrap_response(outcome, existing_ids=set(), preview=False)

    preview_items = preview["categories"]["verified"] + preview["categories"]["conflicts"]
    persisted_items = persistence["categories"]["verified"] + persistence["categories"]["conflicts"]
    assert [item["provenance"] for item in preview_items] == [
        item["provenance"] for item in persisted_items
    ]
    assert all(
        item["provenance"]["statement_id"] == "Q310732$statement"
        for item in preview_items
    )


class FakeSavepoint:
    def __init__(self):
        self.rolled_back = False

    async def rollback(self):
        self.rolled_back = True


class FakePreviewSession:
    def __init__(self):
        self.savepoint = FakeSavepoint()

    async def begin_nested(self):
        return self.savepoint


@pytest.mark.asyncio
async def test_preview_always_rolls_back_and_returns_same_pipeline_output():
    session = FakePreviewSession()
    outcome = _outcome()
    author = SimpleNamespace(id=uuid4())
    with patch("app.api.admin_syvai.get_author_or_404", new=AsyncMock(return_value=author)), patch(
        "app.api.admin_syvai._pending_bootstrap_proposal_ids", new=AsyncMock(return_value=set())
    ), patch("app.api.admin_syvai.run_author_bootstrap", new=AsyncMock(return_value=outcome)) as run:
        response = await preview_author_catalog_evidence(
            author_id=str(author.id), current_user=SimpleNamespace(role="admin"), db=session,
        )

    run.assert_awaited_once_with(session, author)
    assert session.savepoint.rolled_back is True
    assert response == _bootstrap_response(outcome, existing_ids=set(), preview=True)


@pytest.mark.asyncio
async def test_unresolved_preview_is_safe_error_and_still_rolls_back():
    session = FakePreviewSession()
    author = SimpleNamespace(id=uuid4())
    with patch("app.api.admin_syvai.get_author_or_404", new=AsyncMock(return_value=author)), patch(
        "app.api.admin_syvai._pending_bootstrap_proposal_ids", new=AsyncMock(return_value=set())
    ), patch("app.api.admin_syvai.run_author_bootstrap", new=AsyncMock(return_value=_outcome(error="IDENTITY_NOT_FOUND"))):
        with pytest.raises(HTTPException) as exc:
            await preview_author_catalog_evidence(
                author_id=str(author.id), current_user=SimpleNamespace(role="moderator"), db=session,
            )

    assert exc.value.status_code == 422
    assert exc.value.detail == {"status": "failed", "reason": "IDENTITY_NOT_FOUND"}
    assert session.savepoint.rolled_back is True
