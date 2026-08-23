"""Phase-2 ru.wikipedia search fallback: mandatory structured BIND (offline).

Covers the RUWIKIPEDIA_FALLBACK_DESIGN_FINAL matrix. All network surfaces are
routed fakes; no test touches the network.
"""

from __future__ import annotations

import json
import urllib.parse
from datetime import date
from types import SimpleNamespace

import pytest

from app.syvai.discovery.langlinks import (
    REASON_AMBIGUOUS,
    REASON_HTTP_ERROR,
    REASON_NO_CANDIDATES,
    ResolvedIdentity,
    UnresolvedIdentity,
)
from app.syvai.discovery.ruwiki_fallback import (
    BIND_ALIAS,
    BIND_DATES_LIFT,
    REASON_BUDGET_EXHAUSTED,
    REASON_NO_SAFE_MATCH,
    _bind_normalize,
    search_fallback_resolve,
)


# ---------------------------------------------------------------------------
# Offline routing fetcher
# ---------------------------------------------------------------------------


class RoutingFetcher:
    """SafeFetcher stand-in dispatching on parsed MediaWiki query params."""

    def __init__(self, routes):
        self._routes = list(routes)  # [(matcher(params, host), responder)]
        self.calls = []  # (host, params)

    async def fetch(self, url):
        parsed = urllib.parse.urlparse(url)
        params = {k: v[0] for k, v in urllib.parse.parse_qs(parsed.query).items()}
        self.calls.append((parsed.netloc, params))
        for matcher, responder in self._routes:
            if matcher(params, parsed.netloc):
                payload = responder(params) if callable(responder) else responder
                return SimpleNamespace(text=json.dumps(payload))
        raise AssertionError(f"unrouted request: {url}")


def _search_route(variant_text, hits):
    def match(params, _host):
        return params.get("list") == "search" and params.get("srsearch") == variant_text

    return match, {"query": {"search": hits}}


def _enrich_route(pages):
    def match(params, host):
        return host == "ru.wikipedia.org" and params.get("pageids")

    return match, {"query": {"pages": pages}}


def _entities_route(entities_by_qid):
    def match(params, host):
        return host == "www.wikidata.org" and params.get("action") == "wbgetentities"

    def respond(params):
        wanted = (params.get("ids") or "").split("|")
        return {
            "entities": {qid: entities_by_qid[qid] for qid in wanted if qid in entities_by_qid}
        }

    return match, respond


def _hit(title, pageid, ns=0):
    return {"title": title, "pageid": pageid, "ns": ns}


def _page(
    pageid,
    title,
    *,
    en_langlink=None,
    qid=None,
    missing=False,
    disambiguation=False,
    sitelink=None,
):
    page = {"pageid": pageid, "ns": 0, "title": title}
    if missing:
        page["missing"] = True
    props = {}
    if disambiguation:
        props["disambiguation"] = ""
    if qid:
        props["wikibase_item"] = qid
    if props:
        page["pageprops"] = props
    if en_langlink:
        page["langlinks"] = [{"lang": "en", "title": en_langlink}]
    assert sitelink is None  # sitelinks live on the Wikidata entity, not here
    return page


def _claim(value_id):
    return {"mainsnak": {"datavalue": {"value": {"id": value_id}}}}


def _time_claims(*years):
    return [
        {"mainsnak": {"datavalue": {"value": {"time": f"+{y}-06-15T00:00:00Z"}}}}
        for y in years
    ]


def _class(parents):
    """A Wikidata class entity exposing only its P279 parents."""
    return {"claims": {"P279": [_claim(p) for p in parents]}}


# Class-ontology fragments for D2-lift expansion calls (probe-derived).
NOVELIST_ONTOLOGY = {
    "Q6625963": _class(["Q36180"]),  # novelist -> writer
    "Q36180": _class(["Q482980"]),  # writer -> author (root)
}
POLITICIAN_ONTOLOGY = {
    "Q82955": _class(["Q702269"]),  # politician -> ...
    "Q702269": _class(["Q41487"]),  # ... never reaches author within depth 2
}


