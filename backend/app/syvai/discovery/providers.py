"""Source discovery providers.

The provider boundary is deliberately narrow: given an author and search
terms, return a small bounded list of candidate source pages. Providers never
fetch arbitrary URLs; the Wikipedia provider talks only to its own allow-listed
API endpoint through the SSRF-safe ``SafeFetcher``.

``FakeDiscoveryProvider`` gives tests and the offline benchmark a
deterministic, network-free fixture.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Protocol
from urllib.parse import quote, urlencode

from app.config import settings
from app.syvai.discovery.assessment import _identity_matches
from app.syvai.discovery.evidence import build_structured_evidence, extract_evidence
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


def _bounded_terms(query_terms: list[str] | None) -> list[str]:
    """Normalized, deduplicated, bounded search variants (query_terms contract)."""
    from app.syvai.discovery.query_terms import MAX_VARIANTS

    terms: list[str] = []
    for term in query_terms or []:
        text = str(term).strip()
        if text and text not in terms:
            terms.append(text)
    return terms[:MAX_VARIANTS]

# Installed provider adapters eligible for 0.3E source-registry routing. This
# is the ONLY adapter->provider mapping; ``app.syvai.registry`` routes through
# these names and a guard test keeps the registry's ``INSTALLED_ADAPTERS`` in
# lock-step with this dict. Registry rows can never name a network path that is
# not expressed here.
ADAPTER_TO_PROVIDER = {
    "wikipedia-discovery": "wikipedia",
    "loc-discovery": "loc",
    "archive-discovery": "archive",
}


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
        """Fan out over bounded query variants; a failing variant never aborts
        the others. Raises only when every variant failed and nothing was found."""
        results: list[RawCandidate] = []
        failures = 0
        attempts = 0
        first_error: ProviderError | None = None
        for term in _bounded_terms(query_terms):
            attempts += 1
            try:
                results.extend(await self._search_once(term))
            except ProviderError as exc:
                failures += 1
                if first_error is None:
                    first_error = exc
                logger.info("wikipedia discovery variant %r failed: %s", term, exc)
            if len(results) >= self._max_candidates:
                break
        results = results[: self._max_candidates]
        if not results and attempts and failures == attempts:
            raise first_error  # type: ignore[misc]
        return results

    async def _search_once(self, term: str) -> list[RawCandidate]:
        url = self._search_url([term], self._max_candidates)
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

    @staticmethod
    def _item_detail_url(item_url: str) -> str:
        return f"{item_url}?fo=json"

    async def _enrich_loc(self, author, results: list[RawCandidate]) -> list[RawCandidate]:
        """Bounded, best-effort enrichment from the official item JSON API.

        A candidate is only enriched when the author identity is already
        visible in its search snippet (so we never spend requests on noise) and
        only up to ``SYVAI_DISCOVERY_DETAIL_MAX_PER_RUN`` detail requests.
        Every failure falls back to the original search candidate; enrichment
        can never abort the provider.
        """
        budget = _detail_budget()
        enriched: list[RawCandidate] = []
        for candidate in results:
            if budget <= 0 or not _probe_matches_author(candidate, author):
                enriched.append(candidate)
                continue
            detail_url = self._item_detail_url(candidate.url)
            host = detail_url.split("/")[2] if detail_url.startswith(("http://", "https://")) else ""
            if host not in LOC_ALLOWED_HOSTS:
                enriched.append(candidate)
                continue
            budget -= 1
            try:
                page = await self._fetcher.fetch(detail_url)
                data = json.loads(page.text)
            except Exception as exc:  # noqa: BLE001 - best-effort enrichment
                logger.info("loc detail enrichment failed for %s: %s", candidate.url, exc)
                enriched.append(candidate)
                continue
            rebuilt = _loc_enriched_candidate(data.get("item") or {}, candidate)
            enriched.append(rebuilt if rebuilt is not None else candidate)
        return enriched

    async def _search_once(self, term: str) -> list[RawCandidate]:
        url = self._search_url([term], self._max_candidates)
        host = url.split("/")[2] if url.startswith(("http://", "https://")) else ""
        if host not in LOC_ALLOWED_HOSTS:
            raise ProviderError("loc discovery provider URL is not allow-listed")

        try:
            page = await self._fetcher.fetch(url)
        except Exception as exc:  # noqa: BLE001 - wrap into provider taxonomy
            raise ProviderError(f"loc discovery fetch failed: {exc}") from exc

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
            search_metadata: dict[str, str] = {}
            search_creator = _join_names(item.get("contributor") or item.get("creator") or [])
            search_date = _first_text(item.get("date"))
            if search_creator or search_date:
                search_metadata["title"] = item.get("title") or ""
                if search_creator:
                    search_metadata["creator"] = search_creator
                if search_date:
                    search_metadata["date"] = search_date
            results.append(
                RawCandidate(
                    url=canonical,
                    title=item.get("title"),
                    source_type=source_type,
                    origin="loc_search",
                    evidence=extract_evidence(" ".join(description)),
                    metadata_fields=search_metadata,
                )
            )
            if len(results) >= self._max_candidates:
                break
        return results

    async def discover(self, author, query_terms: list[str]) -> list[RawCandidate]:
        """Fan out over bounded query variants; enrich the merged set once."""
        merged: list[RawCandidate] = []
        failures = 0
        attempts = 0
        first_error: ProviderError | None = None
        for term in _bounded_terms(query_terms):
            attempts += 1
            try:
                merged.extend(await self._search_once(term))
            except ProviderError as exc:
                failures += 1
                if first_error is None:
                    first_error = exc
                logger.info("loc discovery variant %r failed: %s", term, exc)
                continue
            if len(merged) >= self._max_candidates:
                break
        merged = merged[: self._max_candidates]
        if not merged and attempts and failures == attempts:
            raise first_error  # type: ignore[misc]
        return await self._enrich_loc(author, merged)


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
                ("fl[]", "creator"),
                ("fl[]", "date"),
                ("rows", str(limit)),
                ("page", "1"),
                ("output", "json"),
            ]
        )
        return f"{ARCHIVE_SEARCH_URL}?{params}"

    @staticmethod
    def _metadata_url(detail_url: str) -> str:
        """Official Item Metadata API: https://archive.org/metadata/{identifier}."""
        from urllib.parse import urlsplit

        path = urlsplit(detail_url).path
        identifier = path.split("/")[-1] if path.rstrip("/") else ""
        return f"https://archive.org/metadata/{identifier}"

    async def _enrich_archive(self, author, results: list[RawCandidate]) -> list[RawCandidate]:
        budget = _detail_budget()
        enriched: list[RawCandidate] = []
        for candidate in results:
            if budget <= 0 or not _probe_matches_author(candidate, author):
                enriched.append(candidate)
                continue
            metadata_url = self._metadata_url(candidate.url)
            host = metadata_url.split("/")[2] if metadata_url.startswith(("http://", "https://")) else ""
            if host not in ARCHIVE_ALLOWED_HOSTS:
                enriched.append(candidate)
                continue
            budget -= 1
            try:
                page = await self._fetcher.fetch(metadata_url)
                data = json.loads(page.text)
            except Exception as exc:  # noqa: BLE001 - best-effort enrichment
                logger.info("archive detail enrichment failed for %s: %s", candidate.url, exc)
                enriched.append(candidate)
                continue
            rebuilt = _archive_enriched_candidate(data.get("metadata") or {}, candidate)
            enriched.append(rebuilt if rebuilt is not None else candidate)
        return enriched

    async def _search_once(self, term: str) -> list[RawCandidate]:
        url = self._search_url([term], self._max_candidates)
        host = url.split("/")[2] if url.startswith(("http://", "https://")) else ""
        if host not in ARCHIVE_ALLOWED_HOSTS:
            raise ProviderError("archive discovery provider URL is not allow-listed")

        try:
            page = await self._fetcher.fetch(url)
        except Exception as exc:  # noqa: BLE001 - wrap into provider taxonomy
            raise ProviderError(f"archive discovery fetch failed: {exc}") from exc

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
            search_metadata: dict[str, str] = {}
            search_creator = _join_text(doc.get("creator"))
            search_date = _first_text(doc.get("date"))
            if search_creator or search_date:
                search_metadata["title"] = doc.get("title") or ""
                if search_creator:
                    search_metadata["creator"] = search_creator
                if search_date:
                    search_metadata["date"] = search_date
            results.append(
                RawCandidate(
                    url=f"https://archive.org/details/{identifier}",
                    title=doc.get("title"),
                    source_type=source_type,
                    origin="archive_search",
                    evidence=extract_evidence(description or ""),
                    metadata_fields=search_metadata,
                )
            )
            if len(results) >= self._max_candidates:
                break
        return results

    async def discover(self, author, query_terms: list[str]) -> list[RawCandidate]:
        """Fan out over bounded query variants; enrich the merged set once."""
        merged: list[RawCandidate] = []
        failures = 0
        attempts = 0
        first_error: ProviderError | None = None
        for term in _bounded_terms(query_terms):
            attempts += 1
            try:
                merged.extend(await self._search_once(term))
            except ProviderError as exc:
                failures += 1
                if first_error is None:
                    first_error = exc
                logger.info("archive discovery variant %r failed: %s", term, exc)
                continue
            if len(merged) >= self._max_candidates:
                break
        merged = merged[: self._max_candidates]
        if not merged and attempts and failures == attempts:
            raise first_error  # type: ignore[misc]
        return await self._enrich_archive(author, merged)


