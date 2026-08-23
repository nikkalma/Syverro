"""SyvAI 0.3A bounded multi-authority discovery tests (offline, no network).

Covers the failure matrix A–O (all ok / partial failures / timeout / malformed
/ zero results / cross-adapter dedupe / cross-adapter family cap / forbidden
redirect / private-IP / oversized / wrong MIME / all-fail / disabled / unknown
provider), the per-adapter host allow-lists, offline fixture parsing for the
LOC + Internet Archive adapters, metrics with runtime-derived per-provider
telemetry, and an offline Anne Brontë replay (>=2 distinct families, Wikipedia
needs_review, no live network, no truth injection, no live OpenAI).
"""

from __future__ import annotations

import json
from uuid import uuid4

import httpx
import pytest

from app.models.ai_proposal import AIProposal
from app.models.source import Source
from app.models.source_candidate import SourceCandidate
from app.models.syvai_run import SyvaiRun
from app.syvai.discovery import (
    build_discovery_providers,
    discovery_metrics,
    discovery_provider_status,
    run_discovery,
)
from app.syvai.discovery.assessment import ASSESSMENT_NEEDS_REVIEW
from app.syvai.discovery.dedupe import RawCandidate
from app.syvai.discovery.fetcher import FetcherConfig, SafeFetcher
from app.syvai.discovery.providers import (
    ARCHIVE_SEARCH_URL,
    ArchiveDiscoveryProvider,
    LOC_SEARCH_URL,
    LocDiscoveryProvider,
    WikipediaDiscoveryProvider,
    _build_provider,
)
from app.syvai.errors import ConfigurationError, FetchError, ProviderError


def _public_resolver(host):
    return ["93.184.216.34"]


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
    def __init__(self, sources=None, candidates=None, proposals=None, runs=None):
        self.sources = sources or []
        self.candidates = candidates or []
        self.proposals = proposals or []
        self.runs = runs or []
        self.added = []
        self.committed = False

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
            if entity is SyvaiRun:
                return FakeDiscoveryResult(self.runs)
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
        pass


def _author(name="Anne Brontë"):
    return type("A", (), {"id": uuid4(), "name": name, "display_name": name})()


def _high(url, title="Anne Brontë", evidence=None):
    return RawCandidate(
        url=url,
        title=title,
        source_type="encyclopedia",
        origin="fixture",
        evidence=evidence or ("Anne Brontë was an English novelist and poet, " "sister of Charlotte and Emily Brontë."),
    )


def _wikipedia(url="https://en.wikipedia.org/wiki/Anne_Bront%C3%AB"):
    return RawCandidate(
        url=url,
        title="Anne Brontë",
        source_type="encyclopedia",
        origin="wikipedia_search",
        evidence=("Anne Brontë was an English novelist and poet, the youngest " "of the Brontë literary family."),
    )


class OkProvider:
    name = "stub-ok"

    def __init__(self, candidates=None):
        self._candidates = candidates or []
        self.calls = []

    async def discover(self, author, terms):
        self.calls.append(terms)
        return list(self._candidates)


class FailProvider:
    name = "stub-fail"

    def __init__(self, exc=None):
        self._exc = exc or ProviderError("stub failure")
        self.calls = []

    async def discover(self, author, terms):
        self.calls.append(terms)
        raise self._exc


# ---------------------------------------------------------------------------
# Per-adapter host allow-lists (host-escape closure)
# ---------------------------------------------------------------------------


class BadHostFetcher:
    async def fetch(self, url):
        return None


@pytest.mark.asyncio
async def test_loc_provider_rejects_non_allowlisted_url():
    provider = LocDiscoveryProvider(fetcher=BadHostFetcher())  # type: ignore[arg-type]
    provider._search_url = lambda terms, limit: "https://evil.example/search/?q=x"  # type: ignore[method-assign]
    with pytest.raises(ProviderError, match="not allow-listed"):
        await provider.discover(_author(), ["Anne Brontë"])