def _entity(
    *,
    ru_label=None,
    ru_aliases=(),
    p31=("Q5",),
    p106=(),
    birth_years=(),
    death_years=(),
    enwiki=None,
):
    entity = {"claims": {}, "sitelinks": {}}
    if ru_label is not None:
        entity["labels"] = {"ru": {"value": ru_label}}
    if ru_aliases:
        entity["aliases"] = {"ru": [{"value": a} for a in ru_aliases]}
    claims = entity["claims"]
    if p31:
        claims["P31"] = [_claim(v) for v in p31]
    if p106:
        claims["P106"] = [_claim(v) for v in p106]
    if birth_years:
        claims["P569"] = _time_claims(*birth_years)
    if death_years:
        claims["P570"] = _time_claims(*death_years)
    if enwiki is not None:
        entity["sitelinks"] = {"enwiki": {"title": enwiki}}
    return entity


# ---------------------------------------------------------------------------
# T26 — BIND normalizer contract
# ---------------------------------------------------------------------------


class TestBindNormalizer:
    def test_apostrophe_families_fold(self):
        assert _bind_normalize("Л'Энгль") == _bind_normalize("Л’Энгль")
        assert _bind_normalize("Л’Энгль") == _bind_normalize("ЛʼЭнгль")
        assert _bind_normalize("О'Брайен") == _bind_normalize("о’брайен")

    def test_trailing_soft_sign_is_never_stripped(self):
        # The explicit regression guard: Энгль ≠ Энгл under BIND semantics.
        assert _bind_normalize("Л’Энгль") != _bind_normalize("Л’Энгл")
        assert _bind_normalize("Энгль") != _bind_normalize("энгл")

    def test_order_and_punctuation_insensitive_multiset(self):
        assert _bind_normalize("Войнич, Этель Лилиан") == _bind_normalize(
            "Войнич Этель Лилиан"
        )
        assert _bind_normalize("Дюма-отец") != _bind_normalize("Дюма отец")


# ---------------------------------------------------------------------------
# T5′ — Madeleine L’Engle stays unresolved under production data
# ---------------------------------------------------------------------------


LENGLE_ENTITY = _entity(
    ru_label="Мадлен Л’Энгл",
    ru_aliases=["Мадлен Ленгль", "Л’Энгл Мадлен", "Л'Энгл, Мадлен", "Мадлен Л'Энгл"],
    p106=["Q49757", "Q6625963", "Q36180"],
    birth_years=(1918,),
    death_years=(2007, 2007),
    enwiki="Madeleine L'Engle",
)


@pytest.mark.asyncio
async def test_lengle_remains_unresolved_no_exact_structured_bind():
    """Editorial «Л’Энгль» folds to л'энгль; every real alias folds to л'энгл.

    The gates admit her page, the floors pass, but B1 cannot bind and the
    author has no canonical dates, so B2 is unavailable ⇒ typed unresolved.
    """
    fetcher = RoutingFetcher(
        [
            _search_route(
                "Л'Энгль, Мадлен",
                [
                    _hit("Л’Энгл, Мадлен", 4604987),
                    _hit("Излом времени", 6687006),
                ],
            ),
            _search_route(
                "Мадлен Л'Энгль",
                [_hit("Л’Энгл, Мадлен", 4604987)],
            ),
            _enrich_route(
                [
                    _page(4604987, "Л’Энгл, Мадлен", en_langlink="Madeleine L'Engle", qid="Q257261"),
                    _page(6687006, "Излом времени", en_langlink="A Wrinkle in Time (2018 film)", qid="Q24301388"),
                ]
            ),
        ]
    )
    wikidata = RoutingFetcher([_entities_route({"Q257261": LENGLE_ENTITY})])

    outcome = await search_fallback_resolve(
        ["Л'Энгль, Мадлен", "Мадлен Л'Энгль"], fetcher=fetcher, wikidata=wikidata
    )

    assert isinstance(outcome, UnresolvedIdentity)
    assert outcome.reason == REASON_NO_SAFE_MATCH
    assert "Q257261" in outcome.detail  # reviewable near-miss provenance
    # R1+R2 searches + R3 enrichment on the wiki side; R4 entities only here.
    assert len(fetcher.calls) == 3
    assert len(wikidata.calls) == 1


