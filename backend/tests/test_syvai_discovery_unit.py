"""SyvAI 0.2A discovery unit tests (offline, no network)."""

from __future__ import annotations

import asyncio
import json

import httpx
import pytest

from app.syvai.discovery.assessment import (
    ASSESSMENT_AUTO_USABLE,
    ASSESSMENT_NEEDS_REVIEW,
    ASSESSMENT_REJECTED,
    assess_candidate,
)
from app.syvai.discovery.authority import authority_tier_for_url
from app.syvai.discovery.dedupe import RawCandidate, dedupe_candidates
from app.syvai.discovery.evidence import extract_evidence, strip_markup
from app.syvai.discovery.fetcher import FetcherConfig, SafeFetcher
from app.syvai.discovery.providers import FakeDiscoveryProvider
from app.syvai.discovery.urls import is_unsafe_ip, normalize_url, registrable_domain
from app.syvai.errors import FetchError


# ---------------------------------------------------------------------------
# normalize_url
# ---------------------------------------------------------------------------


def test_normalize_url_http_https_only():
    assert normalize_url("ftp://example.com/file") is None
    assert normalize_url("file:///etc/passwd") is None
    assert normalize_url("javascript:alert(1)") is None
    assert normalize_url("not a url") is None
    assert normalize_url("") is None


def test_normalize_url_canonical_form():
    assert normalize_url("HTTPS://Example.COM/Path/") == "https://example.com/Path"
    assert normalize_url("https://example.com:443/a") == "https://example.com/a"
    assert normalize_url("http://example.com:80/a") == "http://example.com/a"
    assert normalize_url("https://example.com/a#fragment") == "https://example.com/a"


def test_normalize_url_strips_tracking_params():
    normalized = normalize_url(
        "https://example.com/page?utm_source=news&id=42&fbclid=abc&ref=x"
    )
    assert normalized == "https://example.com/page?id=42"


def test_normalize_url_keeps_path_ordering():
    assert normalize_url("https://example.com/a?b=1&c=2") == "https://example.com/a?b=1&c=2"


def test_registrable_domain():
    assert registrable_domain("https://en.wikipedia.org/wiki/Anne") == "wikipedia.org"
    assert registrable_domain("https://www.britannica.com/biography/Anne-Bronte") == "britannica.com"
    assert registrable_domain("") == ""


# ---------------------------------------------------------------------------
# SSRF guards
# ---------------------------------------------------------------------------


def test_is_unsafe_ip_blocks_non_public():
    for address in [
        "127.0.0.1", "127.0.0.2", "10.0.0.1", "192.168.1.1", "172.16.0.1",
        "169.254.169.254", "0.0.0.0", "100.64.0.1", "192.0.0.1", "198.18.0.1",
        "255.255.255.255", "224.0.0.1", "::1", "fe80::1", "fc00::1", "not-an-ip",
    ]:
        assert is_unsafe_ip(address), address
    assert is_unsafe_ip("::") is True
    assert is_unsafe_ip("93.184.216.34") is False
    assert is_unsafe_ip("2606:4700::6810:84e5") is False


def test_fetch_blocks_private_resolution():
    def resolver(host):
        return ["10.0.0.5"]

    fetcher = SafeFetcher(resolver=resolver)
    with pytest.raises(FetchError) as exc:
        asyncio.run(fetcher.fetch("https://example.com"))
    assert exc.value.code == "ssrf_blocked"


def test_fetch_blocks_unresolvable_host():
    def resolver(host):
        return []

    fetcher = SafeFetcher(resolver=resolver)
    with pytest.raises(FetchError) as exc:
        asyncio.run(fetcher.fetch("https://example.com"))
    assert exc.value.code == "dns_failed"


def test_fetch_rejects_non_http_scheme():
    fetcher = SafeFetcher()
    with pytest.raises(FetchError) as exc:
        asyncio.run(fetcher.fetch("ftp://example.com/file"))
    assert exc.value.code == "unsupported_scheme"


def _public_resolver(host):
    return ["93.184.216.34"]


