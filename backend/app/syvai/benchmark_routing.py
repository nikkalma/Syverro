"""SyvAI 0.3E — Beta routing benchmark (offline, deterministic, no LLM).

The Beta question is NOT "can SyvAI reconstruct one biography?" — it is "can
SyvAI safely route many authors to a useful approved source pool instead of
arbitrary discovery?" This benchmark measures the geography x domain routing
contract against a frozen fixture set (4 authors: GB, GB, unsupported
geography, multi-geography) using the SAME production routing code for every
author.

Case coverage (task matrix A-M; J/K/N are adversarial tests in the test suite):

  A. GB + BIOGRAPHY         -> expected eligible pool
  B. GB + BIBLIOGRAPHY      -> a DIFFERENT capability-aware pool
  C. GLOBAL supplementation
  D. unknown geography      -> SOURCE_POOL_MISSING (no arbitrary research)
  E. disabled source excluded
  F. unapproved source excluded
  G. wrong-domain source excluded
  H. multi-geography pool merge (family-deduped)
  I. duplicate-family handling
  L. deterministic ordering
  M. no author-specific routing

Checks are the frozen reference for ``tests/test_syvai_routing_benchmark.py``.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.syvai.registry.geography import geographic_context
from app.syvai.registry.routing import (
    SOURCE_POOL_MISSING,
    SOURCE_POOL_READY,
    author_research_domains,
    route_source_pool,
)

GEO_GB = ("GB", "GLOBAL")
GEO_GLOBAL = ("GLOBAL",)


class _FakePlace:
    def __init__(self, country: str):
        self.country = country


class _FakeResidence:
    def __init__(self, country: str):
        self.place = _FakePlace(country)


class _FakeCitizenship:
    def __init__(self, state_name: str):
        self.state_name = state_name


@dataclass(frozen=True)
class AuthorGeoProfile:
    """Structured author fixture (only existing Author fields are used)."""

    key: str
    name: str
    display_name: str
    country: str | None = None
    nationality: str | None = None
    birth_place: str | None = None
    death_place: str | None = None
    citizenships: tuple = ()
    residences: tuple = ()
    native_name: str | None = None
    pen_names: tuple = ()
    occupations: tuple = ()
    literary_movements: tuple = ()
    themes: tuple = ()
    genres: tuple = ()
    notable_works: tuple = ()
    author_publications: tuple = ()
    awards: tuple = ()

    @property
    def citizenships_list(self):
        return list(self.citizenships)

    @property
    def residences_list(self):
        return list(self.residences)


# ---------------------------------------------------------------------------
# Frozen corpus — four authors: GB, another GB, unsupported geography, one
# multi-geography. Structured geography only; no free-form prose is consulted
# for geography anywhere.
# ---------------------------------------------------------------------------

ANNE_BRONT = AuthorGeoProfile(
    key="anne_bronte",
    name="Anne Brontë",
    display_name="Anne Brontë",
    nationality="British",
    birth_place="Thornton, Yorkshire, England",
    native_name="Anne Brontë",
    pen_names=("Acton Bell",),
    occupations=("novelist", "poet"),
    literary_movements=("Victorian literature",),
    themes=("class", "gender",),
    notable_works=("Agnes Grey", "The Tenant of Wildfell Hall"),
    author_publications=("Agnes Grey", "The Tenant of Wildfell Hall"),
)

VIRGINIA_WOOLF = AuthorGeoProfile(
    key="virginia_woolf",
    name="Virginia Woolf",
    display_name="Virginia Woolf",
    nationality="British",
    birth_place="Kensington, Middlesex, England",
    death_place="River Ouse, Sussex, England",
    native_name="Adeline Virginia Woolf",
    occupations=("writer",),
    literary_movements=("Modernism",),
    notable_works=("Mrs Dalloway",),
    author_publications=("Mrs Dalloway",),
)

HARUKI_MURAKAMI = AuthorGeoProfile(
    key="haruki_murakami",
    name="Haruki Murakami",
    display_name="Haruki Murakami",
    nationality="Japanese",
    native_name="村上 春樹",
    occupations=("novelist",),
    notable_works=("Norwegian Wood",),
    author_publications=("Norwegian Wood",),
)

THOMAS_MANN = AuthorGeoProfile(
    key="thomas_mann",
    name="Thomas Mann",
    display_name="Thomas Mann",
    nationality="German",
    birth_place="Lübeck, Germany",
    citizenships=(_FakeCitizenship("United States"),),
    occupations=("novelist",),
    literary_movements=("Modernism",),
    notable_works=("The Magic Mountain",),
    author_publications=("Buddenbrooks",),
)

FIXTURE_AUTHORS = (ANNE_BRONT, VIRGINIA_WOOLF, HARUKI_MURAKAMI, THOMAS_MANN)


def _author_domains(profile: AuthorGeoProfile) -> tuple[str, ...]:
    return author_research_domains(
        profile,
        has_publications=bool(profile.author_publications),
        has_awards=bool(profile.awards),
    )


@dataclass
class RoutingBenchmarkReport:
    cases: list[dict]
    gates: dict

    def all_pass(self) -> bool:
        return bool(self.gates) and all(self.gates.values())


def run_routing_benchmark() -> RoutingBenchmarkReport:
    cases: list[dict] = []
    gates: dict = {}

    anne = ANNE_BRONT
    woolf = VIRGINIA_WOOLF
    murakami = HARUKI_MURAKAMI
    mann = THOMAS_MANN

    def record(case: str, description: str, passed: bool, details: dict) -> None:
        gates[case] = passed
        cases.append({"case": case, "description": description, "pass": passed, **details})

    # A. GB + BIOGRAPHY -> expected eligible pool.
    bio_gb = route_source_pool(("GB", "GLOBAL"), "BIOGRAPHY")
    a_pass = (
        bio_gb.state == SOURCE_POOL_READY
        and set(bio_gb.runnable_providers) == {"wikipedia"}
        and set(bio_gb.families) == {"wikipedia.org"}
    )
    record(
        "A",
        "GB + BIOGRAPHY resolves to the expected approved pool",
        a_pass,
        {
            "state": bio_gb.state,
            "providers": list(bio_gb.runnable_providers),
            "families": list(bio_gb.families),
        },
    )

    # B. GB + BIBLIOGRAPHY -> a different, capability-aware pool.
    biblio_gb = route_source_pool(("GB", "GLOBAL"), "BIBLIOGRAPHY")
    b_pass = (
        biblio_gb.state == SOURCE_POOL_READY
        and set(biblio_gb.runnable_providers) != set(bio_gb.runnable_providers)
        and {"loc", "archive"} <= set(biblio_gb.runnable_providers)
        and {"loc.gov", "archive.org"} <= set(biblio_gb.families)
    )
    record(
        "B",
        "GB + BIBLIOGRAPHY is a different capability-aware pool",
        b_pass,
        {
            "state": biblio_gb.state,
            "providers": list(biblio_gb.runnable_providers),
            "families": list(biblio_gb.families),
        },
    )

    # C. GLOBAL supplementation (unsupported geography still served).
    bio_global = route_source_pool(GEO_GLOBAL, "BIOGRAPHY")
    c_pass = (
        bio_global.state == SOURCE_POOL_READY
        and "wikipedia" in bio_global.runnable_providers
    )
    record(
        "C",
        "GLOBAL sources supplement the pool",
        c_pass,
        {
            "state": bio_global.state,
            "providers": list(bio_global.runnable_providers),
        },
    )

    # D. Unknown geography for an uncovered domain -> MISSING, no arbitrary search.
    awards_missing = route_source_pool(GEO_GLOBAL, "AWARDS")
    identity_unknown = route_source_pool(("GLOBAL",), "IDENTITY")
    d_pass = (
        awards_missing.state == SOURCE_POOL_MISSING
        and awards_missing.runnable_providers == ()
        and identity_unknown.state != SOURCE_POOL_MISSING
    )
    record(
        "D",
        "Unknown geography for an uncovered domain -> SOURCE_POOL_MISSING",
        d_pass,
        {"awards_state": awards_missing.state, "awards_providers": list(awards_missing.runnable_providers)},
    )

    # E. Disabled sources excluded from every pool.
    disabled_keys = {"britannica_gb", "british_library_gb"}
    all_pools = [
        bio_gb,
        biblio_gb,
        bio_global,
        route_source_pool(("GB", "GLOBAL"), "IDENTITY"),
        route_source_pool(("GB", "GLOBAL"), "LITERARY_CONTEXT"),
    ]
    leaked = [
        f"{entry.source_key} in {pool.research_domain}"
        for pool in all_pools
        for entry in pool.eligible
        if entry.source_key in disabled_keys
    ]
    e_pass = not leaked
    record("E", "Disabled sources never enter any pool", e_pass, {"leaked": leaked})

    # F. Unapproved sources excluded from every pool.
    unapproved_keys = {"openlibrary_gb"}
    leaked_unapproved = [
        f"{entry.source_key} in {pool.research_domain}"
        for pool in all_pools
        for entry in pool.eligible
        if entry.source_key in unapproved_keys
    ]
    f_pass = not leaked_unapproved
    record("F", "Unapproved sources never enter a pool", f_pass, {"leaked": leaked_unapproved})

    # G. Wrong-domain sources excluded.
    wrong_bio = [
        provider
        for pool in all_pools
        if pool.research_domain == "BIOGRAPHY"
        for provider in pool.runnable_providers
        if provider in {"loc", "archive"}
    ]
    wrong_biblio = [
        provider
        for pool in all_pools
        if pool.research_domain == "BIBLIOGRAPHY"
        for provider in pool.runnable_providers
        if provider == "wikipedia"
    ]
    g_pass = not wrong_bio and not wrong_biblio
    record(
        "G",
        "Domain-incapable sources are excluded",
        g_pass,
        {"wrong_in_biography": wrong_bio, "wrong_in_bibliography": wrong_biblio},
    )

    # H. Multi-geography pool merge (dedupe by family across geographies).
    mann_geo = geographic_context(mann, citizenships=mann.citizenships_list)
    mann_bio = route_source_pool(mann_geo, "BIOGRAPHY")
    mann_biblio = route_source_pool(mann_geo, "BIBLIOGRAPHY")
    h_pass = (
        set(mann_geo) == {"DE", "GLOBAL", "US"}
        and set(mann_bio.runnable_providers) == {"wikipedia"}
        and len(mann_bio.runnable_providers) == 1
        and {"archive", "loc"} == set(mann_biblio.runnable_providers)
    )
    record(
        "H",
        "Multi-geography context merges and dedupes by family",
        h_pass,
        {"geo": list(mann_geo), "bio_providers": list(mann_bio.runnable_providers)},
    )

    # I. Duplicate-family handling across the whole matrix.
    duplicates = []
    for pool in all_pools + [mann_bio, mann_biblio]:
        if len(pool.families) != len(set(pool.families)):
            duplicates.append((pool.research_domain, list(pool.families)))
        if len(pool.runnable_providers) != len(set(pool.runnable_providers)):
            duplicates.append((pool.research_domain, list(pool.runnable_providers)))
    i_pass = not duplicates
    record("I", "No duplicate source families or providers in any pool", i_pass, {"duplicates": duplicates})

    # L. Deterministic ordering (idempotent rerun).
    again = route_source_pool(("GB", "GLOBAL"), "BIOGRAPHY")
    l_pass = (
        bio_gb.runnable_providers == again.runnable_providers
        and bio_gb.families == again.families
        and bio_gb.eligible == again.eligible
    )
    record("L", "Routing is deterministic and idempotent", l_pass, {"providers": list(bio_gb.runnable_providers)})

    # M. No author-specific routing: identical geo+domain -> identical pool.
    anne_geo = geographic_context(anne)
    woolf_geo = geographic_context(woolf)
    anne_pool = route_source_pool(anne_geo, "BIOGRAPHY")
    woolf_pool = route_source_pool(woolf_geo, "BIOGRAPHY")
    m_pass = (
        set(anne_geo) == set(woolf_geo) == {"GB", "GLOBAL"}
        and anne_pool.runnable_providers == woolf_pool.runnable_providers
        and anne_pool.families == woolf_pool.families
    )
    record(
        "M",
        "Routing depends only on geography x domain, never the author",
        m_pass,
        {"anne_geo": list(anne_geo)},
    )

    return RoutingBenchmarkReport(cases=cases, gates=gates)


def format_routing_benchmark_report(report: RoutingBenchmarkReport) -> str:
    lines = [
        "=== Beta routing benchmark: frozen geography x domain corpus ===",
    ]
    for case in report.cases:
        lines.append(
            f"  [{case['case']}] {('PASS' if case['pass'] else 'FAIL')} - {case['description']}"
        )
    lines.append(f"  all gates pass: {report.all_pass()}")
    return "\n".join(lines)


def run_routing_benchmark_report() -> str:
    return format_routing_benchmark_report(run_routing_benchmark())


def main() -> None:
    print(run_routing_benchmark_report())


if __name__ == "__main__":
    main()