"""Phase-2 ru.wikipedia SEARCH fallback for identity resolution.

Fires ONLY when the exact-title langlinks bootstrap explicitly fails to
resolve (never on ``ambiguous``, never when Phase 1 resolved). Search results
are candidates for validation, never identities by rank.

Acceptance requires a mandatory structured BIND against the Wikidata entity of
the candidate page (RUWIKIPEDIA_FALLBACK_DESIGN_FINAL):

    ACCEPT ⇔ G1(page-class) ∧ G3(qualifier) ∧ G4-admission
             ∧ D1(P31=human) ∧ (B1 ∨ (B2 ∧ D2-lift)) ∧ ¬DATE-VETO

  * B1  exact token-multiset equality (NFKC · casefold · apostrophe-fold ·
        comma/space tokenization) between an admitting editorial variant and
        any ru label/alias of the entity. NO Ь/Ъ stripping, no transliteration,
        no edit distance — false binding is worse than unresolved.
  * B2  every populated canonical birth/death year equals some Wikidata value.
  * B2 without B1 additionally requires D2-lift: ≥1 occupation within ≤2 P279
    hops of the author root class. Domain evidence NEVER accepts alone and
    never rejects a B1-bound person; it only compensates a weak bind.
  * DATE-VETO: any populated canonical year contradicted by every Wikidata
    value rejects unconditionally.
  * Ranking allocates scarce validation budget only; variant convergence is
    recorded as provenance and carries zero acceptance weight.

Request budget per author run (fail-closed): ≤2 searches + 1 enrichment +
1 entity fetch + up to 2 batched occupation-expansion calls in the weak-bind
path ⇒ ``SYVAI_DISCOVERY_FALLBACK_MAX_REQUESTS`` (default 6). Pure MediaWiki /
Wikidata reads: no OpenAI, $0.
"""

from __future__ import annotations

import json
import logging
import re
import unicodedata
from collections import Counter
from datetime import date, datetime
from typing import Sequence
from urllib.parse import quote, urlencode

from app.config import settings
from app.syvai.discovery.fetcher import FetcherConfig, SafeFetcher
from app.syvai.discovery.langlinks import (
    REASON_AMBIGUOUS,
    REASON_HTTP_ERROR,
    REASON_INVALID_JSON,
    REASON_NO_CANDIDATES,
    ResolvedIdentity,
    UnresolvedIdentity,
    _romanized_terms,
)
from app.syvai.discovery.query_terms import strip_qualifier

logger = logging.getLogger(__name__)

# Host allow-lists (exact-match enforced by SafeFetcher, same mechanics as the
# bootstrap and the discovery providers).
RUWIKI_ALLOWED_HOSTS = {"ru.wikipedia.org"}
RUWIKI_API_URL = "https://ru.wikipedia.org/w/api.php"
WIKIDATA_ALLOWED_HOSTS = {"www.wikidata.org"}
WIKIDATA_API_URL = "https://www.wikidata.org/w/api.php"

REASON_NO_SAFE_MATCH = "search_no_safe_match"
REASON_BUDGET_EXHAUSTED = "fallback_budget_exhausted"

BIND_ALIAS = "alias_fold"
BIND_DATES_LIFT = "dates_lift"

_AUTHOR_ROOT_CLASS = "Q482980"  # author (Wikidata class)
_HUMAN_CLASS = "Q5"
_P279_MAX_DEPTH = 2

_MAX_SEARCHES = 2
_SR_LIMIT = 5
_ENRICH_PAGEIDS = 4
_ENTITIES_PER_CALL = 50

_MIN_TOKEN_LEN = 2  # G4 admission tokens must be non-trivial

_APOSTROPHE_CHARS = {"\u2019", "\u02bc", "\u2018", "\u201b"}
_QUALIFIER_RE = re.compile(r"\(([^()]*)\)")
_NON_WORD_RE = re.compile(r"[^\w'-]+", re.UNICODE)
_YEAR_RE = re.compile(r"\d{4}")

