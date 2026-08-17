"""Network-security boundary: a registry row can never expand network access.

Runtime permission is code-controlled. Each provider adapter owns a fixed host
allow-list (``WIKIPEDIA_ALLOWED_HOSTS`` etc.) enforced by ``SafeFetcher`` on
every request and redirect. Routing only ever selects *installed* adapters; a
registry entry containing ``family=evil.example`` or naming an unknown adapter
grants nothing.
"""

from __future__ import annotations

import pytest

from app.syvai.discovery.fetcher import FetcherConfig, SafeFetcher
from app.syvai.discovery.providers import (
    ADAPTER_TO_PROVIDER,
    WIKIPEDIA_ALLOWED_HOSTS,
    build_discovery_providers,
)
from app.syvai.errors import ConfigurationError, FetchError
from app.syvai.registry import INSTALLED_ADAPTERS
from app.syvai.registry.catalog import SourceRegistryEntry
from app.syvai.registry.routing import SOURCE_POOL_PARTIAL, route_source_pool


def _hostile_registry(source_key="evil_row", adapter="evil-discovery"):
    return (
        SourceRegistryEntry(
            source_key=source_key,
            display_name="Evil source",
            geographies=("GLOBAL",),
            domains=("BIOGRAPHY",),
            authority_tier="high",
            source_family="evil.example",
            access_method="web_page",
            credentials_required=False,
            adapter=adapter,
            approved=True,
            enabled=True,
        ),
    )


@pytest.mark.asyncio
async def test_safefetcher_rejects_non_allowlisted_host_without_network():
    fetcher = SafeFetcher(config=FetcherConfig(allowed_hosts=frozenset({"en.wikipedia.org"})))
    with pytest.raises(FetchError) as exc_info:
        await fetcher.fetch("https://evil.example/x")
    assert exc_info.value.code == "host_not_allowed"


def test_registry_row_citing_evil_family_grants_no_network_access():
    # Even an APPROVED+ENABLED row whose family is "evil.example" can only
    # resolve to the installed wikipedia adapter, whose fetcher allow-list is
    # the fixed wikipedia constant — the evil host is unreachable.
    hostile = _hostile_registry(adapter="wikipedia-discovery")
    result = route_source_pool(("GB", "GLOBAL"), "BIOGRAPHY", registry=hostile)
    assert result.runnable_providers == ("wikipedia",)

    providers = build_discovery_providers(
        provider_names=list(result.runnable_providers), require_enabled=False
    )
    assert len(providers) == 1
    allowed = providers[0]._fetcher.config.allowed_hosts
    assert allowed == WIKIPEDIA_ALLOWED_HOSTS
    assert "evil.example" not in allowed
    assert not any(host == "evil.example" for host in (allowed or set()))


def test_registry_row_naming_unknown_adapter_produces_partial_only():
    result = route_source_pool(("GB", "GLOBAL"), "BIOGRAPHY", registry=_hostile_registry())
    assert result.state == SOURCE_POOL_PARTIAL
    assert result.runnable_providers == ()
    # The eligible family is documented so partial coverage is never silent.
    assert result.families == ("evil.example",)


@pytest.mark.asyncio
async def test_even_approved_enabled_row_cannot_authorize_fetch():
    # Belt-and-braces: the routing result can never name the hostile adapter in
    # ``runnable_providers``, so a fetcher for it is never constructed; and if
    # someone tried to construct one for "evil", configuration rejects it.
    with pytest.raises(ConfigurationError):
        build_discovery_providers(provider_names=["evil"], require_enabled=False)


def test_network_permission_never_read_from_registry_data():
    for entry in _hostile_registry(adapter="wikipedia-discovery"):
        # The registry only encodes *which installed adapter* to use; the
        # adapter's hosts are code-level constants (providers.py) and the
        # registry carries no host allow-list that could be fed to SafeFetcher.
        assert "hosts" not in vars(entry)
        assert entry.source_family != entry.adapter


def test_installed_adapter_guard_sync_with_provider_map():
    assert INSTALLED_ADAPTERS == frozenset(ADAPTER_TO_PROVIDER)
    # No adapter may map to a provider the dispatcher cannot build.
    for adapter, provider in ADAPTER_TO_PROVIDER.items():
        assert provider in {"wikipedia", "loc", "archive"}