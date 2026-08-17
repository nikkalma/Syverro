"""Source Registry catalog invariants (SyvAI 0.3E).

Covers the rule set that keeps the registry safe and deterministic:
installed-adapter lockstep with the provider layer, approved+enabled-only
routing, GLOBAL supplementation, unknown-geography safety, family dedupe, and
deterministic ordering.
"""

from __future__ import annotations

from app.syvai.discovery.providers import ADAPTER_TO_PROVIDER
from app.syvai.registry import (
    GEO_SCOPE_GLOBAL,
    INSTALLED_ADAPTERS,
    SEEDED_REGISTRY,
)
from app.syvai.registry.routing import (
    SOURCE_POOL_MISSING,
    SOURCE_POOL_PARTIAL,
    SOURCE_POOL_READY,
    route_source_pool,
)


def test_installed_adapters_lockstep_with_provider_map():
    # The registry's installed-adapter set MUST equal the provider layer's
    # adapter->provider map, so no registry row can name an adapter that has no
    # hard-coded, allow-listed network path.
    assert INSTALLED_ADAPTERS == frozenset(ADAPTER_TO_PROVIDER)


def test_seed_contains_global_and_gb():
    families = {entry.source_family for entry in SEEDED_REGISTRY}
    scopes = {
        scope
        for entry in SEEDED_REGISTRY
        for scope in entry.geographies
    }
    assert GEO_SCOPE_GLOBAL in scopes
    assert "GB" in scopes
    assert {"wikipedia.org", "loc.gov", "archive.org"} <= families


def test_every_routable_seed_entry_has_installed_adapter():
    # approved + enabled entries are the only routable ones; they must bind to
    # an installed adapter.
    for entry in SEEDED_REGISTRY:
        if entry.approved and entry.enabled:
            assert entry.adapter in INSTALLED_ADAPTERS, entry.source_key


def test_gb_biography_pool_is_ready_and_approved_only():
    result = route_source_pool(("GB", "GLOBAL"), "BIOGRAPHY")
    assert result.state == SOURCE_POOL_READY
    assert result.runnable_providers == ("wikipedia",)
    assert result.families == ("wikipedia.org",)
    for entry in result.eligible:
        assert entry.approved and entry.enabled


def test_disabled_gb_candidates_never_route():
    result = route_source_pool(("GB", "GLOBAL"), "BIOGRAPHY")
    eligible_keys = {e.source_key for e in result.eligible}
    assert "britannica_gb" not in eligible_keys
    assert "openlibrary_gb" not in eligible_keys
    assert "british_library_gb" not in eligible_keys
    # They are declared as unavailable (documented), never runnable.
    unavailable_keys = {e.source_key for e in result.unavailable}
    assert "britannica_gb" in unavailable_keys
    assert result.runnable_providers == ("wikipedia",)


def test_unknown_geography_fails_safely_but_keeps_global():
    # An unknown geography with no GLOBAL scope must never trigger arbitrary
    # research-only registered sources apply...
    missing = route_source_pool(("ZZ",), "AWARDS")
    assert missing.state == SOURCE_POOL_MISSING
    assert missing.runnable_providers == ()
    bare = route_source_pool(("ZZ",), "BIOGRAPHY")
    assert bare.state == SOURCE_POOL_MISSING
    assert bare.runnable_providers == ()
    # ...yet when GLOBAL is in scope (as geographic_context always emits),
    # registered approved global sources still supplement covered domains.
    covered = route_source_pool(("ZZ", "GLOBAL"), "BIOGRAPHY")
    assert covered.state == SOURCE_POOL_READY
    assert covered.runnable_providers == ("wikipedia",)


def test_routing_is_deterministic():
    first = route_source_pool(("GB", "GLOBAL"), "BIBLIOGRAPHY")
    second = route_source_pool(("GB", "GLOBAL"), "BIBLIOGRAPHY")
    assert first.runnable_providers == second.runnable_providers
    assert first.families == second.families
    assert first.eligible == second.eligible


def test_unknown_adapter_produces_partial_not_ready():
    # A registry row naming an adapter that is NOT installed can never route.
    from app.syvai.registry.catalog import SourceRegistryEntry

    hostile = (
        SourceRegistryEntry(
            source_key="evil_row",
            display_name="Evil",
            geographies=("GLOBAL",),
            domains=("BIOGRAPHY",),
            authority_tier="high",
            source_family="evil.example",
            access_method="web_page",
            credentials_required=False,
            adapter="evil-discovery",
            approved=True,
            enabled=True,
        ),
    )
    result = route_source_pool(("GB", "GLOBAL"), "BIOGRAPHY", registry=hostile)
    assert result.state == SOURCE_POOL_PARTIAL
    assert result.runnable_providers == ()