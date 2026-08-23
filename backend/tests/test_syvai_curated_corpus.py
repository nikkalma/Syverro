from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.syvai.corpus import (
    AUTO_VERIFIED, AUTO_VERIFIED_LEGACY, HUMAN_VERIFIED, NEEDS_REVIEW, REJECTED,
    CorpusSnapshot, corpus_state,
)
from app.syvai.core_fill import run_domain_research
from app.syvai.discovery.verification import inspect_content_capabilities, verify_candidate_identity
from app.syvai.provider import FakeProvider


def candidate(**values):
    defaults = dict(
        assessment="needs_review", status="pending", review_action=None,
        source_id=None, identity_verification=None,
    )
    defaults.update(values)
    return SimpleNamespace(**defaults)


def test_strict_auto_verified_resolved_identity():
    resolved = SimpleNamespace(
        en_url="https://en.wikipedia.org/wiki/Anne_Bronte", en_title="Anne Brontë",
        ru_title="Бронте, Энн", method="exact_title", source_variant="Энн Бронте", fallback={},
    )
    result = verify_candidate_identity(
        query_terms=["Anne Brontë"], title="Anne Brontë", metadata_fields={},
        origin="langlinks_bootstrap", resolved_identity=resolved, candidate_url=resolved.en_url,
    )
    assert result["state"] == "verified"
    assert result["method"] == "wikipedia_langlink"


def test_weak_lexical_match_needs_review():
    result = verify_candidate_identity(
        query_terms=["Anne Brontë"], title="The Brontë family", metadata_fields={},
        origin="search", candidate_url="https://example.test/bronte",
    )
    assert result["state"] == "needs_review"


def test_wrong_structured_creator_is_rejected():
    result = verify_candidate_identity(
        query_terms=["Anne Brontë"], title="Poems", metadata_fields={"creator": "Charlotte Brontë"},
        origin="catalog", candidate_url="https://example.test/poems",
    )
    assert result["state"] == "rejected"


def test_structured_creator_requires_stable_identifier_for_auto_verification():
    weak = verify_candidate_identity(
        query_terms=["Anne Brontë"], title="Agnes Grey", metadata_fields={"creator": "Anne Brontë"},
        origin="catalog", candidate_url="https://example.test/agnes",
    )
    strong = verify_candidate_identity(
        query_terms=["Anne Brontë"], title="Agnes Grey",
        metadata_fields={"creator": "Anne Brontë", "authority_id": "authority-record-1"},
        origin="catalog", candidate_url="https://example.test/agnes",
    )
    assert weak["state"] == "needs_review"
    assert strong["state"] == "verified"


def test_corpus_states_and_author_specific_decisions():
    source_id = uuid4()
    approved = candidate(review_action="approved", status="reviewed", source_id=source_id)
    pending_for_other_author = candidate(source_id=None)
    assert corpus_state(approved) == HUMAN_VERIFIED
    assert corpus_state(pending_for_other_author) == NEEDS_REVIEW


def test_legacy_auto_approved_is_not_strict_auto_verified():
    row = candidate(review_action="auto_approved", status="reviewed", source_id=uuid4())
    assert corpus_state(row) == AUTO_VERIFIED_LEGACY
    row.identity_verification = {"state": "verified"}
    assert corpus_state(row) == AUTO_VERIFIED


def test_rejected_decision_remains_rejected():
    row = candidate(review_action="rejected", status="reviewed", assessment="needs_review")
    assert corpus_state(row) == REJECTED


def test_source_type_alone_grants_no_capability():
    capabilities, evidence = inspect_content_capabilities(evidence="", metadata_fields={"source_type": "book"})
    assert capabilities == []
    assert evidence == {}


def test_catalog_creator_metadata_grants_only_evidenced_identity_and_bibliography():
    capabilities, evidence = inspect_content_capabilities(
        evidence="", metadata_fields={"creator": "Anne Brontë", "title": "Agnes Grey"},
    )
    assert capabilities == ["BIBLIOGRAPHY", "IDENTITY"]
    assert all(evidence[capability] for capability in capabilities)


def test_book_biographical_preface_can_expose_biography_from_span():
    capabilities, evidence = inspect_content_capabilities(
        evidence="Biographical introduction: Anne Brontë was born in 1820 and was a novelist.",
        metadata_fields={"source_type": "book"},
    )
    assert "BIOGRAPHY" in capabilities
    assert evidence["BIOGRAPHY"][0]["kind"] == "source_span"


def snapshot(*, sources=None, pending=0, rejected=0):
    verified = sources or []
    coverage = {}
    for source in verified:
        for capability in source["content_capabilities"]:
            coverage.setdefault(capability, []).append(source["id"])
    return CorpusSnapshot("author", verified, [], coverage, pending, rejected, 0)


def source(source_id, capabilities):
    return {
        "id": source_id, "title": source_id, "url": f"https://example.test/{source_id}",
        "source_type": "document", "citation": "Grounded content.", "language": "en",
        "reliability_score": "4", "trust_state": HUMAN_VERIFIED,
        "content_capabilities": capabilities, "capability_evidence": {},
        "identity_verification": None, "candidate_id": source_id,
    }


def test_manifest_has_exact_domain_relevant_sources_and_exclusions():
    corpus = snapshot(
        sources=[source("identity", ["IDENTITY"]), source("bio", ["BIOGRAPHY"])],
        pending=2, rejected=3,
    )
    selected = corpus.sources_for_domain("biography")
    manifest = corpus.manifest("biography", selected)
    assert [item["source_id"] for item in manifest["eligible_sources"]] == ["bio"]
    assert manifest["excluded"]["needs_review"] == 2
    assert manifest["provider_called"] is False


class SkipSession:
    def __init__(self):
        self.added = []
    def add(self, value): self.added.append(value)
    async def flush(self):
        for value in self.added:
            if getattr(value, "id", None) is None: value.id = uuid4()
    async def commit(self): pass
    async def refresh(self, value): pass


@pytest.mark.asyncio
@pytest.mark.parametrize("corpus,reason", [
    (snapshot(), "INSUFFICIENT_CORPUS:NO_VERIFIED_SOURCES"),
    (snapshot(sources=[source("identity", ["IDENTITY"])]), "INSUFFICIENT_CORPUS:BIOGRAPHY_UNSUPPORTED"),
])
async def test_insufficient_corpus_never_calls_provider(corpus, reason):
    provider = FakeProvider('{"fields": []}')
    author = SimpleNamespace(id=uuid4())
    outcome = await run_domain_research(
        SkipSession(), author, provider, "biography",
        route_result=SimpleNamespace(corpus_snapshot=corpus),
    )
    assert outcome.run.status == "skipped"
    assert outcome.run.routing_reason == reason
    assert provider.calls == []


def test_verified_subset_can_run_while_pending_candidates_exist():
    corpus = snapshot(sources=[source("bio", ["BIOGRAPHY"])], pending=4)
    assert [item["id"] for item in corpus.sources_for_domain("biography")] == ["bio"]
    assert corpus.unavailable_reason("biography") is None
