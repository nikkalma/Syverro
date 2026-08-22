"""ru.wikipedia -> EN identity bootstrap for cross-script authors.

One bounded, deterministic MediaWiki lookup resolves an author's normalized
query variants to a concrete ru.wikipedia article and its English langlink:

    canonical Author
      -> query variant used        (ResolvedIdentity.source_variant)
      -> ru.wikipedia page         (ru_title)
      -> EN langlink title / URL   (en_title / en_url)

Contract (deliberately narrow):

  * consumes the SAME normalized variants produced by ``query_terms`` — the
    stored canonical form may differ from the wiki canonical title, so every
    variant is submitted in a single ``titles=A|B|C`` request;
  * follows MediaWiki normalization and redirects reported by the API itself
    (no fuzzy search, no first-result guessing);
  * accepts an identity only when a concrete non-missing article carries an
    EN langlink; disambiguation pages (``pageprops.disambiguation``) can never
    become identities;
  * when different variants resolve to different articles (père/fils class
    ambiguity), the result is explicitly ``ambiguous`` — unresolved — rather
    than silently picking one;
  * never raises: every failure mode is a typed ``UnresolvedIdentity``.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Sequence
from urllib.parse import quote, urlencode

from app.config import settings
from app.syvai.discovery.fetcher import FetcherConfig, SafeFetcher

logger = logging.getLogger(__name__)

# This adapter's own fixed host allow-list (same enforcement mechanics as the
# discovery providers: exact-match per request and per redirect hop).
RUWIKI_ALLOWED_HOSTS = {"ru.wikipedia.org"}
RUWIKI_API_URL = "https://ru.wikipedia.org/w/api.php"

# MediaWiki accepts up to 50 titles per read request for non-bots; the variant
# bound from query_terms is far below that, so one request always suffices.
_MAX_TITLES = 4

REASON_NO_CANDIDATES = "no_candidates"
REASON_HTTP_ERROR = "http_error"
REASON_INVALID_JSON = "invalid_json"
REASON_UNRESOLVABLE = "unresolvable"
REASON_MISSING = "missing"
REASON_DISAMBIGUATION = "disambiguation_page"
REASON_NO_LANGLINK = "no_langlink"
REASON_AMBIGUOUS = "ambiguous"


@dataclass(frozen=True)
class ResolvedIdentity:
    """A bootstrap-resolved external identity, with full provenance."""

    source_variant: str
    ru_title: str
    en_title: str | None
    en_url: str | None
    romanized_terms: tuple[str, ...]

    def provenance(self) -> dict:
        return {
            "source_variant": self.source_variant,
            "ru_title": self.ru_title,
            "en_title": self.en_title,
            "en_url": self.en_url,
        }


@dataclass(frozen=True)
class UnresolvedIdentity:
    """Explicit non-resolution; ``detail`` carries reviewable provenance."""

    reason: str
    detail: str = ""


def _bootstrap_fetcher() -> SafeFetcher:
    return SafeFetcher(
        FetcherConfig(
            timeout_seconds=settings.SYVAI_DISCOVERY_TIMEOUT_SECONDS,
            max_bytes=settings.SYVAI_DISCOVERY_MAX_PAGE_BYTES,
            user_agent=settings.SYVAI_DISCOVERY_USER_AGENT,
            allowed_hosts=frozenset(RUWIKI_ALLOWED_HOSTS),
        )
    )


def _request_url(variants: Sequence[str]) -> str:
    params = urlencode(
        {
            "action": "query",
            "format": "json",
            "formatversion": 2,
            "redirects": 1,
            "prop": "langlinks|pageprops",
            "ppprop": "disambiguation",
            "lllang": "en",
            "lllimit": "max",
            "titles": "|".join(variants),
        }
    )
    return f"{RUWIKI_API_URL}?{params}"


def _follow_chain(start: str, chain: dict[str, str]) -> str:
    """Follow normalization/redirect mappings to a fixpoint (cycle-safe)."""
    current = start
    seen = {current}
    while current in chain:
        nxt = chain[current]
        if not nxt or nxt in seen:
            break
        seen.add(nxt)
        current = nxt
    return current


def _romanized_terms(en_title: str) -> tuple[str, ...]:
    """Bounded search terms derived from the EN title (stripped form first)."""
    from app.syvai.discovery.query_terms import normalize_name, strip_qualifier

    normalized = normalize_name(en_title)
    if not normalized:
        return ()
    stripped = strip_qualifier(normalized)
    terms: list[str] = []
    for term in (stripped or normalized, normalized):
        if term and term not in terms:
            terms.append(term)
    return tuple(terms)


async def resolve_en_identity(
    query_variants: Sequence[str],
    *,
    fetcher: SafeFetcher | None = None,
) -> ResolvedIdentity | UnresolvedIdentity:
    """Resolve bounded query variants to one concrete identity via ru.wikipedia.

    Submits ALL variants in a single MediaWiki request; accepts only when the
    resolvable variants converge on exactly one concrete article that carries
    an EN langlink. Any divergence is ``ambiguous``, never a silent pick.
    """
    variants: list[str] = []
    for variant in query_variants:
        text = (variant or "").strip()
        if text and text not in variants:
            variants.append(text)
    variants = variants[:_MAX_TITLES]
    if not variants:
        return UnresolvedIdentity(reason=REASON_NO_CANDIDATES)

    client = fetcher or _bootstrap_fetcher()
    try:
        page = await client.fetch(_request_url(variants))
    except Exception as exc:  # noqa: BLE001 - typed failure boundary
        return UnresolvedIdentity(reason=REASON_HTTP_ERROR, detail=str(exc)[:300])

    try:
        data = json.loads(page.text)
    except (json.JSONDecodeError, TypeError) as exc:
        return UnresolvedIdentity(reason=REASON_INVALID_JSON, detail=str(exc)[:200])

    query = data.get("query") or {}

    # MediaWiki reports the transformations it applied to our input titles.
    chain: dict[str, str] = {}
    for mapping in query.get("normalized") or []:
        src, dst = mapping.get("from"), mapping.get("to")
        if src and dst:
            chain[src] = dst
    for mapping in query.get("redirects") or []:
        src, dst = mapping.get("from"), mapping.get("to")
        if src and dst:
            chain[src] = dst

    pages_by_title: dict[str, dict] = {}
    for item in query.get("pages") or []:
        title = item.get("title")
        if title:
            pages_by_title[title] = item

    resolved_variants: list[tuple[str, str]] = []  # (variant, final ru_title)
    misses: list[str] = []
    for variant in variants:
        final_title = _follow_chain(variant, chain)
        item = pages_by_title.get(final_title) or pages_by_title.get(variant)
        if item is None:
            misses.append(f"{variant}: unresolvable")
            continue
        if item.get("missing"):
            misses.append(f"{variant}: missing ({item.get('title')})")
            continue
        pageprops = item.get("pageprops") or {}
        if "disambiguation" in pageprops:
            misses.append(f"{variant}: disambiguation ({item.get('title')})")
            continue
        langlinks = item.get("langlinks") or []
        en_title = next(
            (link.get("title") for link in langlinks if link.get("lang") == "en"),
            None,
        )
        if not en_title:
            misses.append(f"{variant}: no_langlink ({item.get('title')})")
            continue
        resolved_variants.append((variant, item["title"]))

    distinct_titles = {ru_title for _, ru_title in resolved_variants}
    if len(distinct_titles) > 1:
        detail = "; ".join(f"{variant} -> {title}" for variant, title in resolved_variants)
        return UnresolvedIdentity(reason=REASON_AMBIGUOUS, detail=detail[:500])
    if not resolved_variants:
        return UnresolvedIdentity(reason=REASON_NO_LANGLINK, detail="; ".join(misses)[:500])

    source_variant, ru_title = resolved_variants[0]
    winner_item = pages_by_title.get(ru_title) or {}
    en_title = next(
        (
            link.get("title")
            for link in winner_item.get("langlinks") or []
            if link.get("lang") == "en"
        ),
        None,
    )
    romanized = _romanized_terms(en_title) if en_title else ()
    en_url = (
        f"https://en.wikipedia.org/wiki/{quote(en_title.replace(' ', '_'))}"
        if en_title
        else None
    )
    return ResolvedIdentity(
        source_variant=source_variant,
        ru_title=ru_title,
        en_title=en_title,
        en_url=en_url,
        romanized_terms=romanized,
    )