@pytest.mark.asyncio
async def test_archive_provider_rejects_non_allowlisted_url():
    provider = ArchiveDiscoveryProvider(fetcher=BadHostFetcher())  # type: ignore[arg-type]
    provider._search_url = lambda terms, limit: "https://evil.example/advancedsearch.php"  # type: ignore[method-assign]
    with pytest.raises(ProviderError, match="not allow-listed"):
        await provider.discover(_author(), ["Anne Brontë"])


def test_fetcher_rejects_host_outside_allowlist():
    fetcher = SafeFetcher(
        config=FetcherConfig(allowed_hosts=frozenset({"www.loc.gov"})),
        resolver=_public_resolver,
    )
    with pytest.raises(FetchError) as exc:
        import asyncio

        asyncio.run(fetcher.fetch("https://evil.example/data.json"))
    assert exc.value.code == "host_not_allowed"


def test_fetcher_revalidates_allowlist_on_redirect():
    def handler(request):
        if request.url.host == "www.loc.gov":
            return httpx.Response(302, headers={"Location": "https://evil.example/data.json"})
        return httpx.Response(200, headers={"content-type": "application/json"}, content=b"{}")

    fetcher = SafeFetcher(
        config=FetcherConfig(allowed_hosts=frozenset({"www.loc.gov"})),
        resolver=_public_resolver,
        transport=httpx.MockTransport(handler),
    )
    with pytest.raises(FetchError) as exc:
        import asyncio

        asyncio.run(fetcher.fetch("https://www.loc.gov/search/?fo=json"))
    assert exc.value.code == "host_not_allowed"


# ---------------------------------------------------------------------------
# Offline adapter parsing (LOC + Archive fixtures)
# ---------------------------------------------------------------------------


def _loc_handler(request):
    assert request.url.host == "www.loc.gov"
    payload = {
        "results": [
            {
                "id": "http://www.loc.gov/item/annebronte0001",
                "title": "Anne Brontë scrapbook",
                "description": ["A scrapbook of clippings related to Anne Brontë, English novelist and poet."],
                "original_format": ["image"],
            }
        ]
    }
    return httpx.Response(200, headers={"content-type": "application/json"}, content=json.dumps(payload).encode())


@pytest.mark.asyncio
async def test_loc_provider_parses_results_and_canonicalizes():
    fetcher = SafeFetcher(
        config=FetcherConfig(allowed_hosts=frozenset({"www.loc.gov"})),
        resolver=_public_resolver,
        transport=httpx.MockTransport(_loc_handler),
    )
    provider = LocDiscoveryProvider(fetcher=fetcher, max_candidates=2)
    results = await provider.discover(_author(), ["Anne Brontë"])

    assert len(results) == 1
    assert results[0].url == "https://www.loc.gov/item/annebronte0001"
    assert results[0].source_type == "image"
    assert results[0].origin == "loc_search"
    assert "English novelist and poet" in (results[0].evidence or "")


@pytest.mark.asyncio
async def test_loc_provider_rejects_invalid_json():
    def handler(request):
        return httpx.Response(200, headers={"content-type": "application/json"}, content=b"not json")

    fetcher = SafeFetcher(
        config=FetcherConfig(allowed_hosts=frozenset({"www.loc.gov"})),
        resolver=_public_resolver,
        transport=httpx.MockTransport(handler),
    )
    provider = LocDiscoveryProvider(fetcher=fetcher)
    with pytest.raises(ProviderError, match="invalid JSON"):
        await provider.discover(_author(), ["Anne Brontë"])


def _archive_handler(request):
    assert request.url.host == "archive.org"
    payload = {
        "response": {
            "numFound": 1,
            "docs": [
                {
                    "identifier": "annebronte0001",
                    "title": "The Tenant of Wildfell Hall",
                    "mediatype": "texts",
                    "description": ["Edition of Anne Brontë's 1848 novel The Tenant of Wildfell Hall."],
                }
            ],
        }
    }
    return httpx.Response(200, headers={"content-type": "application/json"}, content=json.dumps(payload).encode())