@pytest.mark.asyncio
async def test_lengle_resolves_once_editorial_form_matches_an_alias():
    """The documented resolution path: an exact editorial alias form binds.

    Uses the same fixtures but an author whose stored name carries the
    wiki-canonical spelling «Л’Энгл» — generic, no per-author logic involved.
    """
    fetcher = RoutingFetcher(
        [
            _search_route(
                "Л'Энгл, Мадлен",
                [_hit("Л’Энгл, Мадлен", 4604987)],
            ),
            _enrich_route(
                [_page(4604987, "Л’Энгл, Мадлен", en_langlink="Madeleine L'Engle", qid="Q257261")]
            ),
        ]
    )
    wikidata = RoutingFetcher([_entities_route({"Q257261": LENGLE_ENTITY})])

    outcome = await search_fallback_resolve(["Л'Энгл, Мадлен"], fetcher=fetcher, wikidata=wikidata)

    assert isinstance(outcome, ResolvedIdentity)
    assert outcome.method == "search_fallback"
    assert outcome.ru_title == "Л’Энгл, Мадлен"
    assert outcome.en_title == "Madeleine L'Engle"
    assert outcome.fallback["corroboration"] == BIND_ALIAS
    assert outcome.fallback["qid"] == "Q257261"
    provenance = outcome.provenance()
    assert provenance["method"] == "search_fallback"
    assert provenance["fallback"]["surviving_pageid"] == 4604987


# ---------------------------------------------------------------------------
# T25 — weak-bind path (B2 dates + D2-lift) accept / reject
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_weak_bind_dates_plus_literary_lift_accepts():
    """No ru forms at all (B1 impossible); matching canonical dates plus a
    novelist→writer→author occupation chain compensate via the weak path."""
    person = _entity(
        p106=["Q6625963"],
        birth_years=(1950,),
        death_years=(2020,),
        enwiki="Test Writer",
    )
    fetcher = RoutingFetcher(
        [
            _search_route("Писатель, Тестовый", [_hit("Тестовый Писатель", 11)]),
            _enrich_route(
                [_page(11, "Тестовый Писатель", en_langlink="Test Writer", qid="Q999001")]
            ),
        ]
    )
    wikidata = RoutingFetcher(
        [_entities_route({"Q999001": person, **NOVELIST_ONTOLOGY})]
    )

    outcome = await search_fallback_resolve(
        ["Писатель, Тестовый"],
        birth_date=date(1950, 6, 15),
        death_date=date(2020, 6, 15),
        fetcher=fetcher,
        wikidata=wikidata,
    )

    assert isinstance(outcome, ResolvedIdentity)
    assert outcome.fallback["corroboration"] == BIND_DATES_LIFT
    # entities + two batched P279 expansion calls.
    assert len(wikidata.calls) == 3


@pytest.mark.asyncio
async def test_weak_bind_dates_without_domain_lift_rejected():
    person = _entity(
        p106=["Q82955"],
        birth_years=(1950,),
        death_years=(2020,),
        enwiki="Test Diplomat",
    )
    fetcher = RoutingFetcher(
        [
            _search_route("Дипломат, Тестовый", [_hit("Тестовый Дипломат", 12)]),
            _enrich_route(
                [_page(12, "Тестовый Дипломат", en_langlink="Test Diplomat", qid="Q999002")]
            ),
        ]
    )
    wikidata = RoutingFetcher(
        [_entities_route({"Q999002": person, **POLITICIAN_ONTOLOGY})]
    )

    outcome = await search_fallback_resolve(
        ["Дипломат, Тестовый"],
        birth_date=date(1950, 1, 1),
        death_date=date(2020, 1, 1),
        fetcher=fetcher,
        wikidata=wikidata,
    )

    assert isinstance(outcome, UnresolvedIdentity)
    assert outcome.reason == REASON_NO_SAFE_MATCH
    assert len(wikidata.calls) == 3


