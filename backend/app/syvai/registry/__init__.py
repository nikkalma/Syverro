"""SyvAI 0.3E — Beta source registry + geography x domain routing.

Public surface:

  * ``catalog``   — the registered source pools (GLOBAL + GB) and invariants
  * ``geography`` — bounded geographic research context from structured fields
  * ``routing``   — deterministic routing to an eligible approved source pool
"""

from app.syvai.registry.catalog import (
    GEO_SCOPE_GLOBAL,
    INSTALLED_ADAPTERS,
    RESEARCH_DOMAINS,
    SEEDED_REGISTRY,
    SourceRegistryEntry,
)
from app.syvai.registry.geography import (
    coerce_country_code,
    geographic_context,
    ordered_geo_context,
)
from app.syvai.registry.metrics import beta_routing_metrics
from app.syvai.registry.routing import (
    SOURCE_POOL_MISSING,
    SOURCE_POOL_PARTIAL,
    SOURCE_POOL_READY,
    SOURCE_RECONNAISSANCE_DEFERRED,
    RouteResult,
    author_research_domains,
    route_author,
    route_source_pool,
)

__all__ = [
    "GEO_SCOPE_GLOBAL",
    "INSTALLED_ADAPTERS",
    "RESEARCH_DOMAINS",
    "SEEDED_REGISTRY",
    "SOURCE_POOL_MISSING",
    "SOURCE_POOL_PARTIAL",
    "SOURCE_POOL_READY",
    "SOURCE_RECONNAISSANCE_DEFERRED",
    "RouteResult",
    "SourceRegistryEntry",
    "author_research_domains",
    "beta_routing_metrics",
    "coerce_country_code",
    "geographic_context",
    "ordered_geo_context",
    "route_author",
    "route_source_pool",
]