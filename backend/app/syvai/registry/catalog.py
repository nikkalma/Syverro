"""SyvAI 0.3E — Beta source registry (configuration-backed).

The registry is the *only* definition of where SyvAI is allowed to research:

    geography x research_domain -> approved source pool

It is deliberately NOT a database table: the registry is curated configuration
code, so no schema migration is required and no runtime row can silently expand
network permissions.  Runtime network access remains code-controlled: each
entry binds to an *installed* provider adapter, and every adapter carries its
own fixed host allow-list (see ``app.syvai.discovery.providers`` and
``app.syvai.discovery.fetcher``).  A registry row claiming a foreign host never
authorizes ``SafeFetcher`` to contact it.

Semantics per entry:

  * ``geographies``   — the geographic scopes this source serves. ``GLOBAL``
                        marks a supplement available to every geography.
  * ``domains``       — the research domains this source is *capable* of
                        supporting. Capability is explicit (0.3D lesson: catalog
                        metadata is BIBLIOGRAPHY-grade, not BIOGRAPHY-grade).
  * ``approved``      — human-declared readiness. Unapproved entries never route.
  * ``enabled``       — operational switch. Disabled entries never route.
  * ``adapter``       — the installed provider adapter id that performs the
                        research, or ``None`` for declared-but-uninstalled
                        candidates (kept for the future pool but never routed).

Duplicate source families must not inflate corroboration: routing dedupes by
``source_family`` before any pool is returned.
"""

from __future__ import annotations

from dataclasses import dataclass

GEO_SCOPE_GLOBAL = "GLOBAL"

# Beta research domains, derived ONLY from fields already present on the Author
# model (see ``routing.author_research_domains`` for the exact field mapping).
RESEARCH_DOMAINS = (
    "BIOGRAPHY",
    "IDENTITY",
    "BIBLIOGRAPHY",
    "LITERARY_CONTEXT",
    "AWARDS",
)

# Installed provider adapters that MAY be routed. This set is deliberately in
# sync with ``app.syvai.discovery.providers.ADAPTER_TO_PROVIDER``; a guard test
# asserts the two stay identical, so a hypothetical registry row can never name
# an adapter that has no hard-coded, allow-listed network path.
INSTALLED_ADAPTERS = frozenset(
    {"wikipedia-discovery", "loc-discovery", "archive-discovery"}
)


@dataclass(frozen=True)
class SourceRegistryEntry:
    """One registered source pool entry (immutable, deterministic)."""

    source_key: str
    display_name: str
    geographies: tuple[str, ...]
    domains: tuple[str, ...]
    authority_tier: str
    source_family: str
    access_method: str
    credentials_required: bool
    adapter: str | None
    approved: bool
    enabled: bool
    notes: str = ""


# ---------------------------------------------------------------------------
# Initial bundled registry — GLOBAL + GB only (prove the architecture; do not
# attempt worldwide coverage).
# ---------------------------------------------------------------------------

SEEDED_REGISTRY: tuple[SourceRegistryEntry, ...] = (
    SourceRegistryEntry(
        source_key="wikipedia_global",
        display_name="English Wikipedia",
        geographies=(GEO_SCOPE_GLOBAL,),
        domains=("BIOGRAPHY", "IDENTITY", "LITERARY_CONTEXT"),
        authority_tier="medium",
        source_family="wikipedia.org",
        access_method="official_search_api",
        credentials_required=False,
        adapter="wikipedia-discovery",
        approved=True,
        enabled=True,
        notes=(
            "Encyclopedic lead paragraphs. Medium authority by policy; "
            "candidates always require human review, never auto-approve."
        ),
    ),
    SourceRegistryEntry(
        source_key="loc_global",
        display_name="Library of Congress",
        geographies=(GEO_SCOPE_GLOBAL,),
        domains=("BIBLIOGRAPHY",),
        authority_tier="high",
        source_family="loc.gov",
        access_method="official_json_api",
        credentials_required=False,
        adapter="loc-discovery",
        approved=True,
        enabled=True,
        notes=(
            "Catalog/metadata records. Capability-limited to BIBLIOGRAPHY: the "
            "0.3D run showed a high-authority LOC record adds a family but zero "
            "biographical coverage, so LOC is never routed for BIOGRAPHY."
        ),
    ),
    SourceRegistryEntry(
        source_key="archive_global",
        display_name="Internet Archive",
        geographies=(GEO_SCOPE_GLOBAL,),
        domains=("BIBLIOGRAPHY", "LITERARY_CONTEXT"),
        authority_tier="high",
        source_family="archive.org",
        access_method="official_search_api",
        credentials_required=False,
        adapter="archive-discovery",
        approved=True,
        enabled=True,
        notes="Full-text and catalog records; useful for works and context.",
    ),
    # --- GB candidates. Declared so the GB pool blueprint exists, but all are
    # --- unavailable for 0.3E: adapters are not installed and/or the source is
    # --- not human-approved. They must never be routed.
    SourceRegistryEntry(
        source_key="openlibrary_gb",
        display_name="Open Library",
        geographies=("GB", GEO_SCOPE_GLOBAL),
        domains=("BIBLIOGRAPHY",),
        authority_tier="high",
        source_family="openlibrary.org",
        access_method="official_json_api",
        credentials_required=False,
        adapter=None,
        approved=False,
        enabled=False,
        notes="Candidate for the GB BIBLIOGRAPHY pool; adapter not installed.",
    ),
    SourceRegistryEntry(
        source_key="britannica_gb",
        display_name="Encyclopaedia Britannica",
        geographies=("GB",),
        domains=("BIOGRAPHY", "IDENTITY", "LITERARY_CONTEXT"),
        authority_tier="high",
        source_family="britannica.com",
        access_method="web_page",
        credentials_required=False,
        adapter=None,
        approved=False,
        enabled=False,
        notes="Candidate for the GB BIOGRAPHY pool; adapter not installed.",
    ),
    SourceRegistryEntry(
        source_key="british_library_gb",
        display_name="British Library",
        geographies=("GB",),
        domains=("BIBLIOGRAPHY",),
        authority_tier="high",
        source_family="bl.uk",
        access_method="catalog_api",
        credentials_required=True,
        adapter=None,
        approved=False,
        enabled=False,
        notes=(
            "GB national catalog; the official catalogue API is credential-gated "
            "and is not wired to any adapter for 0.3E."
        ),
    ),
)


def registry_entries() -> tuple[SourceRegistryEntry, ...]:
    """Return the immutable seeded registry (stable identity for callers)."""
    return SEEDED_REGISTRY