@pytest.mark.asyncio
async def test_archive_provider_parses_results_and_builds_stable_url():
    fetcher = SafeFetcher(
        config=FetcherConfig(allowed_hosts=frozenset({"archive.org"})),
        resolver=_public_resolver,
        transport=httpx.MockTransport(_archive_handler),
    )
    provider = ArchiveDiscoveryProvider(fetcher=fetcher, max_candidates=2)
    results = await provider.discover(_author(), ["Anne Brontë"])

    assert len(results) == 1
    assert results[0].url == "https://archive.org/details/annebronte0001"
    assert results[0].source_type == "text"
    assert results[0].origin == "archive_search"
    assert "Wildfell Hall" in (results[0].evidence or "")


# ---------------------------------------------------------------------------
# Phase 9 failure matrix (A–O), offline
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_matrix_a_all_providers_ok_merge_deterministic():
    session = FakeDiscoverySession()
    wikipedia = OkProvider([_wikipedia()])
    loc = OkProvider([_high("https://www.loc.gov/item/annebronte0001")])
    outcome = await run_discovery(session, _author(), [wikipedia, loc])

    assert outcome.providers_attempted == 2 and outcome.providers_succeeded == 2
    assert outcome.providers_failed == 0
    assert outcome.error is None
    assert [c.provider for c in outcome.candidates] == ["stub-ok", "stub-ok"]
    assert {c.normalized_url for c in outcome.candidates} >= {
        "https://en.wikipedia.org/wiki/Anne_Brontë",
        "https://www.loc.gov/item/annebronte0001",
    }
    assert outcome.run.provider == "stub-ok, stub-ok"


@pytest.mark.asyncio
async def test_matrix_b_wikipedia_ok_authority_fails():
    session = FakeDiscoverySession()
    outcome = await run_discovery(session, _author(), [OkProvider([_wikipedia()]), FailProvider()])

    assert outcome.providers_attempted == 2
    assert outcome.providers_succeeded == 1
    assert outcome.providers_failed == 1
    assert outcome.error is None
    assert len(outcome.candidates) == 1
    assert outcome.candidates[0].provider == "stub-ok"
    assert outcome.run.status == "review_needed"


@pytest.mark.asyncio
async def test_matrix_c_wikipedia_fails_authority_ok():
    session = FakeDiscoverySession()
    outcome = await run_discovery(session, _author(), [FailProvider(), OkProvider([_high("https://www.loc.gov/item/annebronte0001")])])

    assert outcome.providers_failed == 1
    assert outcome.providers_succeeded == 1
    assert len(outcome.candidates) == 1
    assert outcome.candidates[0].provider == "stub-ok"
    assert outcome.created_sources == []  # authority/score alone cannot establish identity
    assert "stub failure" in (outcome.run.error or "")


@pytest.mark.asyncio
async def test_matrix_d_timeout_isolated():
    def handler(request):
        raise httpx.ConnectTimeout("simulated timeout")

    fetcher = SafeFetcher(
        config=FetcherConfig(allowed_hosts=frozenset({"en.wikipedia.org"})),
        resolver=_public_resolver,
        transport=httpx.MockTransport(handler),
    )
    wikipedia = WikipediaDiscoveryProvider(fetcher=fetcher)

    session = FakeDiscoverySession()
    outcome = await run_discovery(
        session, _author(), [wikipedia, OkProvider([_high("https://www.loc.gov/item/annebronte0001")])]
    )
    assert outcome.providers_attempted == 2
    assert outcome.providers_failed == 1
    assert outcome.providers_succeeded == 1
    assert "fetch failed" in (outcome.run.error or "")


@pytest.mark.asyncio
async def test_matrix_e_malformed_json_isolated():
    def handler(request):
        return httpx.Response(200, headers={"content-type": "application/json"}, content=b"<not-json>")

    fetcher = SafeFetcher(
        config=FetcherConfig(allowed_hosts=frozenset({"en.wikipedia.org"})),
        resolver=_public_resolver,
        transport=httpx.MockTransport(handler),
    )
    wikipedia = WikipediaDiscoveryProvider(fetcher=fetcher)
    session = FakeDiscoverySession()
    outcome = await run_discovery(session, _author(), [wikipedia])
    assert outcome.providers_failed == 1
    assert outcome.providers_succeeded == 0
    assert outcome.run.status == "failed"
    assert "invalid JSON" in (outcome.run.error or "")


