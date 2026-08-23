"""SyvAI 0.2A discovery API + service tests (offline)."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

import pytest

from app.models.ai_proposal import AIProposal
from app.models.source import Source
from app.models.source_candidate import SourceCandidate
from app.syvai.discovery import approve_candidate, discovery_metrics, reject_candidate, run_discovery
from app.syvai.discovery.providers import FakeDiscoveryProvider
from app.syvai.errors import ConfigurationError, DiscoveryError


class FakeDiscoveryResult:
    def __init__(self, rows):
        self._rows = rows

    def scalars(self):
        return self

    def all(self):
        return self._rows

    def scalar_one_or_none(self):
        return self._rows[0] if self._rows else None

    def scalar(self):
        return self._rows[0] if self._rows else None


class FakeDiscoverySession:
    def __init__(self, sources=None, candidates=None, proposals=None):
        self.sources = sources or []
        self.candidates = candidates or []
        self.proposals = proposals or []
        self.added = []
        self.committed = False
        self.refreshed = []

    async def execute(self, query):
        descriptions = query.column_descriptions
        if descriptions:
            entity = descriptions[0].get("entity")
            if entity is Source:
                return FakeDiscoveryResult(self.sources)
            if entity is SourceCandidate:
                return FakeDiscoveryResult(self.candidates)
            if entity is AIProposal:
                return FakeDiscoveryResult(self.proposals)
        return FakeDiscoveryResult([])

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        for obj in self.added:
            if getattr(obj, "id", None) is None:
                obj.id = uuid4()

    async def commit(self):
        self.committed = True

    async def refresh(self, obj):
        self.refreshed.append(obj)


def _author():
    return SimpleNamespace(
        id=uuid4(),
        name="Anne Brontë",
        display_name="Anne Brontë",
    )


@pytest.mark.asyncio
async def test_run_discovery_does_not_auto_promote_score_only_candidates():
    session = FakeDiscoverySession()
    author = _author()
    provider = FakeDiscoveryProvider()

    outcome = await run_discovery(session, author, provider)

    assert outcome.error is None
    assert outcome.run.status == "review_needed"
    assert outcome.run.domain == "source_discovery"
    assert outcome.run.provider == "fake-discovery"
    assert session.committed is True
    assert len(outcome.candidates) == 5  # fixture: spam-tld stays as rejected candidate
    # Authority, lexical relevance, and evidence length are ranking signals,
    # not deterministic Author identity proof.
    assert len(outcome.created_sources) == 0

    rows = [obj for obj in session.added if isinstance(obj, SourceCandidate)]
    sources = [obj for obj in session.added if isinstance(obj, Source)]
    assert len(rows) == 5
    assert len(sources) == 0
    auto_rows = [r for r in rows if r.review_action == "auto_approved"]
    assert len(auto_rows) == 0
    wikipedia_rows = [r for r in rows if "wikipedia.org" in (r.url or "")]
    assert all(r.review_action == "auto_approved" for r in wikipedia_rows) is False
    assert outcome.duplicate_skipped == 0


@pytest.mark.asyncio
async def test_run_discovery_records_failure_without_raising():
    class FailingProvider:
        name = "failing-discovery"

        async def discover(self, author, terms):
            raise RuntimeError("boom")

    session = FakeDiscoverySession()
    outcome = await run_discovery(session, _author(), FailingProvider())  # type: ignore[arg-type]

    assert outcome.error == "internal SyvAI discovery error"
    assert outcome.run.status == "failed"
    assert session.committed is True


@pytest.mark.asyncio
async def test_run_discovery_drops_existing_duplicates():
    existing = Source(
        id=uuid4(),
        title="Anne Brontë",
        source_type="encyclopedia",
        url="https://en.wikipedia.org/wiki/Anne_Brontë",
        normalized_url="https://en.wikipedia.org/wiki/Anne_Brontë",
        source_origin="manual",
    )
    session = FakeDiscoverySession(sources=[existing])
    outcome = await run_discovery(session, _author(), FakeDiscoveryProvider())

    assert outcome.duplicate_skipped == 1
    candidate_urls = {c.url for c in outcome.candidates}
    assert "https://en.wikipedia.org/wiki/Anne_Brontë" not in candidate_urls


@pytest.mark.asyncio
async def test_approve_candidate_promotes_to_source_and_audits():
    session = FakeDiscoverySession()
    author = _author()
    candidate = SourceCandidate(
        id=uuid4(),
        author_id=author.id,
        url="https://example-blog.example/anne-bronte",
        normalized_url="https://example-blog.example/anne-bronte",
        title="A blog",
        authority_tier="unknown",
        assessment="needs_review",
        status="pending",
        provider="fake-discovery",
    )

    audit = Mock()
    approved = await approve_candidate(
        session, str(author.id), candidate, actor_id=str(uuid4()), add_security_event=audit
    )

    assert approved.status == "reviewed"
    assert approved.review_action == "approved"
    assert approved.reviewed_by is not None
    assert session.committed is True
    assert audit.called
    assert audit.call_args.kwargs["event_type"] == "source_candidate_approve"
    created = [obj for obj in session.added if isinstance(obj, Source)]
    assert len(created) == 1
    assert created[0].review_status == "reviewed"
    assert str(approved.source_id) == str(created[0].id)


@pytest.mark.asyncio
async def test_approve_candidate_reuses_existing_source():
    existing = Source(
        id=uuid4(),
        title="Already here",
        source_type="website",
        url="https://example.com/x",
        normalized_url="https://example.com/x",
    )
    session = FakeDiscoverySession(sources=[existing])
    candidate = SourceCandidate(
        id=uuid4(),
        author_id=uuid4(),
        url="https://example.com/x",
        normalized_url="https://example.com/x",
        title="X",
        authority_tier="medium",
        assessment="needs_review",
        status="pending",
    )

    approved = await approve_candidate(
        session, str(candidate.author_id), candidate, actor_id=str(uuid4())
    )
    assert str(approved.source_id) == str(existing.id)
    created = [obj for obj in session.added if isinstance(obj, Source)]
    assert created == []


@pytest.mark.asyncio
async def test_reject_candidate_marks_reviewed():
    session = FakeDiscoverySession()
    candidate = SourceCandidate(
        id=uuid4(),
        author_id=uuid4(),
        url="https://spam.xyz/x",
        normalized_url="https://spam.xyz/x",
        title="Spam",
        authority_tier="unknown",
        assessment="needs_review",
        status="pending",
    )

    audit = Mock()
    rejected = await reject_candidate(
        session, str(candidate.author_id), candidate, actor_id=str(uuid4()), add_security_event=audit
    )
    assert rejected.status == "reviewed"
    assert rejected.review_action == "rejected"
    assert audit.call_args.kwargs["event_type"] == "source_candidate_reject"
    assert [obj for obj in session.added if isinstance(obj, Source)] == []


@pytest.mark.asyncio
async def test_review_actions_require_pending():
    session = FakeDiscoverySession()
    candidate = SourceCandidate(
        id=uuid4(),
        author_id=uuid4(),
        url="https://example.com",
        normalized_url="https://example.com",
        title="X",
        authority_tier="medium",
        assessment="needs_review",
        status="reviewed",
    )
    with pytest.raises(DiscoveryError):
        await approve_candidate(session, str(candidate.author_id), candidate, actor_id=str(uuid4()))
    with pytest.raises(DiscoveryError):
        await reject_candidate(session, str(candidate.author_id), candidate, actor_id=str(uuid4()))


@pytest.mark.asyncio
async def test_discovery_metrics_counts_human_actions():
    author_id = uuid4()
    candidates = [
        SourceCandidate(
            id=uuid4(), author_id=author_id, url="https://a.example", normalized_url="https://a.example",
            title="A", authority_tier="medium", assessment="needs_review", status="reviewed",
            review_action="approved",
        ),
        SourceCandidate(
            id=uuid4(), author_id=author_id, url="https://b.example", normalized_url="https://b.example",
            title="B", authority_tier="medium", assessment="needs_review", status="reviewed",
            review_action="rejected",
        ),
        SourceCandidate(
            id=uuid4(), author_id=author_id, url="https://c.example", normalized_url="https://c.example",
            title="C", authority_tier="high", assessment="auto_usable", status="reviewed",
            review_action="auto_approved",
        ),
    ]
    session = FakeDiscoverySession(candidates=candidates)

    metrics = await discovery_metrics(session, str(author_id))
    assert metrics["candidates_total"] == 3
    assert metrics["candidates_pending"] == 0
    assert metrics["by_assessment"] == {"needs_review": 2, "auto_usable": 1}
    assert metrics["by_review_action"]["approved"] == 1
    assert metrics["by_review_action"]["rejected"] == 1
    assert metrics["human_actions_per_author"] == 2


# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------


async def _run_endpoint(session, author, *, configured=True):
    from app.api.admin_syvai_discovery import trigger_discovery_run

    current_user = SimpleNamespace(id=uuid4(), role="admin")
    provider = FakeDiscoveryProvider()

    if configured:
        provider_patch = patch(
            "app.api.admin_syvai_discovery.build_discovery_providers",
            return_value=[provider],
        )
    else:
        provider_patch = patch(
            "app.api.admin_syvai_discovery.build_discovery_providers",
            side_effect=ConfigurationError("SyvAI source discovery is not enabled: set SYVAI_DISCOVERY_ENABLED=true"),
        )

    with provider_patch, patch(
        "app.api.admin_syvai_discovery.get_author_or_404",
        new=AsyncMock(return_value=author),
    ):
        return await trigger_discovery_run(
            author_id=str(author.id),
            current_user=current_user,
            db=session,
        )


@pytest.mark.asyncio
async def test_trigger_run_endpoint_returns_candidates():
    session = FakeDiscoverySession()
    author = _author()

    response = await _run_endpoint(session, author, configured=True)

    assert response["message"] == "Source discovery completed"
    assert response["run"]["domain"] == "source_discovery"
    assert response["run"]["provider"] == "fake-discovery"
    assert len(response["candidates"]) >= 1
    assert response["created_sources"] == []
    assert response["providers_attempted"] == 1
    assert response["providers_succeeded"] == 1
    assert response["providers_failed"] == 0
    assert session.committed is True


@pytest.mark.asyncio
async def test_trigger_run_endpoint_503_when_not_configured():
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        await _run_endpoint(FakeDiscoverySession(), _author(), configured=False)
    assert exc_info.value.status_code == 503
    assert "not enabled" in exc_info.value.detail