def test_fetch_happy_path_and_redirect_revalidation():
    def handler(request):
        if request.url.host == "example.com":
            return httpx.Response(
                302, headers={"Location": "https://internal.example/secret"}
            )
        return httpx.Response(200, headers={"content-type": "text/html"}, content=b"<p>hello world</p>")

    def resolver(host):
        if host == "internal.example":
            return ["192.168.1.9"]  # redirect target resolves to private space
        return _public_resolver(host)

    fetcher = SafeFetcher(resolver=resolver, transport=httpx.MockTransport(handler))

    with pytest.raises(FetchError) as exc:
        asyncio.run(fetcher.fetch("https://example.com/start"))
    assert exc.value.code == "ssrf_blocked"


def test_fetch_follows_safe_redirect():
    def handler(request):
        if request.url.path == "/start":
            return httpx.Response(
                301, headers={"Location": "https://example.com/final"}
            )
        return httpx.Response(200, headers={"content-type": "text/plain"}, content=b"final content")

    fetcher = SafeFetcher(
        resolver=_public_resolver, transport=httpx.MockTransport(handler)
    )
    page = asyncio.run(fetcher.fetch("https://example.com/start"))
    assert page.status_code == 200
    assert page.final_url == "https://example.com/final"
    assert page.text == "final content"


def test_fetch_limits_redirects():
    def handler(request):
        return httpx.Response(302, headers={"Location": "https://example.com/again"})

    fetcher = SafeFetcher(
        resolver=_public_resolver, transport=httpx.MockTransport(handler)
    )
    with pytest.raises(FetchError) as exc:
        asyncio.run(fetcher.fetch("https://example.com/start"))
    assert exc.value.code == "too_many_redirects"


def test_fetch_bounds_body_size():
    def handler(request):
        return httpx.Response(
            200,
            headers={"content-type": "text/html"},
            content=b"x" * 100_000,
        )

    fetcher = SafeFetcher(
        config=FetcherConfig(max_bytes=1000),
        resolver=_public_resolver,
        transport=httpx.MockTransport(handler),
    )
    with pytest.raises(FetchError) as exc:
        asyncio.run(fetcher.fetch("https://example.com/big"))
    assert exc.value.code == "response_too_large"


def test_fetch_blocks_disallowed_content_type():
    def handler(request):
        return httpx.Response(
            200,
            headers={"content-type": "application/octet-stream"},
            content=b"binary",
        )

    fetcher = SafeFetcher(
        resolver=_public_resolver, transport=httpx.MockTransport(handler)
    )
    with pytest.raises(FetchError) as exc:
        asyncio.run(fetcher.fetch("https://example.com/file.bin"))
    assert exc.value.code == "content_type_blocked"


# ---------------------------------------------------------------------------
# authority registry
# ---------------------------------------------------------------------------


def test_authority_tiers():
    assert authority_tier_for_url("https://en.wikipedia.org/wiki/Anne_Bronte") == "medium"
    assert authority_tier_for_url("https://www.britannica.com/biography/Anne-Bronte") == "high"
    assert authority_tier_for_url("https://www.poetryfoundation.org/poets/anne-bronte") == "high"
    assert authority_tier_for_url("https://www.ox.ac.uk/about") == "medium"
    assert authority_tier_for_url("https://www.gov.uk/bronte") == "medium"
    assert authority_tier_for_url("https://medium.com/@someone/anne-bronte") == "low"
    assert authority_tier_for_url("https://random-site.example/page") == "unknown"


# ---------------------------------------------------------------------------
# evidence extraction
# ---------------------------------------------------------------------------


def test_strip_markup_removes_tags_and_entities():
    assert strip_markup("<p>Hello &amp; <b>world</b></p>") == "Hello & world"


def test_extract_evidence_bounds_and_sentence_cuts():
    long_text = "First sentence is short. " + "word " * 500
    evidence = extract_evidence(long_text, limit=120)
    assert len(evidence) <= 120
    assert evidence.startswith("First sentence")


def test_extract_evidence_empty():
    assert extract_evidence("") == ""
    assert extract_evidence("<script>alert(1)</script>") == "alert(1)"