# ---------------------------------------------------------------------------
# 0.3C trusted-corpus enrichment helpers (bounded, provider-owned)
# ---------------------------------------------------------------------------


def _first_text(value) -> str:
    """Return the first non-empty scalar inside a possibly nested list/str."""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        for item in value:
            text = _first_text(item)
            if text:
                return text
    return ""


def _join_text(value) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return ", ".join(text for text in (_first_text(item) for item in value) if text)
    return ""


def _join_names(value) -> str:
    """Flatten a names/contributor field (list of {name} dicts, list of str, or str)."""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        names: list[str] = []
        for item in value:
            if isinstance(item, dict):
                name = item.get("name") or item.get("label")
                if name:
                    names.append(str(name))
            elif isinstance(item, str) and item:
                names.append(item)
        return ", ".join(names)
    return ""


def _author_identity_terms(author) -> list[str]:
    return [
        name for name in (getattr(author, "display_name", None), getattr(author, "name", None))
        if name
    ]


def _probe_matches_author(candidate: RawCandidate, author) -> bool:
    """Pre-filter: does the author's identity appear in available search data?

    Probes the title, the evidence snippet, and any search-level metadata the
    provider already holds (creator/date). Used only to decide whether a
    *bounded* detail fetch is worthwhile; a miss simply skips enrichment and
    keeps the search candidate unchanged.
    """
    probe = " ".join(
        str(value)
        for value in (
            candidate.title or "",
            candidate.evidence or "",
            *candidate.metadata_fields.values(),
        )
        if value
    )
    return any(_identity_matches(f" {probe} ", term) for term in _author_identity_terms(author))


