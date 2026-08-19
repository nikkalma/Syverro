"""SyvAI 0.3E — deterministic geography x research-domain routing.

The routing contract is exactly:

    geography x research_domain -> eligible approved source pool

Pure and deterministic: no author identity, no author name, no web search, no
LLM. Two authors sharing a geography+domain always receive the identical pool.

Required pool states (explicit, never silent):

  * ``SOURCE_POOL_READY``   — at least one approved + enabled source resolves to
                              an installed adapter, so research may run.
  * ``SOURCE_POOL_PARTIAL`` — entries are registered for this geography+domain
                              but none are usable (unapproved / disabled /
                              adapter not installed); research must not invent
                              new sources.
  * ``SOURCE_POOL_MISSING`` — no registered source at all for this
                              geography+domain; unknown geography fails safely.

Rules enforced here:

  * only ``approved`` AND ``enabled`` entries are eligible;
  * ``GLOBAL`` sources supplement country-specific coverage;
  * duplicate source families collapse into a single pool entry (a family can
    never inflate corroboration or be researched twice);
  * ordering is deterministic (authority tier, then family, then key);
  * routing returns only *installed* adapters; a registry row naming an
    unknown adapter never routes and never grants network access.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.syvai.discovery.providers import ADAPTER_TO_PROVIDER
from app.syvai.registry.catalog import (
    INSTALLED_ADAPTERS,
    RESEARCH_DOMAINS,
    SourceRegistryEntry,
    registry_entries,
)

SOURCE_POOL_READY = "SOURCE_POOL_READY"
SOURCE_POOL_PARTIAL = "SOURCE_POOL_PARTIAL"
SOURCE_POOL_MISSING = "SOURCE_POOL_MISSING"

# Reconnaissance for uncovered geographies is out of Beta scope. Deferred is
# the explicit, documented stance for any MISSING pool.
SOURCE_RECONNAISSANCE_DEFERRED = "SOURCE_RECONNAISSANCE_DEFERRED"

_DOMAIN_ORDER = {domain: index for index, domain in enumerate(RESEARCH_DOMAINS)}


@dataclass(frozen=True)
class RouteResult:
    """Result of routing one (geographic context, research domain).

    ``eligible`` are the approved+enabled entries after family deduplication;
    ``runnable_adapters``/``runnable_providers`` are what research may actually
    execute (installed adapters only); ``unavailable`` documents registered
    entries that were NOT usable (so partial coverage is never silent).
    """

    geographic_context: tuple[str, ...]
    research_domain: str
    state: str
    eligible: tuple[SourceRegistryEntry, ...]
    runnable_adapters: tuple[str, ...]
    runnable_providers: tuple[str, ...]
    families: tuple[str, ...]
    unavailable: tuple[SourceRegistryEntry, ...]

    def summary(self) -> dict:
        return {
            "state": self.state,
            "geographic_context": list(self.geographic_context),
            "research_domain": self.research_domain,
            "sources": [entry.source_key for entry in self.eligible],
            "source_families": list(self.families),
            "runnable_adapters": list(self.runnable_adapters),
            "runnable_providers": list(self.runnable_providers),
            "unavailable": [
                {
                    "source_key": entry.source_key,
                    "reason": _availability_reason(entry),
                }
                for entry in self.unavailable
            ],
        }


def _availability_reason(entry: SourceRegistryEntry) -> str:
    if entry.adapter is None:
        return "adapter_not_installed"
    if not entry.approved:
        return "not_approved"
    if not entry.enabled:
        return "disabled"
    return "not_installed_adapter"


def _entry_sort_key(entry: SourceRegistryEntry):
    return (entry.authority_tier, entry.source_family, entry.source_key)


def _entry_order(entry: SourceRegistryEntry):
    tier_weight = {"high": 0, "medium": 1, "low": 2, "unknown": 3}.get(
        entry.authority_tier, 4
    )
    return (tier_weight, entry.source_family, entry.source_key)


def route_source_pool(
    geographic_context,
    research_domain: str,
    *,
    registry=None,
) -> RouteResult:
    """Route ``geographic_context`` x ``research_domain`` to a source pool.

    Deterministic and author-independent: callers pass only geography scopes and
    a research domain, never an author identity.
    """
    entries: tuple[SourceRegistryEntry, ...] = (
        tuple(registry) if registry is not None else registry_entries()
    )
    scopes = set(geographic_context)

    matched = [
        entry
        for entry in entries
        if research_domain in entry.domains and (scopes & set(entry.geographies))
    ]

    approved_enabled = [
        entry for entry in matched if entry.approved and entry.enabled
    ]

    # Deterministic ordering first, then dedupe by family so no family can
    # appear twice (e.g. the same family registered for multiple geographies).
    ordered = sorted(approved_enabled, key=_entry_order)
    deduped: list[SourceRegistryEntry] = []
    seen_families: set[str] = set()
    for entry in ordered:
        if entry.source_family in seen_families:
            continue
        seen_families.add(entry.source_family)
        deduped.append(entry)

    runnable = [
        entry
        for entry in deduped
        if entry.adapter is not None and entry.adapter in INSTALLED_ADAPTERS
    ]
    runnable_adapters = tuple(entry.adapter for entry in runnable)
    runnable_providers = tuple(ADAPTER_TO_PROVIDER[entry.adapter] for entry in runnable)

    unavailable = [entry for entry in matched if entry not in runnable]

    if runnable_providers:
        state = SOURCE_POOL_READY
    elif matched:
        state = SOURCE_POOL_PARTIAL
    else:
        state = SOURCE_POOL_MISSING

    return RouteResult(
        geographic_context=tuple(geographic_context),
        research_domain=research_domain,
        state=state,
        eligible=tuple(deduped),
        runnable_adapters=runnable_adapters,
        runnable_providers=runnable_providers,
        families=tuple(sorted(seen_families)),
        unavailable=tuple(sorted(unavailable, key=_entry_sort_key)),
    )


def _field_nonempty(value) -> bool:
    return value not in (None, "", [], {})


def author_research_domains(
    author,
    *,
    has_publications: bool = False,
    has_awards: bool = False,
) -> tuple[str, ...]:
    """Derive the author's research domains from existing Author fields.

    This is the exact ``research_domain -> Author fields`` mapping; domains are
    only produced for fields that already exist on the Author model.
    """
    domains: set[str] = set()

    biography_fields = (
        "birth_date",
        "death_date",
        "birth_place",
        "death_place",
        "birth_year",
        "death_year",
        "bio",
        "occupations",
        "active_from_year",
        "active_to_year",
    )
    identity_fields = (
        "native_name",
        "birth_name",
        "pen_names",
        "pseudonyms",
        "nationality",
        "country",
        "languages",
        "gender",
        "ethnic_origin",
        "cultural_identity",
    )
    literary_fields = (
        "literary_movements",
        "genres",
        "themes",
        "motifs",
        "concepts",
        "atmospheres",
        "writing_languages",
    )

    if any(_field_nonempty(getattr(author, field, None)) for field in biography_fields):
        domains.add("BIOGRAPHY")
    if any(_field_nonempty(getattr(author, field, None)) for field in identity_fields):
        domains.add("IDENTITY")
    if has_publications or _field_nonempty(getattr(author, "notable_works", None)):
        domains.add("BIBLIOGRAPHY")
    if any(_field_nonempty(getattr(author, field, None)) for field in literary_fields):
        domains.add("LITERARY_CONTEXT")
    if has_awards:
        domains.add("AWARDS")

    return tuple(sorted(domains, key=_DOMAIN_ORDER.__getitem__))


def route_author(
    author,
    research_domain: str,
    *,
    citizenships=None,
    residences=None,
    registry=None,
) -> RouteResult:
    """Route a full author for one research domain (geo derived from structure).

    Convenience for the report/API path; the routing itself stays pure and
    author-independent (only geography is derived from the author record).
    """
    from app.syvai.registry.geography import geographic_context

    geo = geographic_context(
        author, citizenships=citizenships, residences=residences
    )
    return route_source_pool(geo, research_domain, registry=registry)