@pytest.mark.asyncio
async def test_matrix_f_zero_candidates_from_all():
    session = FakeDiscoverySession()
    outcome = await run_discovery(session, _author(), [OkProvider([]), OkProvider([])])
    assert outcome.providers_succeeded == 2
    assert outcome.providers_failed == 0
    assert outcome.candidates == []
    assert outcome.created_sources == []
    assert outcome.run.status == "completed"


@pytest.mark.asyncio
async def test_matrix_g_cross_adapter_duplicate_deduped():
    duplicate = _high("https://archive.org/details/bookA")
    session = FakeDiscoverySession()
    outcome = await run_discovery(session, _author(), [OkProvider([duplicate]), OkProvider([duplicate])])
    assert len(outcome.candidates) == 1
    assert outcome.duplicate_skipped >= 1
    assert outcome.created_sources == []


@pytest.mark.asyncio
async def test_matrix_h_cross_adapter_family_cap():
    session = FakeDiscoverySession()
    outcome = await run_discovery(
        session,
        _author(),
        [OkProvider([_wikipedia("https://en.wikipedia.org/wiki/Anne_Bront%C3%AB")]),
         OkProvider([_wikipedia("https://en.wikipedia.org/wiki/Agnes_Grey")])],
        max_per_family=1,
    )
    assert len(outcome.candidates) == 1
    assert outcome.family_skipped >= 1


def test_matrix_i_forbidden_redirect_blocked():
    def handler(request):
        return httpx.Response(302, headers={"Location": "http://169.254.169.254/latest/meta-data"})

    fetcher = SafeFetcher(
        config=FetcherConfig(allowed_hosts=frozenset({"www.loc.gov"})),
        resolver=_public_resolver,
        transport=httpx.MockTransport(handler),
    )
    with pytest.raises(FetchError) as exc:
        import asyncio

        asyncio.run(fetcher.fetch("https://www.loc.gov/search/?fo=json"))
    assert exc.value.code in {"ssrf_blocked", "host_not_allowed"}


def test_matrix_j_private_ip_resolution_blocked():
    def resolver(host):
        return ["10.0.0.5"]

    fetcher = SafeFetcher(
        config=FetcherConfig(allowed_hosts=frozenset({"www.loc.gov"})),
        resolver=resolver,
    )
    with pytest.raises(FetchError) as exc:
        import asyncio

        asyncio.run(fetcher.fetch("https://www.loc.gov/search/?fo=json"))
    assert exc.value.code == "ssrf_blocked"


def test_matrix_k_oversized_response_blocked():
    def handler(request):
        return httpx.Response(200, headers={"content-type": "application/json"}, content=b"x" * 100_000)

    fetcher = SafeFetcher(
        config=FetcherConfig(allowed_hosts=frozenset({"www.loc.gov"}), max_bytes=1000),
        resolver=_public_resolver,
        transport=httpx.MockTransport(handler),
    )
    with pytest.raises(FetchError) as exc:
        import asyncio

        asyncio.run(fetcher.fetch("https://www.loc.gov/search/?fo=json"))
    assert exc.value.code == "response_too_large"


def test_matrix_l_wrong_mime_blocked():
    def handler(request):
        return httpx.Response(200, headers={"content-type": "application/octet-stream"}, content=b"binary")

    fetcher = SafeFetcher(
        config=FetcherConfig(allowed_hosts=frozenset({"www.loc.gov"})),
        resolver=_public_resolver,
        transport=httpx.MockTransport(handler),
    )
    with pytest.raises(FetchError) as exc:
        import asyncio

        asyncio.run(fetcher.fetch("https://www.loc.gov/search/?fo=json"))
    assert exc.value.code == "content_type_blocked"


@pytest.mark.asyncio
async def test_matrix_m_all_providers_fail():
    session = FakeDiscoverySession()
    outcome = await run_discovery(session, _author(), [FailProvider(), FailProvider()])
    assert outcome.providers_attempted == 2
    assert outcome.providers_succeeded == 0
    assert outcome.providers_failed == 2
    assert "stub failure" in (outcome.error or "")
    assert outcome.run.status == "failed"
    assert session.committed is True