@pytest.mark.asyncio
async def test_weak_bind_accepts_even_when_all_ru_forms_are_unrelated():
    """Dates+lift bind the person, not the label text: an entirely different
    ru surface cannot block a canonical-date identity match."""
    person = _entity(
        ru_label="Другой Человек",
        ru_aliases=["Иванов, Иван"],
        p106=["Q6625963"],
        birth_years=(1900,),
        death_years=(1980,),
        enwiki="Other Person",
    )
    fetcher = RoutingFetcher(
        [
            _search_route("Петров, Пётр", [_hit("Петров, Пётр", 13)]),
            _enrich_route(
                [_page(13, "Петров, Пётр", en_langlink="Other Person", qid="Q999003")]
            ),
        ]
    )
    wikidata = RoutingFetcher(
        [_entities_route({"Q999003": person, **NOVELIST_ONTOLOGY})]
    )

    outcome = await search_fallback_resolve(
        ["Петров, Пётр"],
        birth_date=date(1900, 1, 1),
        death_date=date(1980, 1, 1),
        fetcher=fetcher,
        wikidata=wikidata,
    )

    assert isinstance(outcome, ResolvedIdentity)
    assert outcome.fallback["corroboration"] == BIND_DATES_LIFT


# ---------------------------------------------------------------------------
# Date contradiction veto
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_canonical_date_contradiction_vetoes_perfect_alias_bind():
    entity = _entity(
        ru_label="Адамс, Дуглас",
        ru_aliases=["Адамс, Дуглас Ноэль"],
        p106=["Q36180"],
        birth_years=(1952,),
        death_years=(2001,),
        enwiki="Douglas Adams",
    )
    fetcher = RoutingFetcher(
        [
            _search_route("Адамс, Дуглас", [_hit("Адамс, Дуглас", 42)]),
            _enrich_route([_page(42, "Адамс, Дуглас", en_langlink="Douglas Adams", qid="Q42")]),
        ]
    )
    wikidata = RoutingFetcher([_entities_route({"Q42": entity})])

    outcome = await search_fallback_resolve(
        ["Адамс, Дуглас"],
        birth_date=date(1952, 3, 11),
        death_date=date(1999, 1, 1),  # contradicts every P570 value
        fetcher=fetcher,
        wikidata=wikidata,
    )

    assert isinstance(outcome, UnresolvedIdentity)
    assert outcome.reason == REASON_NO_SAFE_MATCH


# ---------------------------------------------------------------------------
# Dumas père/fils fail-closed ambiguity
# ---------------------------------------------------------------------------


ADAMS_BINDER = _entity(ru_label="Дуглас Адамс", ru_aliases=["Адамс, Дуглас"], p106=["Q36180"])
PERE = _entity(
    ru_label="Александр Дюма",
    ru_aliases=["Дюма, Александр"],
    p106=["Q6625963"],
    enwiki="Alexandre Dumas",
)
FILS = _entity(
    ru_label="Александр Дюма-сын",
    ru_aliases=["Александр Дюма"],
    p106=["Q36180"],
    enwiki="Alexandre Dumas fils",
)


@pytest.mark.asyncio
async def test_dumas_double_bind_is_ambiguous_never_picked():
    """Both persons bind the bare editorial form exactly ⇒ fail-closed."""
    fetcher = RoutingFetcher(
        [
            _search_route(
                "Дюма, Александр",
                [
                    _hit("Дюма, Александр (отец)", 101),
                    _hit("Дюма, Александр (сын)", 102),
                ],
            ),
            _enrich_route(
                [
                    _page(101, "Дюма, Александр (отец)", en_langlink="Alexandre Dumas", qid="Q38337"),
                    _page(102, "Дюма, Александр (сын)", en_langlink="Alexandre Dumas fils", qid="Q169150"),
                ]
            ),
        ]
    )
    wikidata = RoutingFetcher([_entities_route({"Q38337": PERE, "Q169150": FILS})])

    outcome = await search_fallback_resolve(
        ["Дюма, Александр"], fetcher=fetcher, wikidata=wikidata
    )

    assert isinstance(outcome, UnresolvedIdentity)
    assert outcome.reason == REASON_AMBIGUOUS


