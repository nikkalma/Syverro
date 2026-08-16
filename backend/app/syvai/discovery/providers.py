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
from app.syvai.discovery.fetcher import SafeFetcher
from app.syvai.discovery.dedupe import RawCandidate
from app.syvai.errors import ConfigurationError, ProviderError

logger = logging.getLogger(__name__)

WIKIPEDIA_ALLOWED_HOSTS = {"en.wikipedia.org"}
WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php"


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
# Provider selection
# ---------------------------------------------------------------------------


def discovery_provider_status() -> dict:
    """Read-only status used by the report and the Studio section."""
    return {
        "enabled": settings.SYVAI_DISCOVERY_ENABLED,
        "provider": settings.SYVAI_DISCOVERY_PROVIDER if settings.SYVAI_DISCOVERY_ENABLED else None,
        "configured": settings.SYVAI_DISCOVERY_ENABLED,
        "status": "OK" if settings.SYVAI_DISCOVERY_ENABLED else "NOT_CONFIGURED",
    }


def build_discovery_provider() -> SourceDiscoveryProvider:
    """Build the configured discovery provider; raises when not configured."""
    if not settings.SYVAI_DISCOVERY_ENABLED:
        raise ConfigurationError(
            "SyvAI source discovery is not enabled: set SYVAI_DISCOVERY_ENABLED=true"
        )
    provider_name = settings.SYVAI_DISCOVERY_PROVIDER.strip().lower()
    if provider_name in {"", "wikipedia"}:
        return WikipediaDiscoveryProvider(
            fetcher=SafeFetcher(),
            max_candidates=settings.SYVAI_DISCOVERY_MAX_CANDIDATES,
        )
    raise ConfigurationError(f"unknown discovery provider: {provider_name}")