@pytest.mark.asyncio
async def test_matrix_n_disabled_raises_configuration_error(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "SYVAI_DISCOVERY_ENABLED", False)
    status = discovery_provider_status()
    assert status["enabled"] is False
    assert status["status"] == "NOT_CONFIGURED"
    assert status["providers"] == []
    with pytest.raises(ConfigurationError, match="not enabled"):
        build_discovery_providers()


@pytest.mark.asyncio
async def test_matrix_o_unknown_provider_raises(monkeypatch):
    with pytest.raises(ConfigurationError, match="unknown discovery provider"):
        _build_provider("bogus-authority")


# ---------------------------------------------------------------------------
# Provider selection
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_discovery_provider_status_lists_providers(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "SYVAI_DISCOVERY_ENABLED", True)
    monkeypatch.setattr(settings, "SYVAI_DISCOVERY_PROVIDERS", "wikipedia,loc,archive")
    status = discovery_provider_status()
    assert status["providers"] == ["wikipedia", "loc", "archive"]
    assert status["provider"] == "wikipedia"  # legacy field = first
    assert status["status"] == "OK"


@pytest.mark.asyncio
async def test_build_discovery_providers_returns_configured_set(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "SYVAI_DISCOVERY_ENABLED", True)
    monkeypatch.setattr(settings, "SYVAI_DISCOVERY_PROVIDERS", "wikipedia,loc,archive")
    providers = build_discovery_providers()
    assert [p.name for p in providers] == ["wikipedia-discovery", "loc-discovery", "archive-discovery"]


# ---------------------------------------------------------------------------
# Metrics (runtime-derived per-provider telemetry)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_metrics_per_provider_families_and_run_counts():
    author_id = uuid4()
    run = SyvaiRun(id=uuid4(), author_id=author_id, domain="source_discovery", status="completed", calls=2)
    candidates = [
        SourceCandidate(
            id=uuid4(), author_id=author_id, run_id=run.id,
            url="https://en.wikipedia.org/wiki/Anne_Brontë",
            normalized_url="https://en.wikipedia.org/wiki/Anne_Brontë",
            title="Anne Brontë", authority_tier="medium", assessment="needs_review",
            status="pending", provider="wikipedia-discovery",
        ),
        SourceCandidate(
            id=uuid4(), author_id=author_id, run_id=run.id,
            url="https://www.loc.gov/item/annebronte0001",
            normalized_url="https://www.loc.gov/item/annebronte0001",
            title="Anne Brontë", authority_tier="high", assessment="auto_usable",
            status="reviewed", review_action="auto_approved", provider="loc-discovery",
        ),
        SourceCandidate(
            id=uuid4(), author_id=author_id, run_id=run.id,
            url="https://archive.org/details/bookA",
            normalized_url="https://archive.org/details/bookA",
            title="The Tenant of Wildfell Hall", authority_tier="high", assessment="auto_usable",
            status="reviewed", review_action="auto_approved", provider="archive-discovery",
        ),
    ]
    session = FakeDiscoverySession(candidates=candidates, runs=[run])

    metrics = await discovery_metrics(session, str(author_id))
    assert metrics["candidates_total"] == 3
    assert metrics["candidates_per_provider"] == {
        "wikipedia-discovery": 1,
        "loc-discovery": 1,
        "archive-discovery": 1,
    }
    assert metrics["distinct_family_count"] == 3
    assert metrics["providers_attempted"] == 2
    assert metrics["providers_succeeded"] == 2
    assert metrics["providers_failed"] == 0


# ---------------------------------------------------------------------------
# 0.3A corrective: re-running discovery must never re-insert a URL already
# persisted as a SourceCandidate for the author (uq_source_candidates_author_
# normalized). Prior candidates are folded into the dedup set regardless of
# their review state, so rediscovery is skipped and prior decisions survive.
# ---------------------------------------------------------------------------