@pytest.mark.asyncio
async def test_qualifier_variant_rejects_mismatched_and_under_specified_titles():
    """G3 both directions: qualified variant needs its qualifier; a qualified
    hit can never serve a qualifier-less variant (fils protection)."""
    fetcher = RoutingFetcher(
        [
            _search_route(
                "Дюма, Александр (сын)",
                [_hit("Дюма, Александр (отец)", 101), _hit("Дюма, Александр (сын)", 102)],
            ),
            _enrich_route(
                [
                    _page(101, "Дюма, Александр (отец)", en_langlink="Alexandre Dumas", qid="Q38337"),
                    _page(102, "Дюма, Александр (сын)", en_langlink="Alexandre Dumas fils", qid="Q169150"),
                ]
            ),
        ]
    )
    wikidata = RoutingFetcher([_entities_route({"Q38337": PERE, "Q169150": FILS})])

    outcome = await search_fallback_resolve(
        ["Дюма, Александр (сын)"], fetcher=fetcher, wikidata=wikidata
    )

    assert isinstance(outcome, ResolvedIdentity)
    assert outcome.ru_title == "Дюма, Александр (сын)"
    assert outcome.source_variant == "Дюма, Александр (сын)"


# ---------------------------------------------------------------------------
# Gate rejections
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_zero_token_overlap_hits_are_never_enriched():
    fetcher = RoutingFetcher(
        [
            _search_route("Хан Ган", [_hit("Совершенно другое", 21)]),
        ]
    )

    outcome = await search_fallback_resolve(["Хан Ган"], fetcher=fetcher)

    assert isinstance(outcome, UnresolvedIdentity)
    assert outcome.reason == REASON_NO_SAFE_MATCH
    # G4 admission filter kept every hit out: no enrichment request happened.
    assert len(fetcher.calls) == 1


@pytest.mark.asyncio
async def test_disambiguation_hit_rejected():
    entity = _entity(ru_label="Войнич, Этель Лилиан", p106=["Q36180"])
    fetcher = RoutingFetcher(
        [
            _search_route("Войнич, Этель Лилиан", [_hit("Войнич (значения)", 31)]),
            _enrich_route(
                [
                    _page(
                        31,
                        "Войнич (значения)",
                        en_langlink="Voynich (disambiguation)",
                        qid="Q999010",
                        disambiguation=True,
                    )
                ]
            ),
        ]
    )
    wikidata = RoutingFetcher([_entities_route({"Q999010": entity})])

    outcome = await search_fallback_resolve(
        ["Войнич, Этель Лилиан"], fetcher=fetcher, wikidata=wikidata
    )

    assert isinstance(outcome, UnresolvedIdentity)
    assert outcome.reason == REASON_NO_SAFE_MATCH


@pytest.mark.asyncio
async def test_non_human_entity_rejected_even_with_matching_name():
    """A work sharing the exact editorial spelling can never become identity."""
    manuscript = _entity(ru_label="Овод", ru_aliases=[], p31=["Q7725634"])  # literary work
    fetcher = RoutingFetcher(
        [
            _search_route("Овод", [_hit("Овод", 41)]),
            _enrich_route([_page(41, "Овод", en_langlink="The Gadfly", qid="Q123456")]),
        ]
    )
    wikidata = RoutingFetcher([_entities_route({"Q123456": manuscript})])

    outcome = await search_fallback_resolve(["Овод"], fetcher=fetcher, wikidata=wikidata)

    assert isinstance(outcome, UnresolvedIdentity)
    assert outcome.reason == REASON_NO_SAFE_MATCH