# ---------------------------------------------------------------------------
# assessment
# ---------------------------------------------------------------------------


TERMS = ["Anne Brontë"]


def test_assessment_auto_usable_high_authority_relevant():
    # Britannica is a curated institutional/reference source: high tier,
    # auto-approvable with strong relevance. Deliberately NOT Wikipedia.
    result = assess_candidate(
        url="https://www.britannica.com/biography/Anne-Bronte",
        title="Anne Brontë",
        evidence="Anne Brontë was an English poet and novelist, sister of Charlotte and Emily Brontë.",
        authority_tier=authority_tier_for_url("https://www.britannica.com/biography/Anne-Bronte"),
        query_terms=TERMS,
    )
    assert result.assessment == ASSESSMENT_AUTO_USABLE
    assert result.reason == "high_authority"
    assert result.quality_score >= 0.85


def test_assessment_wikipedia_never_auto_usable():
    # Wikipedia is medium authority: even with a perfect relevance + content
    # signal it must land in needs_review, never auto_usable.
    result = assess_candidate(
        url="https://en.wikipedia.org/wiki/Anne_Bront%C3%AB",
        title="Anne Brontë",
        evidence="Anne Brontë was an English novelist and poet, the youngest of the Brontë literary family.",
        authority_tier=authority_tier_for_url("https://en.wikipedia.org/wiki/Anne_Bront%C3%AB"),
        query_terms=TERMS,
    )
    assert authority_tier_for_url("https://en.wikipedia.org/wiki/Anne_Bront%C3%AB") == "medium"
    assert result.assessment == ASSESSMENT_NEEDS_REVIEW
    assert result.reason == "manual_review"


def test_assessment_needs_review_unknown_authority():
    result = assess_candidate(
        url="https://example-blog.example/anne-bronte",
        title="My trip to Haworth",
        evidence="A personal travel account of a visit to the Brontë Parsonage Museum.",
        authority_tier="unknown",
        query_terms=TERMS,
    )
    assert result.assessment == ASSESSMENT_NEEDS_REVIEW
    assert result.reason == "manual_review"


def test_assessment_rejects_spam_tld():
    result = assess_candidate(
        url="https://anne-bronte-fans.xyz/welcome",
        title="Free ebooks",
        evidence=None,
        authority_tier="unknown",
        query_terms=TERMS,
    )
    assert result.assessment == ASSESSMENT_REJECTED
    assert result.reason == "untrusted_tld"


def test_assessment_rejects_duplicate():
    result = assess_candidate(
        url="https://en.wikipedia.org/wiki/Anne_Bront%C3%AB",
        title="Anne Brontë",
        evidence="Some evidence here.",
        authority_tier="high",
        query_terms=TERMS,
        existing_normalized={"https://en.wikipedia.org/wiki/Anne_Brontë"},
    )
    assert result.assessment == ASSESSMENT_REJECTED
    assert result.reason == "duplicate"


def test_assessment_rejects_low_quality_unknown_authority():
    result = assess_candidate(
        url="https://example.com/tiny",
        title="",
        evidence="",
        authority_tier="unknown",
        query_terms=TERMS,
    )
    assert result.assessment == ASSESSMENT_REJECTED
    assert result.reason == "low_quality"


def test_assessment_high_authority_irrelevant_content_needs_review():
    result = assess_candidate(
        url="https://www.britannica.com/event/List-of-wars",
        title="List of wars",
        evidence="A list of wars and conflicts across history.",
        authority_tier=authority_tier_for_url("https://www.britannica.com/event/List-of-wars"),
        query_terms=TERMS,
    )
    # 0.4*1.0 + 0.4*0.5 + 0.2*1.0 = 0.8 < 0.85 → review, never auto-approve
    assert authority_tier_for_url("https://www.britannica.com/event/List-of-wars") == "high"
    assert result.assessment == ASSESSMENT_NEEDS_REVIEW
    assert result.quality_score < 0.85


# ---------------------------------------------------------------------------
# dedupe
# ---------------------------------------------------------------------------