def _prior_candidate(
    url,
    *,
    author_id,
    run_id,
    assessment="needs_review",
    review_action=None,
    status="pending",
    source_id=None,
):
    return SourceCandidate(
        id=uuid4(),
        author_id=author_id,
        run_id=run_id,
        source_id=source_id,
        url=url,
        normalized_url=url,
        title="Anne Brontë",
        source_type="encyclopedia",
        authority_tier="medium",
        quality_score=70.0,
        assessment=assessment,
        provider="wikipedia-discovery",
        status=status,
        review_action=review_action,
    )


def _prior_source(url):
    return Source(
        url=url,
        normalized_url=url,
        title="Anne Brontë",
        source_type="encyclopedia",
        authority_tier="high",
        review_status="reviewed",
        source_origin="syvai_discovery",
    )


def _added_candidate_urls(session):
    return {
        c.normalized_url
        for c in session.added
        if isinstance(c, SourceCandidate)
    }


@pytest.mark.asyncio
async def test_rerun_skips_prior_rejected_candidate():
    author = _author()
    prior_run = SyvaiRun(id=uuid4(), author_id=author.id, domain="source_discovery", status="review_needed")
    prior = _prior_candidate(
        "https://en.wikipedia.org/wiki/Anne_Bront%C3%AB",
        author_id=author.id,
        run_id=prior_run.id,
        review_action="rejected",
        status="reviewed",
    )
    session = FakeDiscoverySession(candidates=[prior])

    outcome = await run_discovery(session, author, [OkProvider([_wikipedia()])])

    assert outcome.error is None
    assert outcome.candidates == []
    assert outcome.duplicate_skipped == 1
    assert "https://en.wikipedia.org/wiki/Anne_Brontë" not in _added_candidate_urls(session)
    assert prior.review_action == "rejected" and prior.status == "reviewed"  # decision not resurrected


@pytest.mark.asyncio
async def test_rerun_skips_prior_pending_candidate():
    author = _author()
    prior_run = SyvaiRun(id=uuid4(), author_id=author.id, domain="source_discovery", status="review_needed")
    prior = _prior_candidate(
        "https://en.wikipedia.org/wiki/Anne_Bront%C3%AB",
        author_id=author.id,
        run_id=prior_run.id,
    )
    session = FakeDiscoverySession(candidates=[prior])

    outcome = await run_discovery(session, author, [OkProvider([_wikipedia()])])

    assert outcome.error is None
    assert outcome.candidates == []
    assert outcome.duplicate_skipped == 1
    assert "https://en.wikipedia.org/wiki/Anne_Brontë" not in _added_candidate_urls(session)
    assert prior.status == "pending" and prior.review_action is None  # untouched


@pytest.mark.asyncio
async def test_rerun_skips_prior_approved_promoted_candidate():
    url = "https://en.wikipedia.org/wiki/Anne_Bront%C3%AB"
    author = _author()
    prior_run = SyvaiRun(id=uuid4(), author_id=author.id, domain="source_discovery", status="completed")
    promoted = _prior_source(url)
    promoted.id = uuid4()
    prior = _prior_candidate(
        url,
        author_id=author.id,
        run_id=prior_run.id,
        assessment="auto_usable",
        review_action="auto_approved",
        status="reviewed",
        source_id=promoted.id,
    )
    session = FakeDiscoverySession(sources=[promoted], candidates=[prior])

    outcome = await run_discovery(
        session,
        author,
        [OkProvider([_wikipedia(url), _wikipedia("https://en.wikipedia.org/wiki/Agnes_Grey")])],
    )

    assert outcome.error is None
    assert outcome.duplicate_skipped >= 1
    assert [c.normalized_url for c in outcome.candidates] == ["https://en.wikipedia.org/wiki/Agnes_Grey"]
    assert outcome.created_sources == []  # no double promotion
    assert prior.status == "reviewed" and prior.review_action == "auto_approved"