@pytest.mark.asyncio
async def test_label_binds_when_aliases_empty():
    """Han Kang pattern: zero aliases, ru label alone carries the bind."""
    entity = _entity(
        ru_label="Хан Ган",
        ru_aliases=[],
        p106=["Q36180", "Q6625963"],
        enwiki="Han Kang",
    )
    fetcher = RoutingFetcher(
        [
            _search_route("Хан Ган", [_hit("Хан Ган", 51)]),
            _enrich_route([_page(51, "Хан Ган", en_langlink="Han Kang", qid="Q5646626")]),
        ]
    )
    wikidata = RoutingFetcher([_entities_route({"Q5646626": entity})])

    outcome = await search_fallback_resolve(["Хан Ган"], fetcher=fetcher, wikidata=wikidata)

    assert isinstance(outcome, ResolvedIdentity)
    assert outcome.en_title == "Han Kang"
    assert outcome.fallback["corroboration"] == BIND_ALIAS


# ---------------------------------------------------------------------------
# Budget + robustness + determinism
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_budget_exhaustion_is_typed_and_fail_closed():
    fetcher = RoutingFetcher(
        [
            _search_route("Хан Ган", [_hit("Хан Ган", 51)]),
        ]
    )
    outcome = await search_fallback_resolve(
        ["Хан Ган"], max_requests=1, fetcher=fetcher
    )

    assert isinstance(outcome, UnresolvedIdentity)
    assert outcome.reason == REASON_BUDGET_EXHAUSTED
    assert len(fetcher.calls) == 1


@pytest.mark.asyncio
async def test_empty_variants_short_circuit_without_requests():
    fetcher = RoutingFetcher([])
    outcome = await search_fallback_resolve(["", "   "], fetcher=fetcher)
    assert isinstance(outcome, UnresolvedIdentity)
    assert outcome.reason == REASON_NO_CANDIDATES
    assert fetcher.calls == []


@pytest.mark.asyncio
async def test_result_order_permutation_invariance():
    """T23: ranking carries no weight — shuffled hits resolve identically."""

    async def run(hit_order):
        fetcher = RoutingFetcher(
            [
                _search_route("Адамс, Дуглас", hit_order),
                _enrich_route([_page(61, "Адамс, Дуглас", en_langlink="Douglas Adams", qid="Q42")]),
            ]
        )
        wikidata = RoutingFetcher([_entities_route({"Q42": ADAMS_BINDER})])
        result = await search_fallback_resolve(["Адамс, Дуглас"], fetcher=fetcher, wikidata=wikidata)
        return result

    first = await run([_hit("Шум сверху", 99), _hit("Адамс, Дуглас", 61)])
    second = await run([_hit("Адамс, Дуглас", 61), _hit("Шум сверху", 99)])
    assert isinstance(first, ResolvedIdentity) and isinstance(second, ResolvedIdentity)
    assert first.ru_title == second.ru_title == "Адамс, Дуглас"


@pytest.mark.asyncio
async def test_http_error_is_typed():
    class Boom(Exception):
        pass

    fetcher = RoutingFetcher([])
    fetcher.fetch = lambda url: (_ for _ in ()).throw(Boom("down"))  # type: ignore[method-assign]

    outcome = await search_fallback_resolve(["Хан Ган"], fetcher=fetcher)

    assert isinstance(outcome, UnresolvedIdentity)
    assert outcome.reason == REASON_HTTP_ERROR


# ---------------------------------------------------------------------------
# Host isolation contract
# ---------------------------------------------------------------------------


def test_host_allowlists_are_exact_and_separated():
    from app.syvai.discovery import ruwiki_fallback as fb

    assert fb.RUWIKI_ALLOWED_HOSTS == {"ru.wikipedia.org"}
    assert fb.WIKIDATA_ALLOWED_HOSTS == {"www.wikidata.org"}