def test_dedupe_candidates_summary_and_family_cap():
    candidates = [
        RawCandidate(url="https://en.wikipedia.org/wiki/Anne_Brontë", title="A"),
        RawCandidate(url="https://en.wikipedia.org/wiki/Anne_Brontë", title="A dup"),
        RawCandidate(url="https://en.wikipedia.org/wiki/Agnes_Grey", title="B"),
        RawCandidate(url="https://en.wikipedia.org/wiki/Acton_Bell", title="C"),
        RawCandidate(url="https://www.britannica.com/biography/Anne-Bronte", title="D"),
        RawCandidate(url="not-a-url", title="E"),
    ]
    kept, summary = dedupe_candidates(candidates, max_per_family=2)
    assert summary.total == 6
    assert summary.kept == 3
    assert summary.dropped_unparseable == 1
    assert summary.dropped_run_duplicate == 1
    assert summary.dropped_family_cap == 1
    assert [c.title for c in kept] == ["A", "B", "D"]


def test_dedupe_existing_sources_dropped():
    candidates = [RawCandidate(url="https://en.wikipedia.org/wiki/Anne_Brontë", title="A")]
    kept, summary = dedupe_candidates(
        candidates,
        existing_normalized={"https://en.wikipedia.org/wiki/Anne_Brontë"},
    )
    assert kept == []
    assert summary.dropped_existing_duplicate == 1


# ---------------------------------------------------------------------------
# Fake provider
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_fake_provider_returns_fixture():
    provider = FakeDiscoveryProvider()
    author = type("A", (), {"name": "Anne Brontë", "display_name": None})()
    candidates = await provider.discover(author, ["Anne Brontë"])
    assert len(candidates) == 5
    assert provider.calls[0][1] == ["Anne Brontë"]
    urls = [c.url for c in candidates]
    assert any("wikipedia.org" in url for url in urls)
    assert any(".xyz" in url for url in urls)


# ---------------------------------------------------------------------------
# Wikipedia provider (allow-list + parsing, offline via MockTransport)
# ---------------------------------------------------------------------------


def _wikipedia_payload():
    return {
        "query": {
            "pages": [
                {
                    "pageid": 1,
                    "title": "Anne Brontë",
                    "extract": "Anne Brontë was an English novelist and poet.",
                    "fullurl": "https://en.wikipedia.org/wiki/Anne_Brontë",
                }
            ]
        }
    }


@pytest.mark.asyncio
async def test_wikipedia_provider_parses_results():
    from app.syvai.discovery.providers import WikipediaDiscoveryProvider

    def handler(request):
        assert request.url.host == "en.wikipedia.org"
        assert request.url.path == "/w/api.php"
        assert "generator=search" in request.url.query.decode()
        return httpx.Response(
            200,
            headers={"content-type": "application/json"},
            content=json.dumps(_wikipedia_payload()).encode(),
        )

    fetcher = SafeFetcher(resolver=_public_resolver, transport=httpx.MockTransport(handler))
    provider = WikipediaDiscoveryProvider(fetcher=fetcher, max_candidates=2)
    author = type("A", (), {"name": "Anne Brontë", "display_name": None})()
    results = await provider.discover(author, ["Anne Brontë"])

    assert len(results) == 1
    assert results[0].title == "Anne Brontë"
    assert results[0].source_type == "encyclopedia"
    assert results[0].url == "https://en.wikipedia.org/wiki/Anne_Brontë"
    assert authority_tier_for_url(results[0].url) == "medium"


@pytest.mark.asyncio
async def test_wikipedia_provider_rejects_non_allowlisted_url():
    from app.syvai.discovery.providers import WikipediaDiscoveryProvider

    class BadHostFetcher:
        async def fetch(self, url):
            return None

    provider = WikipediaDiscoveryProvider(fetcher=BadHostFetcher())  # type: ignore[arg-type]
    provider._search_url = lambda terms, limit: "https://evil.example/api"  # type: ignore[method-assign]
    author = type("A", (), {"name": "Anne Brontë", "display_name": None})()
    with pytest.raises(Exception, match="not allow-listed"):
        await provider.discover(author, ["Anne Brontë"])
