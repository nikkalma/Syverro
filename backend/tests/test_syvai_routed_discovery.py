"""Routed discovery integration (SyvAI 0.3E): failure isolation + input bounds."""

from __future__ import annotations

from uuid import uuid4

import pytest

from app.syvai.discovery import run_discovery
from app.syvai.discovery.providers import FakeDiscoveryProvider, build_discovery_providers
from app.syvai.registry import route_author
from app.syvai.registry.routing import route_source_pool


class _FakeResult:
    def __init__(self, rows):
        self._rows = rows

    def scalars(self):
        return self

    def all(self):
        return self._rows

    def scalar_one_or_none(self):
        return self._rows[0] if self._rows else None

    def scalar(self):
        return self._rows[0] if self._rows else None


class _FakeSession:
    def __init__(self):
        self.added = []
        self.committed = False

    async def execute(self, query):
        return _FakeResult([])

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        for obj in self.added:
            if getattr(obj, "id", None) is None:
                obj.id = uuid4()

    async def commit(self):
        self.committed = True

    async def refresh(self, obj):
        pass


def _author(name="Anne Brontë", **extra):
    attrs = {"id": uuid4(), "name": name, "display_name": name}
    attrs.update(extra)
    return type("A", (), attrs)()


@pytest.mark.asyncio
async def test_routed_provider_failure_is_isolated():
    class FailingProvider:
        name = "failing-discovery"

        async def discover(self, author, terms):
            raise RuntimeError("boom")

    session = _FakeSession()
    outcome = await run_discovery(
        session,
        _author(nationality="British"),
        [FakeDiscoveryProvider(), FailingProvider()],
    )

    assert outcome.error is None
    assert outcome.providers_attempted == 2
    assert outcome.providers_succeeded == 1
    assert outcome.providers_failed == 1
    assert len(outcome.candidates) == 5
    assert session.committed is True
    # Some fake candidates need review, so the run is review_needed, not failed.
    assert outcome.run.status == "review_needed"


@pytest.mark.asyncio
async def test_provider_input_contains_only_identity_no_benchmark_truth():
    author = _author("Anne Brontë", nationality="British")
    pool = route_author(author, "BIOGRAPHY")
    assert pool.runnable_providers == ("wikipedia",)

    provider = FakeDiscoveryProvider()
    outcome = await run_discovery(_FakeSession(), author, [provider])

    assert outcome.error is None
    assert len(provider.calls) == 1
    terms = provider.calls[0][1]
    # The provider prompt/search input is ONLY the author identity — never any
    # benchmark/reference dates, places, or titles.
    assert terms == ["Anne Brontë"]
    assert not any(
        token in term
        for term in terms
        for token in ("1820", "1849", "1847", "Agnes Grey", "Scarborough")
    )


def test_build_providers_from_routed_pool_uses_only_routed_adapters():
    pool = route_source_pool(("GB", "GLOBAL"), "BIOGRAPHY")
    providers = build_discovery_providers(
        provider_names=list(pool.runnable_providers), require_enabled=False
    )
    assert [provider.name for provider in providers] == ["wikipedia-discovery"]


def test_unroutable_domain_never_builds_providers():
    pool = route_source_pool(("GB", "GLOBAL"), "AWARDS")
    assert pool.runnable_providers == ()
    # An empty routed pool is an explicit bounded state — never a fallback.
    # Asking to build providers for it is a configuration error, not a silent
    # arbitrary-host search.
    from app.syvai.errors import ConfigurationError

    with pytest.raises(ConfigurationError):
        build_discovery_providers(
            provider_names=list(pool.runnable_providers), require_enabled=False
        )