_METHOD = "search_fallback"


class _Budget:
    """Strict fail-closed request accounting."""

    def __init__(self, limit: int):
        self.limit = max(0, int(limit))
        self.spent = 0

    @property
    def exhausted(self) -> bool:
        return self.spent >= self.limit

    def spend(self) -> None:
        if self.exhausted:
            raise _BudgetExhausted()
        self.spent += 1


class _BudgetExhausted(Exception):
    pass


def _fallback_fetcher() -> SafeFetcher:
    return SafeFetcher(
        FetcherConfig(
            timeout_seconds=settings.SYVAI_DISCOVERY_TIMEOUT_SECONDS,
            max_bytes=settings.SYVAI_DISCOVERY_MAX_PAGE_BYTES,
            user_agent=settings.SYVAI_DISCOVERY_USER_AGENT,
            allowed_hosts=frozenset(RUWIKI_ALLOWED_HOSTS),
        )
    )


def _wikidata_fetcher() -> SafeFetcher:
    return SafeFetcher(
        FetcherConfig(
            timeout_seconds=settings.SYVAI_DISCOVERY_TIMEOUT_SECONDS,
            max_bytes=settings.SYVAI_DISCOVERY_MAX_PAGE_BYTES,
            user_agent=settings.SYVAI_DISCOVERY_USER_AGENT,
            allowed_hosts=frozenset(WIKIDATA_ALLOWED_HOSTS),
        )
    )


def _bind_normalize(raw: str | None) -> Counter:
    """Deterministic BIND normalization.

    NFKC → casefold → apostrophe-family fold → punctuation to spaces (word
    characters, hyphen and apostrophe survive) → token multiset. Deliberately
    NO trailing-Ь/Ъ handling and no transliteration: orthographic divergence
    that survives this fold stays UNBOUND.
    """
    if not raw:
        return Counter()
    text = unicodedata.normalize("NFKC", raw).casefold()
    text = "".join("'" if ch in _APOSTROPHE_CHARS else ch for ch in text)
    text = _NON_WORD_RE.sub(" ", text)
    return Counter(tok for tok in text.split() if tok)


def _title_tokens(raw: str) -> set[str]:
    """Folded tokens of a hit title (G4 admission filter)."""
    return {tok for tok in _bind_normalize(raw) if len(tok) >= _MIN_TOKEN_LEN}


def _qualifiers(text: str | None) -> list[str]:
    return sorted(q.strip() for q in _QUALIFIER_RE.findall(text or ""))


def _qualifier_gate(variant: str, final_title: str) -> bool:
    """G3: exact match both ways, or a qualified page against a bare variant.

    The asymmetric direction is deliberate: editorial ru.wikipedia usage
    routinely drops «(отец)»/«(сын)» qualifiers, so bare variants must be
    allowed to reach the structured BIND stage, where stripped-form multiset
    equality plus survivor counting keep père/fils collisions fail-closed.
    A qualified variant never admits a bare page — the reverse stays strict.
    """
    page_q = _qualifiers(final_title)
    variant_q = _qualifiers(variant)
    if page_q == variant_q:
        return True
    return bool(page_q) and not variant_q


def _canonical_year(value) -> int | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.year
    if isinstance(value, date):
        return value.year
    match = _YEAR_RE.search(str(value))
    return int(match.group(0)) if match else None


def _wd_value_years(entity: dict, prop: str) -> list[int]:
    years: list[int] = []
    for claim in (entity.get("claims") or {}).get(prop, []):
        snak = (claim.get("mainsnak") or {}).get("datavalue") or {}
        value = snak.get("value") or ""
        time_value = value.get("time") if isinstance(value, dict) else value
        match = _YEAR_RE.search(str(time_value or ""))
        if match:
            years.append(int(match.group(0)))
    return years


