"""SyvAI 0.2A — bounded source discovery.

Public surface of the discovery layer: providers, the safe fetcher, the
orchestrating service, and read-only status helpers. Everything network-facing
is confined to this package and gated by configuration.
"""

from app.syvai.discovery.fetcher import FetcherConfig, FetchedPage, SafeFetcher
from app.syvai.discovery.providers import (
    FakeDiscoveryProvider,
    SourceDiscoveryProvider,
    WikipediaDiscoveryProvider,
    build_discovery_provider,
    discovery_provider_status,
)
from app.syvai.discovery.service import (
    DOMAIN,
    DiscoveryOutcome,
    approve_candidate,
    discovery_metrics,
    reject_candidate,
    run_discovery,
)

__all__ = [
    "DOMAIN",
    "DiscoveryOutcome",
    "FakeDiscoveryProvider",
    "FetcherConfig",
    "FetchedPage",
    "SafeFetcher",
    "SourceDiscoveryProvider",
    "WikipediaDiscoveryProvider",
    "approve_candidate",
    "build_discovery_provider",
    "discovery_metrics",
    "discovery_provider_status",
    "reject_candidate",
    "run_discovery",
]