def _detail_budget() -> int:
    return max(0, int(getattr(settings, "SYVAI_DISCOVERY_DETAIL_MAX_PER_RUN", 6)))


def _loc_enriched_candidate(item: dict, base: RawCandidate) -> RawCandidate | None:
    """Rebuild a LOC candidate from the official item JSON, or None to keep base."""
    if not isinstance(item, dict) or not item:
        return None
    title = _first_text(item.get("title"))
    creator = _join_names(item.get("contributor") or item.get("creator") or [])
    date = _first_text(item.get("date"))
    description = _join_text(item.get("description") or item.get("summary") or [])
    subjects = _join_text(item.get("subject") or item.get("subjects") or [])
    if not (creator or description or subjects):
        return None
    metadata_fields = {
        "title": title or base.title or "",
        "creator": creator,
        "date": date,
    }
    evidence = build_structured_evidence(
        {"title": title or base.title, "creator": creator, "date": date, "description": description or subjects}
    )
    return RawCandidate(
        url=base.url,
        title=base.title,
        source_type=base.source_type,
        origin=base.origin,
        evidence=evidence or base.evidence,
        metadata_fields=metadata_fields,
    )


def _archive_enriched_candidate(metadata: dict, base: RawCandidate) -> RawCandidate | None:
    """Rebuild an Archive candidate from the official metadata record, or None."""
    if not isinstance(metadata, dict) or not metadata:
        return None
    title = _first_text(metadata.get("title"))
    creator = _join_text(metadata.get("creator"))
    date = _first_text(metadata.get("date") or metadata.get("year"))
    description = _join_text(metadata.get("description") or metadata.get("summary"))
    subject = _join_text(metadata.get("subject"))
    if not (creator or description or subject):
        return None
    metadata_fields = {
        "title": title or base.title or "",
        "creator": creator,
        "date": date,
    }
    evidence = build_structured_evidence(
        {"title": title or base.title, "creator": creator, "date": date, "description": description or subject}
    )
    mediatype = _first_text(metadata.get("mediatype"))
    source_type = base.source_type
    if mediatype:
        source_type = "text" if mediatype == "texts" else (mediatype or base.source_type)
    return RawCandidate(
        url=base.url,
        title=base.title,
        source_type=source_type,
        origin=base.origin,
        evidence=evidence or base.evidence,
        metadata_fields=metadata_fields,
    )


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


def build_discovery_providers(
    provider_names: list[str] | None = None,
    *,
    require_enabled: bool = True,
) -> list[SourceDiscoveryProvider]:
    """Build the provider set for a source-discovery run.

    With ``provider_names=None`` the configured environment order is used
    (0.2A/0.3A behavior). 0.3E routing passes an explicit ``provider_names``
    list so the source registry decides WHERE research is allowed; the master
    ``SYVAI_DISCOVERY_ENABLED`` gate still applies unless ``require_enabled``
    is disabled by an explicitly online caller.
    """
    if require_enabled and not settings.SYVAI_DISCOVERY_ENABLED:
        raise ConfigurationError(
            "SyvAI source discovery is not enabled: set SYVAI_DISCOVERY_ENABLED=true"
        )
    names = provider_names if provider_names is not None else _configured_provider_names()
    if not names:
        raise ConfigurationError("no discovery providers configured")
    providers = [_build_provider(name) for name in names]
    if not providers:
        raise ConfigurationError("no discovery providers configured")
    return providers