def _search_url(variant: str) -> str:
    params = urlencode(
        {
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "list": "search",
            "srsearch": variant,
            "srnamespace": "0",
            "srlimit": str(_SR_LIMIT),
        }
    )
    return f"{RUWIKI_API_URL}?{params}"


def _enrich_url(pageids: Sequence[int]) -> str:
    params = urlencode(
        {
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "pageids": "|".join(str(pid) for pid in pageids),
            "prop": "langlinks|pageprops",
            "ppprop": "disambiguation|wikibase_item",
            "lllang": "en",
            "lllimit": "max",
        }
    )
    return f"{RUWIKI_API_URL}?{params}"


def _entities_url(ids: Sequence[str], *, claims_only: bool = False) -> str:
    props = "claims" if claims_only else "labels|aliases|claims|sitelinks"
    params = urlencode(
        {
            "action": "wbgetentities",
            "format": "json",
            "formatversion": "2",
            "ids": "|".join(ids[:_ENTITIES_PER_CALL]),
            "props": props,
            "languages": "ru",
            "sitefilter": "enwiki",
        }
    )
    return f"{WIKIDATA_API_URL}?{params}"


async def _get_json(client: SafeFetcher, url: str, budget: _Budget) -> dict:
    budget.spend()
    page = await client.fetch(url)
    data = json.loads(page.text)
    if not isinstance(data, dict):
        raise ValueError("non-object payload")
    return data


async def _p279_reaches_author_root(
    client: SafeFetcher, budget: _Budget, occupation_ids: Sequence[str]
) -> bool:
    """D2-lift: any occupation reaches the author root within ≤2 P279 hops.

    At most two batched calls: occupations first, then their parents when the
    first hop misses. Fail-closed at depth exhaustion.
    """
    frontier = [oid for oid in dict.fromkeys(occupation_ids) if oid]
    seen: set[str] = set(frontier)
    for _depth in range(_P279_MAX_DEPTH):
        if not frontier:
            return False
        data = await _get_json(client, _entities_url(frontier, claims_only=True), budget)
        parents: list[str] = []
        for entity in (data.get("entities") or {}).values():
            for claim in (entity.get("claims") or {}).get("P279", []):
                value = ((claim.get("mainsnak") or {}).get("datavalue") or {}).get("value") or {}
                parent = value.get("id")
                if parent and parent == _AUTHOR_ROOT_CLASS:
                    return True
                if parent and parent not in seen:
                    seen.add(parent)
                    parents.append(parent)
        frontier = parents
    return False