@pytest.mark.asyncio
async def test_rerun_duplicate_from_multiple_providers_still_deduped():
    author = _author()
    prior_run = SyvaiRun(id=uuid4(), author_id=author.id, domain="source_discovery", status="review_needed")
    prior = _prior_candidate(
        "https://en.wikipedia.org/wiki/Anne_Bront%C3%AB",
        author_id=author.id,
        run_id=prior_run.id,
        review_action="rejected",
        status="reviewed",
    )
    session = FakeDiscoverySession(candidates=[prior])
    fresh = _high("https://www.loc.gov/item/annebronte0001")

    outcome = await run_discovery(
        session, author, [OkProvider([_wikipedia(), fresh]), OkProvider([_wikipedia()])]
    )

    assert outcome.error is None
    assert sorted(c.normalized_url for c in outcome.candidates) == [
        "https://www.loc.gov/item/annebronte0001"
    ]
    assert outcome.duplicate_skipped >= 2  # prior-run URL + within-run duplicate


@pytest.mark.asyncio
async def test_rerun_idempotent_no_candidate_duplication():
    author = _author()

    first_session = FakeDiscoverySession()
    first = await run_discovery(first_session, author, [OkProvider([_wikipedia()])])
    assert first.error is None
    assert len(first.candidates) == 1

    prior_candidate = first.candidates[0]
    second_session = FakeDiscoverySession(candidates=[prior_candidate], runs=[first.run])
    second = await run_discovery(second_session, author, [OkProvider([_wikipedia()])])

    assert second.error is None
    assert second.candidates == []
    assert second.duplicate_skipped == 1
    assert not any(isinstance(c, SourceCandidate) for c in second_session.added)


# ---------------------------------------------------------------------------
# Offline Anne replay: >=2 distinct families, Wikipedia needs_review, no truth
# injection, no live network, no live OpenAI.
# ---------------------------------------------------------------------------


def _anne_wikipedia_payload():
    return {
        "query": {
            "pages": [
                {
                    "pageid": 1,
                    "title": "Anne Brontë",
                    "extract": ("Anne Brontë was an English novelist and poet, the youngest member "
                                "of the Brontë literary family."),
                    "fullurl": "https://en.wikipedia.org/wiki/Anne_Bront%C3%AB",
                }
            ]
        }
    }


@pytest.mark.asyncio
async def test_anne_offline_replay_multi_authority():
    def wikipedia_handler(request):
        assert request.url.host == "en.wikipedia.org"
        return httpx.Response(200, headers={"content-type": "application/json"}, content=json.dumps(_anne_wikipedia_payload()).encode())

    wikipedia = WikipediaDiscoveryProvider(
        fetcher=SafeFetcher(
            config=FetcherConfig(allowed_hosts=frozenset({"en.wikipedia.org"})),
            resolver=_public_resolver,
            transport=httpx.MockTransport(wikipedia_handler),
        ),
        max_candidates=2,
    )
    loc = LocDiscoveryProvider(
        fetcher=SafeFetcher(
            config=FetcherConfig(allowed_hosts=frozenset({"www.loc.gov"})),
            resolver=_public_resolver,
            transport=httpx.MockTransport(_loc_handler),
        ),
        max_candidates=2,
    )
    archive = ArchiveDiscoveryProvider(
        fetcher=SafeFetcher(
            config=FetcherConfig(allowed_hosts=frozenset({"archive.org"})),
            resolver=_public_resolver,
            transport=httpx.MockTransport(_archive_handler),
        ),
        max_candidates=2,
    )

    session = FakeDiscoverySession()
    outcome = await run_discovery(session, _author(), [wikipedia, loc, archive])

    assert outcome.providers_succeeded == 3
    assert outcome.providers_failed == 0
    assert len(outcome.candidates) == 3

    distinct = {registrable(c.normalized_url) for c in outcome.candidates}
    assert len(distinct) >= 2

    wikipedia_rows = [c for c in outcome.candidates if "wikipedia.org" in c.normalized_url]
    assert wikipedia_rows
    assert all(c.assessment == ASSESSMENT_NEEDS_REVIEW for c in wikipedia_rows)

    # No truth injection: discovery never reads a "Documented Sources" table;
    # assessment is deterministic on URL + title + evidence only.
    assert outcome.run.status in {"review_needed", "completed"}
    assert not any(c.review_action == "auto_approved" for c in outcome.candidates)
    assert all(c.identity_verification["state"] != "verified" for c in outcome.candidates)


def registrable(url):
    parts = url.split("/")
    host = parts[2]
    labels = host.split(".")
    return ".".join(labels[-2:])
