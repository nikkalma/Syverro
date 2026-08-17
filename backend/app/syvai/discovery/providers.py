"""Source discovery providers.

The provider boundary is deliberately narrow: given an author and search
terms, return a small bounded list of candidate source pages. Providers never
fetch arbitrary URLs; the Wikipedia provider talks only to its own allow-listed
API endpoint through the SSRF-safe ``SafeFetcher``.

``FakeDiscoveryProvider`` gives tests and the offline benchmark a
deterministic, network-free fixture.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Protocol
from urllib.parse import quote, urlencode

from app.config import settings
from app.syvai.discovery.evidence import extract_evidence
from app.syvai.discovery.fetcher import FetcherConfig, SafeFetcher
from app.syvai.discovery.dedupe import RawCandidate
from app.syvai.errors import ConfigurationError, ProviderError

logger = logging.getLogger(__name__)

WIKIPEDIA_ALLOWED_HOSTS = {"en.wikipedia.org"}
WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php"

LOC_ALLOWED_HOSTS = {"www.loc.gov"}
LOC_SEARCH_URL = "https://www.loc.gov/search/"

ARCHIVE_ALLOWED_HOSTS = {"archive.org"}
ARCHIVE_SEARCH_URL = "https://archive.org/advancedsearch.php"


@dataclass
class SourceDiscoveryProvider(Protocol):
    name: str

    async def discover(self, author, query_terms: list[str]) -> list[RawCandidate]:
        """Return bounded candidate pages for ``author``."""
        ...


# ---------------------------------------------------------------------------
# Fake provider (deterministic, offline)
# ---------------------------------------------------------------------------


class FakeDiscoveryProvider:
    """Deterministic fixture provider used by tests and the offline benchmark.

    Produces a realistic mix: high-authority encyclopedic candidates that
    auto-approve, a couple of review candidates, and one spam/low-quality
    candidate that must be rejected.
    """

    name = "fake-discovery"

    def __init__(self, candidates: list[RawCandidate] | None = None):
        self._candidates = candidates if candidates is not None else self._fixture()
        self.calls: list[tuple[object, list[str]]] = []

    @staticmethod
    def _fixture() -> list[RawCandidate]:
        return [
            RawCandidate(
                url="https://en.wikipedia.org/wiki/Anne_Bront%C3%AB",
                title="Anne Brontë",
                source_type="encyclopedia",
                origin="wikipedia_search",
                evidence=(
                    "Anne Brontë was an English novelist and poet, the youngest "
                    "member of the Brontë literary family. She wrote Agnes Grey and "
                    "The Tenant of Wildfell Hall, and died of tuberculosis in "
                    "Scarborough in May 1849."
                ),
            ),
            RawCandidate(
                url="https://en.wikipedia.org/wiki/Agnes_Grey",
                title="Agnes Grey",
                source_type="encyclopedia",
                origin="wikipedia_search",
                evidence=(
                    "Agnes Grey, A Novel is the first novel by English author Anne "
                    "Brontë, published in December 1847 under the pseudonym Acton "
                    "Bell. It describes the life of a governess."
                ),
            ),
            RawCandidate(
                url="https://www.britannica.com/biography/Anne-Bronte",
                title="Anne Brontë",
                source_type="encyclopedia",
                origin="wikipedia_related",
                evidence=(
                    "Anne Brontë, English poet and novelist, sister of Charlotte and "
                    "Emily Brontë. Author of Agnes Grey (1847) and The Tenant of "
                    "Wildfell Hall (1848)."
                ),
            ),
            RawCandidate(
                url="https://example-blog.example/anne-bronte",
                title="My trip to Haworth",
                source_type="blog",
                origin="wikipedia_related",
                evidence="A personal travel account of a visit to the Brontë Parsonage Museum.",
            ),
            RawCandidate(
                url="https://anne-bronte-fans.xyz/welcome",
                title="Free Anne Brontë ebooks download",
                source_type="website",
                origin="wikipedia_related",
                evidence=None,
            ),
        ]

    async def discover(self, author, query_terms: list[str]) -> list[RawCandidate]:
        self.calls.append((author, query_terms))
        return list(self._candidates)


# ---------------------------------------------------------------------------
# Wikipedia provider (bounded, allow-listed API only)
# ---------------------------------------------------------------------------


class WikipediaDiscoveryProvider:
    """Search English Wikipedia's extract API for authoritative candidates.

    Only ever talks to ``en.wikipedia.org/w/api.php`` (validated twice: the
    URL is constructed against an allow-list and the fetcher re-validates the
    host and its resolved addresses). ``exintro`` + ``explaintext`` returns
    the article's plain-text lead paragraph, which becomes the evidence.
    """

    name = "wikipedia-discovery"

    def __init__(self, fetcher: SafeFetcher, *, max_candidates: int = 5):
        self._fetcher = fetcher
        self._max_candidates = max_candidates

    @staticmethod
    def _search_url(terms: list[str], limit: int) -> str:
        query = terms[0] if terms else ""
        params = urlencode(
            {
                "action": "query",
                "generator": "search",
                "gsrsearch": query,
                "gsrlimit": limit,
                "gsrnamespace": 0,
                "prop": "extracts",
                "exintro": 1,
                "explaintext": 1,
                "exlimit": "max",
                "format": "json",
                "formatversion": 2,
            }
        )
        return f"{WIKIPEDIA_API_URL}?{params}"

    async def discover(self, author, query_terms: list[str]) -> list[RawCandidate]:
        url = self._search_url(query_terms, self._max_candidates)
        host = url.split("/")[2] if url.startswith(("http://", "https://")) else ""
        if host not in WIKIPEDIA_ALLOWED_HOSTS:
            raise ProviderError("discovery provider URL is not allow-listed")

        try:
            page = await self._fetcher.fetch(url)
        except Exception as exc:  # noqa: BLE001 - wrap into provider taxonomy
            raise ProviderError(f"wikipedia discovery fetch failed: {exc}") from exc

        import json

        try:
            data = json.loads(page.text)
        except json.JSONDecodeError as exc:
            raise ProviderError("wikipedia discovery returned invalid JSON") from exc

        results: list[RawCandidate] = []
        for item in data.get("query", {}).get("pages", []) or []:
            title = item.get("title")
            if not title:
                continue
            full_url = item.get("fullurl")
            if not full_url:
                full_url = f"https://en.wikipedia.org/wiki/{quote(title.replace(' ', '_'))}"
            results.append(
                RawCandidate(
                    url=full_url,
                    title=title,
                    source_type="encyclopedia",
                    origin="wikipedia_search",
                    evidence=extract_evidence(item.get("extract") or ""),
                )
            )
        return results


# ---------------------------------------------------------------------------
# Library of Congress provider (credential-free, official JSON API)
# ---------------------------------------------------------------------------


class LocDiscoveryProvider:
    """Search the Library of Congress loc.gov JSON API for authoritative items.

    Bounded general search keyed to the author identity (``/search/?q=…``), NOT
    a strict contributor facet, so recall is not systematically reduced for
    authors whose name only appears in titles/descriptions. Relevance and
    authority are decided downstream by the existing deterministic assessment.
    Only ever talks to ``www.loc.gov`` (allow-listed host, re-validated by the
    fetcher at fetch time and on every redirect hop).
    """

    name = "loc-discovery"

    def __init__(self, fetcher: SafeFetcher, *, max_candidates: int = 5):
        self._fetcher = fetcher
        self._max_candidates = max_candidates

    @staticmethod
    def _search_url(terms: list[str], limit: int) -> str:
        query = terms[0] if terms else ""
        params = urlencode(
            {
                "q": query,
                "fo": "json",
                "at": "results",
            }
        )
        return f"{LOC_SEARCH_URL}?{params}"

    async def discover(self, author, query_terms: list[str]) -> list[RawCandidate]:
        url = self._search_url(query_terms, self._max_candidates)
        host = url.split("/")[2] if url.startswith(("http://", "https://")) else ""
        if host not in LOC_ALLOWED_HOSTS:
            raise ProviderError("loc discovery provider URL is not allow-listed")

        try:
            page = await self._fetcher.fetch(url)
        except Exception as exc:  # noqa: BLE001 - wrap into provider taxonomy
            raise ProviderError(f"loc discovery fetch failed: {exc}") from exc

        import json

        try:
            data = json.loads(page.text)
        except json.JSONDecodeError as exc:
            raise ProviderError("loc discovery returned invalid JSON") from exc

        results: list[RawCandidate] = []
        for item in data.get("results") or []:
            item_id = item.get("id")
            if not item_id:
                continue
            canonical = (
                item_id.replace("http://", "https://", 1)
                if item_id.startswith("http://")
                else item_id
            )
            description = item.get("description") or item.get("summary") or []
            if isinstance(description, str):
                description = [description]
            source_type = "reference"
            original_format = item.get("original_format") or item.get("original-format")
            if isinstance(original_format, str) and original_format:
                source_type = original_format
            elif isinstance(original_format, list) and original_format:
                source_type = original_format[0]
            results.append(
                RawCandidate(
                    url=canonical,
                    title=item.get("title"),
                    source_type=source_type,
                    origin="loc_search",
                    evidence=extract_evidence(" ".join(description)),
                )
            )
            if len(results) >= self._max_candidates:
                break
        return results


# ---------------------------------------------------------------------------
# Internet Archive provider (credential-free, official search API)
# ---------------------------------------------------------------------------


class ArchiveDiscoveryProvider:
    """Search the Internet Archive's official advanced-search API.

    Searches the ``creator`` metadata field for the author identity and returns
    stable item URLs (``archive.org/details/{id}``) with a bounded evidence
    snippet from the item description. Only ever talks to ``archive.org``
    (allow-listed host, re-validated by the fetcher on fetch and redirects).
    """

    name = "archive-discovery"

    def __init__(self, fetcher: SafeFetcher, *, max_candidates: int = 5):
        self._fetcher = fetcher
        self._max_candidates = max_candidates

    @staticmethod
    def _search_url(terms: list[str], limit: int) -> str:
        query = terms[0] if terms else ""
        params = urlencode(
            [
                ("q", f'creator:("{query}")'),
                ("fl[]", "identifier"),
                ("fl[]", "title"),
                ("fl[]", "mediatype"),
                ("fl[]", "description"),
                ("rows", str(limit)),
                ("page", "1"),
                ("output", "json"),
            ]
        )
        return f"{ARCHIVE_SEARCH_URL}?{params}"

    async def discover(self, author, query_terms: list[str]) -> list[RawCandidate]:
        url = self._search_url(query_terms, self._max_candidates)
        host = url.split("/")[2] if url.startswith(("http://", "https://")) else ""
        if host not in ARCHIVE_ALLOWED_HOSTS:
            raise ProviderError("archive discovery provider URL is not allow-listed")

        try:
            page = await self._fetcher.fetch(url)
        except Exception as exc:  # noqa: BLE001 - wrap into provider taxonomy
            raise ProviderError(f"archive discovery fetch failed: {exc}") from exc

        import json

        try:
            data = json.loads(page.text)
        except json.JSONDecodeError as exc:
            raise ProviderError("archive discovery returned invalid JSON") from exc

        results: list[RawCandidate] = []
        for doc in data.get("response", {}).get("docs") or []:
            identifier = doc.get("identifier")
            if not identifier:
                continue
            description = doc.get("description")
            if isinstance(description, list):
                description = " ".join(description)
            mediatype = doc.get("mediatype") or "texts"
            source_type = "text" if mediatype == "texts" else (mediatype or "archive_item")
            results.append(
                RawCandidate(
                    url=f"https://archive.org/details/{identifier}",
                    title=doc.get("title"),
                    source_type=source_type,
                    origin="archive_search",
                    evidence=extract_evidence(description or ""),
                )
            )
            if len(results) >= self._max_candidates:
                break
        return results


# ---------------------------------------------------------------------------
# Provider selection
# ---------------------------------------------------------------------------


def _provider_fetcher(allowed_hosts: set[str]) -> SafeFetcher:
    return SafeFetcher(
        FetcherConfig(
            timeout_seconds=settings.SYVAI_DISCOVERY_TIMEOUT_SECONDS,
            max_bytes=settings.SYVAI_DISCOVERY_MAX_PAGE_BYTES,
            user_agent=settings.SYVAI_DISCOVERY_USER_AGENT,
            allowed_hosts=frozenset(allowed_hosts),
        )
    )


def _build_provider(provider_name: str) -> SourceDiscoveryProvider:
    name = provider_name.strip().lower()
    if name in {"", "wikipedia"}:
        return WikipediaDiscoveryProvider(
            fetcher=_provider_fetcher(WIKIPEDIA_ALLOWED_HOSTS),
            max_candidates=settings.SYVAI_DISCOVERY_MAX_CANDIDATES,
        )
    if name in {"loc", "loc.gov", "library-of-congress"}:
        return LocDiscoveryProvider(
            fetcher=_provider_fetcher(LOC_ALLOWED_HOSTS),
            max_candidates=settings.SYVAI_DISCOVERY_MAX_CANDIDATES,
        )
    if name in {"archive", "archive.org", "internet-archive"}:
        return ArchiveDiscoveryProvider(
            fetcher=_provider_fetcher(ARCHIVE_ALLOWED_HOSTS),
            max_candidates=settings.SYVAI_DISCOVERY_MAX_CANDIDATES,
        )
    raise ConfigurationError(f"unknown discovery provider: {provider_name}")


def discovery_provider_status() -> dict:
    """Read-only status used by the report and the Studio section."""
    providers = _configured_provider_names()
    return {
        "enabled": settings.SYVAI_DISCOVERY_ENABLED,
        "provider": providers[0] if providers else None,
        "providers": providers if settings.SYVAI_DISCOVERY_ENABLED else [],
        "configured": settings.SYVAI_DISCOVERY_ENABLED,
        "status": "OK" if settings.SYVAI_DISCOVERY_ENABLED else "NOT_CONFIGURED",
    }


def _configured_provider_names() -> list[str]:
    names = [name.strip() for name in settings.SYVAI_DISCOVERY_PROVIDERS.split(",")]
    return [name for name in names if name]


def build_discovery_providers() -> list[SourceDiscoveryProvider]:
    """Build the configured ordered provider set; raises when not configured."""
    if not settings.SYVAI_DISCOVERY_ENABLED:
        raise ConfigurationError(
            "SyvAI source discovery is not enabled: set SYVAI_DISCOVERY_ENABLED=true"
        )
    names = _configured_provider_names()
    if not names:
        raise ConfigurationError("no discovery providers configured")
    providers = [_build_provider(name) for name in names]
    if not providers:
        raise ConfigurationError("no discovery providers configured")
    return providers