async def search_fallback_resolve(
    base_variants: Sequence[str],
    *,
    birth_date=None,
    death_date=None,
    fetcher: SafeFetcher | None = None,
    wikidata: SafeFetcher | None = None,
    max_requests: int | None = None,
) -> ResolvedIdentity | UnresolvedIdentity:
    """Bounded search-fallback resolution with mandatory structured BIND."""
    variants: list[str] = []
    for variant in base_variants or []:
        text = (variant or "").strip()
        if text and text not in variants:
            variants.append(text)
    variants = variants[:_MAX_SEARCHES]
    if not variants:
        return UnresolvedIdentity(reason=REASON_NO_CANDIDATES)

    limit = (
        max_requests
        if max_requests is not None
        else getattr(settings, "SYVAI_DISCOVERY_FALLBACK_MAX_REQUESTS", 6)
    )
    budget = _Budget(int(limit))
    wiki_client = fetcher or _fallback_fetcher()
    wd_client = wikidata or _wikidata_fetcher()

    try:
        # --- R1..R2: bounded searches; ranking only shortlists validation ---
        admitted: dict[int, dict] = {}  # pageid -> candidate shell
        for variant in variants:
            search = await _get_json(wiki_client, _search_url(variant), budget)
            hits = ((search.get("query") or {}).get("search")) or []
            variant_tokens = _title_tokens(variant)
            for hit in hits[:_SR_LIMIT]:
                title = hit.get("title") or ""
                pageid = hit.get("pageid")
                ns = hit.get("ns")
                if not title or pageid is None or ns != 0:
                    continue
                # G4 admission filter: ≥1 shared non-trivial token. A pure
                # filter — never positive acceptance evidence.
                if not (variant_tokens & _title_tokens(title)):
                    continue
                shell = admitted.setdefault(
                    pageid, {"title": title, "variants": [], "g3_ok": []}
                )
                if variant not in shell["variants"]:
                    shell["variants"].append(variant)

        if not admitted:
            return UnresolvedIdentity(reason=REASON_NO_SAFE_MATCH)

        # --- R3: one enrichment batch over the shortlisted pages ---
        pageids = sorted(admitted)[:_ENRICH_PAGEIDS]
        enrich = await _get_json(wiki_client, _enrich_url(pageids), budget)
        pages_by_id = {
            page.get("pageid"): page for page in (enrich.get("query") or {}).get("pages") or []
        }

        survivors: list[dict] = []
        for pageid in pageids:
            page = pages_by_id.get(pageid) or {}
            shell = admitted.get(pageid) or {}
            final_title = page.get("title") or shell.get("title") or ""
            if not final_title or page.get("missing"):
                continue
            if page.get("ns") not in (None, 0):
                continue
            pageprops = page.get("pageprops") or {}
            if "disambiguation" in pageprops:
                continue  # G1
            en_title = next(
                (
                    link.get("title")
                    for link in page.get("langlinks") or []
                    if link.get("lang") == "en"
                ),
                None,
            )
            if not en_title:
                continue  # G2
            passing_variants = [
                v for v in shell.get("variants") or [] if _qualifier_gate(v, final_title)
            ]
            if not passing_variants:
                continue  # G3 (both directions)
            qid = (pageprops.get("wikibase_item") or "").strip()
            survivors.append(
                {
                    "pageid": pageid,
                    "title": final_title,
                    "en_title": en_title,
                    "qid": qid or None,
                    "variants": passing_variants,
                }
            )

        if not survivors:
            return UnresolvedIdentity(reason=REASON_NO_SAFE_MATCH)

        # --- R4: structured identity evidence for every survivor ---
        qids = sorted({s["qid"] for s in survivors if s["qid"]})
        entities: dict[str, dict] = {}
        if qids:
            entity_data = await _get_json(wd_client, _entities_url(qids), budget)
            entities = entity_data.get("entities") or {}

        birth_year = _canonical_year(birth_date)
        death_year = _canonical_year(death_date)
        canonical_years = [y for y in (birth_year, death_year) if y is not None]

        accepted: list[dict] = []
        rejected_notes: list[str] = []
        near_misses: list[str] = []

        for survivor in survivors:
            qid = survivor["qid"]
            entity = entities.get(qid or "") if qid else None
            note = {"title": survivor["title"], "qid": qid}
            if entity is None:
                note["reject"] = "no_wikidata_entity"
                rejected_notes.append(note)
                continue
            # D1 sanity gate: humans only.
            p31_values = [
                ((c.get("mainsnak") or {}).get("datavalue") or {}).get("value", {}).get("id")
                for c in (entity.get("claims") or {}).get("P31", [])
            ]
            if _HUMAN_CLASS not in [v for v in p31_values if v]:
                note["reject"] = "not_human_entity"
                rejected_notes.append(note)
                continue
            # Sitelink/langlink consistency.
            sitelink_title = (entity.get("sitelinks") or {}).get("enwiki", {}).get("title")
            if sitelink_title is not None and sitelink_title != survivor["en_title"]:
                note["reject"] = "sitelink_langlink_mismatch"
                rejected_notes.append(note)
                continue

            # DATE-VETO / B2 evaluation.
            wd_birth = _wd_value_years(entity, "P569")
            wd_death = _wd_value_years(entity, "P570")

            def _matches(year: int | None, pool: list[int]) -> bool | None:
                if year is None:
                    return None
                if not pool:
                    return False
                return year in pool

            b_birth = _matches(birth_year, wd_birth)
            b_death = _matches(death_year, wd_death)
            vetoed = (b_birth is False) or (b_death is False)
            dates_bind = all(v is True for v in (b_birth, b_death) if v is not None)

            # B1 exact alias/label fold across ALL multilingual ru forms.
            # Qualifiers are stripped on the editorial side first — they gate
            # at G3, but «(сын)» must not poison the token multiset that
            # binds against aliases like «Александр Дюма».
            forms = [(entity.get("labels") or {}).get("ru", {}).get("value")]
            forms.extend(a.get("value") for a in (entity.get("aliases") or {}).get("ru", []))
            bound_variant = None
            bound_form = None
            for variant in survivor["variants"]:
                wanted = _bind_normalize(strip_qualifier(variant))
                if not wanted:
                    continue
                form = next((f for f in forms if f and _bind_normalize(f) == wanted), None)
                if form is not None:
                    bound_variant, bound_form = variant, form
                    break

            if vetoed:
                note["reject"] = "canonical_date_contradiction"
                rejected_notes.append(note)
                continue
            if bound_variant is not None:
                accepted.append({**survivor, "bind": BIND_ALIAS, "bound_form": bound_form})
                continue
            if canonical_years and dates_bind:
                # Weak-bind path: dates may compensate ONLY with domain lift.
                occupation_ids: list[str] = []
                for claim in (entity.get("claims") or {}).get("P106", []):
                    value = ((claim.get("mainsnak") or {}).get("datavalue") or {}).get("value")
                    if isinstance(value, dict) and value.get("id"):
                        occupation_ids.append(value["id"])
                lift = await _p279_reaches_author_root(wd_client, budget, occupation_ids)
                if lift:
                    accepted.append({**survivor, "bind": BIND_DATES_LIFT, "bound_form": None})
                    continue
                note["reject"] = "weak_bind_without_domain_lift"
                rejected_notes.append(note)
                continue
            near_misses.append(
                json.dumps({"title": survivor["title"], "qid": qid}, ensure_ascii=False)
            )

        if len(accepted) > 1:
            detail = "; ".join(f"{a['title']} ({a['qid']})" for a in accepted)
            return UnresolvedIdentity(reason=REASON_AMBIGUOUS, detail=detail[:500])
        if not accepted:
            detail = "; ".join(near_misses[:6]) or "; ".join(
                json.dumps(n, ensure_ascii=False) for n in rejected_notes[:6]
            )
            return UnresolvedIdentity(reason=REASON_NO_SAFE_MATCH, detail=detail[:500])

        winner = accepted[0]
        en_title = winner["en_title"]
        en_url = (
            f"https://en.wikipedia.org/wiki/{quote(en_title.replace(' ', '_'))}"
            if en_title
            else None
        )
        provenance = {
            "method": _METHOD,
            "queried_variants": list(variants),
            "surviving_pageid": winner["pageid"],
            "corroboration": winner["bind"],
            "qid": winner["qid"],
            "rejected": rejected_notes[:8],
        }
        return ResolvedIdentity(
            source_variant=winner["variants"][0],
            ru_title=winner["title"],
            en_title=en_title,
            en_url=en_url,
            romanized_terms=_romanized_terms(en_title) if en_title else (),
            method=_METHOD,
            fallback=provenance,
        )
    except _BudgetExhausted:
        return UnresolvedIdentity(reason=REASON_BUDGET_EXHAUSTED)
    except json.JSONDecodeError as exc:
        return UnresolvedIdentity(reason=REASON_INVALID_JSON, detail=str(exc)[:200])
    except Exception as exc:  # noqa: BLE001 - typed failure boundary
        logger.warning("syvai discovery search-fallback error: %s", exc)
        return UnresolvedIdentity(reason=REASON_HTTP_ERROR, detail=str(exc)[:300])
