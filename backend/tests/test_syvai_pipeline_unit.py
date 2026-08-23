import json
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.models.ai_proposal import AIProposal
from app.models.ai_proposal_source import AIProposalSource
from app.models.source import Source
from app.models.syvai_run import SyvaiRun
from app.models.timeline_event import TimelineEvent
from app.syvai.errors import ConfigurationError, StructuredOutputError
from app.syvai.pipeline import (
    _current_value_json,
    _match_source,
    _reliability_tier,
    _sanitize_error,
    run_timeline_research,
)
from app.syvai.provider import FakeProvider
from app.syvai.validators import ExistingEvent


def _author():
    return SimpleNamespace(
        id=uuid4(),
        display_name="Charlotte Brontë",
        name="Charlotte Brontë",
        birth_date="1816-04-21",
        birth_date_precision="full",
        death_date="1855-03-31",
        death_date_precision="full",
        birth_place="Thornton, England",
        death_place="Haworth, England",
    )


def _source(title="Encyclopaedia Britannica", score="4", citation=None):
    return Source(
        id=uuid4(),
        title=title,
        source_type="encyclopedia",
        url="https://www.britannica.com",
        reliability_score=score,
        source_origin="manual",
        citation=citation,
    )


class FakeRow:
    def __init__(self, values):
        self._values = values

    def __getitem__(self, index):
        return self._values[index]


class FakeIterResult:
    def __init__(self, rows):
        self._rows = rows

    def __iter__(self):
        return iter(self._rows)

    def scalars(self):
        return self

    def all(self):
        return self._rows


class FakeSession:
    def __init__(self, sources=None, events=None):
        self.sources = sources or []
        self.events = events or []
        self.added = []
        self.committed = False
        self.refreshed = []

    async def execute(self, query):
        descriptions = query.column_descriptions
        if descriptions:
            entity = descriptions[0].get("entity")
            name = descriptions[0].get("name")
            if name == "source_id":
                return FakeIterResult([FakeRow((source.id,)) for source in self.sources])
            if entity is Source or entity is TimelineEvent:
                return FakeIterResult(self.sources if entity is Source else self.events)
        return FakeIterResult([])

    async def scalar(self, query):
        return None

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


CLAIM_JSON = {
    "event_type": "milestone",
    "date_value": "1831",
    "date_precision": "year",
    "label": "Enrolled at Roe Head School",
    "description": "Enrolled at Roe Head, Mirfield.",
    "sources": [{"title": "Encyclopaedia Britannica", "source_type": "encyclopedia"}],
}


def test_match_source_matches_by_url_and_title():
    source = {"id": "s1", "title": "Britannica", "url": "https://www.britannica.com"}
    assert _match_source({"url": "https://www.britannica.com/"}, [source]) == source
    assert _match_source({"title": "Britannica"}, [source]) == source
    assert _match_source({"title": "A different title"}, [source]) is None


def test_match_source_no_false_prefix_match():
    sources = [{"id": "s1", "title": "Encyclopedia Britannica 1911"}]
    assert _match_source({"title": "Encyclopedia"}, sources) is None
    assert _match_source({"title": "Encyclopedia Britannica"}, sources) is None
    assert _match_source({"title": "Encyclopedia Britannica 1911"}, sources) == sources[0]


def test_match_source_url_no_prefix_match():
    sources = [{"id": "s1", "url": "https://www.britannica.com/topic/bronte"}]
    assert _match_source({"url": "https://www.britannica.com"}, sources) is None


def test_reliability_tier_mapping():
    assert _reliability_tier("4") == "high"
    assert _reliability_tier("0.9") == "high"
    assert _reliability_tier("0.7") == "medium"
    assert _reliability_tier("0.4") == "low"
    assert _reliability_tier(None) == "unknown"
    assert _reliability_tier("garbage") == "unknown"


def test_current_value_json():
    event = ExistingEvent(id="e1", event_type="education", date_value="1824", date_precision="year", label="Cowan Bridge")
    payload = json.loads(_current_value_json(event))
    assert payload["id"] == "e1"
    assert _current_value_json(None) is None


def test_sanitize_error_never_leaks_body():
    assert _sanitize_error(ConfigurationError("key missing")) == "key missing"
    assert "secret" not in _sanitize_error(StructuredOutputError("bad output"))
    assert "provider body" not in _sanitize_error(RuntimeError("boom"))


DEFAULT_CITATION = (
    "Charlotte Brontë enrolled at Roe Head School in Mirfield in 1831. "
    "She later worked as a governess before the publication of Jane Eyre."
)


def _claim(evidence: str | None, **source_overrides) -> dict:
    source = {"title": "Encyclopaedia Britannica", "source_type": "encyclopedia"}
    if evidence is not None:
        source["evidence"] = evidence
    source.update(source_overrides)
    claim = dict(CLAIM_JSON)
    claim["sources"] = [source]
    return claim


@pytest.mark.asyncio
async def test_run_timeline_research_persists_proposals_and_links_sources():
    author = _author()
    source = _source(citation=DEFAULT_CITATION)
    session = FakeSession(sources=[source])
    provider = FakeProvider(
        json.dumps({"events": [_claim("Enrolled at Roe Head School in Mirfield in 1831")]})
    )

    outcome = await run_timeline_research(session, author, provider)

    assert outcome.error is None
    assert outcome.run.status == "completed"
    assert outcome.run.source_count == 1
    assert session.committed is True
    assert len(outcome.proposals) == 1

    proposal = outcome.proposals[0]
    assert proposal.field_name == "timeline_event"
    assert proposal.status == "proposed"
    assert proposal.run_id == outcome.run.id
    assert proposal.conflict_state == "new"
    assert proposal.validation_state == "validated"
    assert proposal.confidence > 0.5

    assert proposal.review_band == "auto_approved"
    assert proposal.review_reason == "new_grounded"

    sources = [obj for obj in session.added if isinstance(obj, AIProposalSource)]
    assert len(sources) == 1
    assert sources[0].proposal_id == proposal.id
    assert str(sources[0].source_id) == str(source.id)
    assert sources[0].reliability_tier == "high"
    assert sources[0].snippet == "Charlotte Brontë enrolled at Roe Head School in Mirfield in 1831."
    assert sources[0].verification_state == "direct_grounded"
    assert sources[0].provenance_type == "source_span"

    assert outcome.run.provider == "fake"
    assert outcome.run.total_tokens == 150
    assert outcome.run.estimated_cost_usd == 0.00002
    assert provider.calls


