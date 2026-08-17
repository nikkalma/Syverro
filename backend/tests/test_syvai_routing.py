"""Deterministic geography x domain routing (SyvAI 0.3E)."""

from __future__ import annotations

from app.syvai.discovery.providers import ADAPTER_TO_PROVIDER
from app.syvai.registry import (
    SOURCE_POOL_MISSING,
    SOURCE_POOL_READY,
    route_author,
    route_source_pool,
)
from app.syvai.registry.routing import author_research_domains


def _author(**kwargs):
    defaults = {"name": "Author", "display_name": "Author"}
    defaults.update(kwargs)
    return type("A", (), defaults)()


def test_capability_aware_pools_differ_by_domain():
    bio = route_source_pool(("GB", "GLOBAL"), "BIOGRAPHY")
    biblio = route_source_pool(("GB", "GLOBAL"), "BIBLIOGRAPHY")
    assert bio.runnable_providers == ("wikipedia",)
    assert biblio.runnable_providers == ("archive", "loc")
    assert set(bio.families) != set(biblio.families)
    assert bio.state == SOURCE_POOL_READY
    assert biblio.state == SOURCE_POOL_READY


def test_literary_context_pool():
    pool = route_source_pool(("GB", "GLOBAL"), "LITERARY_CONTEXT")
    assert set(pool.runnable_providers) == {"archive", "wikipedia"}
    assert set(pool.families) == {"archive.org", "wikipedia.org"}


def test_identity_pool():
    pool = route_source_pool(("GB", "GLOBAL"), "IDENTITY")
    assert pool.runnable_providers == ("wikipedia",)
    assert pool.state == SOURCE_POOL_READY


def test_awards_pool_missing_for_all_geographies():
    for geo in (("GB", "GLOBAL"), ("GLOBAL",)):
        pool = route_source_pool(geo, "AWARDS")
        assert pool.state == SOURCE_POOL_MISSING
        assert pool.runnable_providers == ()
        assert pool.families == ()


def test_adapter_names_map_to_installed_providers():
    bio = route_source_pool(("GB", "GLOBAL"), "BIOGRAPHY")
    assert bio.runnable_adapters == ("wikipedia-discovery",)
    for adapter in bio.runnable_adapters:
        assert adapter in ADAPTER_TO_PROVIDER


def test_routing_ignores_author_identity():
    # Routing is a pure (geography x domain) computation.
    author_a = _author(name="One", display_name="One", nationality="British")
    author_b = _author(name="Two", display_name="Two", nationality="British")
    pool_a = route_author(author_a, "BIOGRAPHY")
    pool_b = route_author(author_b, "BIOGRAPHY")
    assert pool_a.runnable_providers == pool_b.runnable_providers
    assert pool_a.families == pool_b.families


def test_route_author_derives_geography_from_structure():
    author = _author(nationality="German")
    pool = route_author(author, "BIOGRAPHY")
    assert pool.geographic_context == ("DE", "GLOBAL")
    assert pool.runnable_providers == ("wikipedia",)


def test_route_author_unsupported_geography_still_served_by_global():
    author = _author(nationality="Japanese")
    pool = route_author(author, "BIOGRAPHY")
    assert pool.state == SOURCE_POOL_READY
    assert "wikipedia" in pool.runnable_providers


def test_wikipedia_never_in_bibliography_pool():
    pool = route_source_pool(("GB", "GLOBAL"), "BIBLIOGRAPHY")
    assert "wikipedia" not in pool.runnable_providers


def test_loc_and_archive_never_in_biography_pool():
    pool = route_source_pool(("GB", "GLOBAL"), "BIOGRAPHY")
    assert not ({"loc", "archive"} & set(pool.runnable_providers))