@pytest.mark.asyncio
async def test_run_timeline_research_no_sources_marks_needs_review():
    author = _author()
    session = FakeSession(sources=[])
    provider = FakeProvider(json.dumps({"events": [CLAIM_JSON]}))

    outcome = await run_timeline_research(session, author, provider)

    assert outcome.run.status == "review_needed"
    assert outcome.proposals[0].validation_state == "needs_review"
    source_links = [obj for obj in session.added if isinstance(obj, AIProposalSource)]
    assert source_links == []


@pytest.mark.asyncio
async def test_restatement_proposal_is_auto_rejected_with_band():
    """0.1B: restatements of curated events are rejected without queueing a reviewer."""
    author = _author()
    source = _source()
    session = FakeSession(
        sources=[source],
        events=[
            ExistingEvent(
                id="e1",
                event_type="education",
                date_value="1824",
                date_precision="year",
                label="Cowan Bridge school",
            )
        ],
    )
    claim = {
        "event_type": "education",
        "date_value": "1824",
        "date_precision": "year",
        "label": "Attended Cowan Bridge School",
        "description": "Enrolled at the school run by the Clergy Daughters' institution.",
        "sources": [{"title": "Encyclopaedia Britannica", "source_type": "encyclopedia"}],
    }
    provider = FakeProvider(json.dumps({"events": [claim]}))

    outcome = await run_timeline_research(session, author, provider)

    assert outcome.error is None
    assert outcome.run.status == "completed"
    assert len(outcome.proposals) == 1
    proposal = outcome.proposals[0]
    assert proposal.review_band == "auto_rejected"
    assert proposal.review_reason == "restatement"
    assert proposal.status == "rejected"
    assert proposal.reviewed_at is None
    assert proposal.reviewed_by is None


@pytest.mark.asyncio
async def test_quality_and_policy_bands_require_human_review():
    """0.1B: unsupported claims (quality) and posthumous events (policy) keep review_needed."""
    author = _author()
    source = _source(
        title="Smith Elder",
        citation="The Professor, Charlotte Brontë's first novel, was published posthumously in 1857.",
    )
    session = FakeSession(sources=[source])
    claims = [
        {
            "event_type": "publication",
            "date_value": "1857",
            "date_precision": "year",
            "label": "The Professor published posthumously",
            "sources": [
                {
                    "title": "Smith Elder",
                    "source_type": "publisher",
                    "evidence": "The Professor, Charlotte Brontë's first novel, was published posthumously in 1857",
                }
            ],
        }
    ]
    provider = FakeProvider(json.dumps({"events": claims}))

    outcome = await run_timeline_research(session, author, provider)

    assert outcome.run.status == "review_needed"
    proposal = outcome.proposals[0]
    assert proposal.review_band == "policy_review"
    assert proposal.review_reason == "posthumous_event"
    assert proposal.status == "proposed"


@pytest.mark.asyncio
async def test_ungrounded_evidence_keeps_human_review():
    """0.2C: linked sources whose evidence cannot be verified never auto-approve."""
    author = _author()
    source = _source(citation=DEFAULT_CITATION)
    session = FakeSession(sources=[source])
    provider = FakeProvider(
        json.dumps(
            {
                "events": [
                    _claim(
                        "Enrolled at an academy in the town where she boarded.",
                    )
                ]
            }
        )
    )

    outcome = await run_timeline_research(session, author, provider)

    assert outcome.run.status == "review_needed"
    proposal = outcome.proposals[0]
    assert proposal.review_band == "quality_review"
    assert proposal.review_reason == "ungrounded"
    assert proposal.status == "proposed"

    links = [obj for obj in session.added if isinstance(obj, AIProposalSource)]
    assert len(links) == 1
    assert links[0].snippet is None


@pytest.mark.asyncio
async def test_run_timeline_research_records_structured_output_failure():
    author = _author()
    session = FakeSession(sources=[])
    provider = FakeProvider("not json")

    outcome = await run_timeline_research(session, author, provider)

    assert outcome.run.status == "failed"
    assert "provider output rejected" in outcome.error
    assert outcome.proposals == []
    assert session.committed is True


@pytest.mark.asyncio
async def test_run_timeline_research_no_sources_in_run_telemetry():
    author = _author()
    session = FakeSession(sources=[])
    provider = FakeProvider(json.dumps({"events": [CLAIM_JSON]}))

    outcome = await run_timeline_research(session, author, provider)

    assert outcome.run.source_count == 0
    assert outcome.run.duration_ms is not None


@pytest.mark.asyncio
async def test_run_timeline_research_commit_even_on_failure():
    author = _author()
    session = FakeSession(sources=[])
    provider = FakeProvider(json.dumps({"events": [CLAIM_JSON]}))

    class FailingProvider:
        name = "failing"
        model = "x"

        async def complete(self, system, user):
            raise RuntimeError("boom")

    outcome = await run_timeline_research(session, author, FailingProvider())

    assert outcome.run.status == "failed"
    assert outcome.error == "internal SyvAI error"
    assert session.committed is True
