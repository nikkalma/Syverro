"""ru.wikipedia -> EN identity bootstrap: resolver and service wiring (offline)."""

from __future__ import annotations

import json
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

import pytest

from app.config import settings
from app.syvai.discovery import langlinks
from app.syvai.discovery.langlinks import (
    REASON_AMBIGUOUS,
    REASON_HTTP_ERROR,
    REASON_INVALID_JSON,
    REASON_NO_CANDIDATES,
    REASON_NO_LANGLINK,
    ResolvedIdentity,
    UnresolvedIdentity,
    resolve_en_identity,
)
from app.syvai.discovery.service import run_discovery
from app.syvai.discovery.providers import FakeDiscoveryProvider


class StubFetcher:
    """Offline stand-in for SafeFetcher; records requested URLs."""

    def __init__(self, payload=None, *, error=None, text=None):
        self.payload = payload or {}
        self.error = error
        self.text = text
        self.urls: list[str] = []

    async def fetch(self, url):
        self.urls.append(url)
        if self.error is not None:
            raise self.error
        body = self.text if self.text is not None else json.dumps(self.payload)
        return SimpleNamespace(text=body)


def _api_response(*, normalized=None, redirects=None, pages=None):
    query: dict = {"pages": pages or []}
    if normalized:
        query["normalized"] = [{"from": f, "to": t} for f, t in normalized]
    if redirects:
        query["redirects"] = [{"from": f, "to": t} for f, t in redirects]
    return {"query": query}


def _page(title, *, langlink=None, disambiguation=False, missing=False):
    page: dict = {"title": title, "ns": 0}
    if missing:
        page["missing"] = True
    if disambiguation:
        page["pageprops"] = {"disambiguation": ""}
    if langlink:
        page["langlinks"] = [{"lang": "en", "title": langlink}]
    return page


@pytest.mark.asyncio
async def test_resolves_via_normalization_and_redirect_with_provenance():
    fetcher = StubFetcher(
        _api_response(
            normalized=[("дуглас адамс", "Дуглас Адамс")],
            redirects=[("Дуглас Адамс", "Адамс, Дуглас")],
            pages=[_page("Адамс, Дуглас", langlink="Douglas Adams")],
        )
    )

    outcome = await resolve_en_identity(
        ["дуглас адамс", "Адамс, Дуглас"], fetcher=fetcher
    )

    assert isinstance(outcome, ResolvedIdentity)
    assert outcome.source_variant == "дуглас адамс"
    assert outcome.ru_title == "Адамс, Дуглас"
    assert outcome.en_title == "Douglas Adams"
    assert outcome.en_url == "https://en.wikipedia.org/wiki/Douglas_Adams"
    assert outcome.romanized_terms == ("Douglas Adams",)
    assert outcome.provenance() == {
        "source_variant": "дуглас адамс",
        "ru_title": "Адамс, Дуглас",
        "en_title": "Douglas Adams",
        "en_url": "https://en.wikipedia.org/wiki/Douglas_Adams",
        "method": "exact_title",
    }
    # ONE request carrying ALL variants (bounded, deterministic).
    assert len(fetcher.urls) == 1
    assert "titles=" in fetcher.urls[0]
    assert "%D0%90%D0%B4%D0%B0%D0%BC%D1%81" in fetcher.urls[0]  # Адамс present


@pytest.mark.asyncio
async def test_missing_variants_do_not_block_resolution():
    fetcher = StubFetcher(
        _api_response(
            pages=[
                _page("Несуществующая страница", missing=True),
                _page("Войнич, Этель Лилиан", langlink="Ethel Lilian Voynich"),
            ]
        )
    )

    outcome = await resolve_en_identity(
        ["Несуществующая страница", "Войнич, Этель Лилиан"], fetcher=fetcher
    )

    assert isinstance(outcome, ResolvedIdentity)
    assert outcome.source_variant == "Войнич, Этель Лилиан"
    assert outcome.en_title == "Ethel Lilian Voynich"


@pytest.mark.asyncio
async def test_disambiguation_page_never_resolves():
    fetcher = StubFetcher(
        _api_response(pages=[_page("Дюма (значения)", disambiguation=True)])
    )

    outcome = await resolve_en_identity(["Дюма (значения)"], fetcher=fetcher)

    assert isinstance(outcome, UnresolvedIdentity)
    assert outcome.reason == REASON_NO_LANGLINK
    assert "disambiguation" in outcome.detail


@pytest.mark.asyncio
async def test_divergent_variants_are_ambiguous_never_picked():
    fetcher = StubFetcher(
        _api_response(
            pages=[
                _page("Дюма, Александр", langlink="Alexandre Dumas"),
                _page("Дюма, Александр (сын)", langlink="Alexandre Dumas fils"),
            ]
        )
    )

    outcome = await resolve_en_identity(
        ["Дюма, Александр", "Дюма, Александр (сын)"], fetcher=fetcher
    )

    assert isinstance(outcome, UnresolvedIdentity)
    assert outcome.reason == REASON_AMBIGUOUS
    assert "Дюма, Александр" in outcome.detail
    assert "Alexandre Dumas fils" not in json.dumps({"d": outcome.reason})  # no silent pick


@pytest.mark.asyncio
async def test_no_langlink_is_unresolved():
    fetcher = StubFetcher(_api_response(pages=[_page("Какая-то статья")]))

    outcome = await resolve_en_identity(["Какая-то статья"], fetcher=fetcher)

    assert isinstance(outcome, UnresolvedIdentity)
    assert outcome.reason == REASON_NO_LANGLINK


@pytest.mark.asyncio
async def test_http_error_is_typed_never_raised():
    class Boom(Exception):
        pass

    fetcher = StubFetcher(error=Boom("network down"))

    outcome = await resolve_en_identity(["Войнич, Этель Лилиан"], fetcher=fetcher)

    assert isinstance(outcome, UnresolvedIdentity)
    assert outcome.reason == REASON_HTTP_ERROR


@pytest.mark.asyncio
async def test_invalid_json_is_typed():
    fetcher = StubFetcher(text="<html>not json</html>")

    outcome = await resolve_en_identity(["Хан Ган"], fetcher=fetcher)

    assert isinstance(outcome, UnresolvedIdentity)
    assert outcome.reason == REASON_INVALID_JSON


@pytest.mark.asyncio
async def test_empty_variants_rejected_without_request():
    fetcher = StubFetcher()

    outcome = await resolve_en_identity(["", "   "], fetcher=fetcher)

    assert isinstance(outcome, UnresolvedIdentity)
    assert outcome.reason == REASON_NO_CANDIDATES
    assert fetcher.urls == []


def test_ru_host_allowlist_is_exact_and_isolated():
    assert langlinks.RUWIKI_ALLOWED_HOSTS == {"ru.wikipedia.org"}
    from app.syvai.discovery.providers import WIKIPEDIA_ALLOWED_HOSTS

    assert WIKIPEDIA_ALLOWED_HOSTS == {"en.wikipedia.org"}
    assert "ru.wikipedia.org" in langlinks.RUWIKI_API_URL


# ---------------------------------------------------------------------------
# Production configuration contract for the bootstrap flag
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("1", True),
        ("true", True),
        ("yes", True),
        ("on", True),
        ("TRUE", True),
        ("On", True),
        ("", False),
        ("false", False),
        ("0", False),
        ("off", False),
        ("no", False),
    ],
)
def test_bootstrap_flag_env_parsing(monkeypatch, raw, expected):
    from app.config import Settings

    monkeypatch.setenv("SYVAI_DISCOVERY_LANGLINKS_BOOTSTRAP", raw)
    assert Settings().SYVAI_DISCOVERY_LANGLINKS_BOOTSTRAP is expected


def test_bootstrap_flag_defaults_off_when_absent(monkeypatch):
    from app.config import Settings

    monkeypatch.delenv("SYVAI_DISCOVERY_LANGLINKS_BOOTSTRAP", raising=False)
    assert Settings().SYVAI_DISCOVERY_LANGLINKS_BOOTSTRAP is False


def test_production_config_contract_exposes_operator_flag():
    """compose forwards it; the prod env example documents it (default off)."""
    import pathlib

    repo_root = pathlib.Path(__file__).resolve().parents[2]
    compose = (repo_root / "docker-compose.prod.yml").read_text(encoding="utf-8")
    assert (
        "SYVAI_DISCOVERY_LANGLINKS_BOOTSTRAP: ${SYVAI_DISCOVERY_LANGLINKS_BOOTSTRAP:-}"
        in compose
    )
    example = (repo_root / ".env.prod.example").read_text(encoding="utf-8")
    assert "SYVAI_DISCOVERY_LANGLINKS_BOOTSTRAP=false" in example


def _author():
    return SimpleNamespace(id=uuid4(), name="Anne Brontë", display_name="Anne Brontë")


class FakeDiscoveryResult:
    def __init__(self, rows):
        self._rows = rows

    def scalars(self):
        return self

    def all(self):
        return self._rows


class FakeDiscoverySession:
    def __init__(self):
        self.added = []
        self.committed = False

    async def execute(self, query):
        return FakeDiscoveryResult([])

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


@pytest.mark.asyncio
async def test_bootstrap_disabled_by_default_never_called(monkeypatch):
    from app.syvai.discovery import service as discovery_service

    calls = []

    async def _must_not_run(variants, **kwargs):  # pragma: no cover - guard
        calls.append(variants)
        raise AssertionError("bootstrap must be offline when disabled")

    monkeypatch.setattr(discovery_service, "resolve_en_identity", _must_not_run)
    session = FakeDiscoverySession()

    with patch.object(settings, "SYVAI_DISCOVERY_LANGLINKS_BOOTSTRAP", False):
        outcome = await run_discovery(session, _author(), FakeDiscoveryProvider())

    assert outcome.error is None
    assert calls == []
    # No synthetic candidate without bootstrap.
    assert all(c.provider != "wikipedia-langlinks" for c in outcome.candidates)


@pytest.mark.asyncio
async def test_bootstrap_on_strictly_verifies_direct_resolved_en_identity(monkeypatch):
    resolved = ResolvedIdentity(
        source_variant="Anne Brontë",
        ru_title="Бронте, Анна",
        en_title="Anne Brontë",
        en_url="https://en.wikipedia.org/wiki/Anne_Bront%C3%AB",
        romanized_terms=("Anne Brontë",),
    )
    from app.syvai.discovery import service as discovery_service

    async def _fake_resolve(variants, **kwargs):
        return resolved

    async def _fake_content(_resolved):
        return "Anne Brontë (1820–1849) was an English novelist and poet."

    monkeypatch.setattr(discovery_service, "resolve_en_identity", _fake_resolve)
    monkeypatch.setattr(discovery_service, "fetch_resolved_document_content", _fake_content)
    session = FakeDiscoverySession()

    with patch.object(settings, "SYVAI_DISCOVERY_LANGLINKS_BOOTSTRAP", True):
        outcome = await run_discovery(session, _author(), FakeDiscoveryProvider())

    bootstrap_rows = [c for c in outcome.candidates if c.provider == "wikipedia-langlinks"]
    assert len(bootstrap_rows) == 1
    row = bootstrap_rows[0]
    assert row.origin == "langlinks_bootstrap"
    assert row.url == "https://en.wikipedia.org/wiki/Anne_Bront%C3%AB"
    assert row.authority_tier == "medium"
    assert row.assessment == "auto_usable"
    assert row.review_action == "auto_approved"
    assert row.identity_verification["method"] == "wikipedia_langlink"
    assert "bootstrap_variant" in (row.evidence or "")


# ---------------------------------------------------------------------------
# Phase-2 ru.wikipedia search-fallback service wiring
# ---------------------------------------------------------------------------


def _fallback_resolved():
    return ResolvedIdentity(
        source_variant="Л'Энгль, Мадлен",
        ru_title="Л’Энгл, Мадлен",
        en_title="Madeleine L'Engle",
        en_url="https://en.wikipedia.org/wiki/Madeleine_L%27Engle",
        romanized_terms=("Madeleine L'Engle",),
        method="search_fallback",
        fallback={"corroboration": "alias_fold", "qid": "Q257261"},
    )


@pytest.mark.asyncio
async def test_search_fallback_disabled_by_default_never_called(monkeypatch):
    from app.syvai.discovery import service as discovery_service

    async def _must_not_run(*args, **kwargs):  # pragma: no cover - guard
        raise AssertionError("search fallback must be offline when disabled")

    async def _unresolved(variants, **kwargs):
        return UnresolvedIdentity(reason=REASON_NO_LANGLINK, detail="missing")

    monkeypatch.setattr(discovery_service, "resolve_en_identity", _unresolved)
    monkeypatch.setattr(discovery_service, "search_fallback_resolve", _must_not_run)
    session = FakeDiscoverySession()

    with patch.object(settings, "SYVAI_DISCOVERY_LANGLINKS_BOOTSTRAP", True), patch.object(
        settings, "SYVAI_DISCOVERY_RUWIKI_SEARCH_FALLBACK", False
    ):
        outcome = await run_discovery(session, _author(), FakeDiscoveryProvider())

    assert outcome.error is None


@pytest.mark.asyncio
async def test_ambiguous_bootstrap_never_reaches_fallback(monkeypatch):
    """Concrete conflicting articles exist already; searching cannot help."""
    from app.syvai.discovery import service as discovery_service

    async def _must_not_run(*args, **kwargs):  # pragma: no cover - guard
        raise AssertionError("ambiguous bootstrap must skip the fallback")

    async def _ambiguous(variants, **kwargs):
        return UnresolvedIdentity(reason=REASON_AMBIGUOUS, detail="two pages")

    monkeypatch.setattr(discovery_service, "resolve_en_identity", _ambiguous)
    monkeypatch.setattr(discovery_service, "search_fallback_resolve", _must_not_run)
    session = FakeDiscoverySession()

    with patch.object(settings, "SYVAI_DISCOVERY_LANGLINKS_BOOTSTRAP", True), patch.object(
        settings, "SYVAI_DISCOVERY_RUWIKI_SEARCH_FALLBACK", True
    ):
        outcome = await run_discovery(session, _author(), FakeDiscoveryProvider())

    assert outcome.error is None


@pytest.mark.asyncio
async def test_fallback_resolution_feeds_candidate_with_provenance(monkeypatch):
    from app.syvai.discovery import service as discovery_service

    async def _unresolved(variants, **kwargs):
        return UnresolvedIdentity(reason=REASON_NO_LANGLINK, detail="missing")

    async def _resolved_via_fallback(variants, **kwargs):
        return _fallback_resolved()

    async def _fake_content(_resolved):
        return "Madeleine L'Engle (1918–2007) was an American writer."

    monkeypatch.setattr(discovery_service, "resolve_en_identity", _unresolved)
    monkeypatch.setattr(discovery_service, "search_fallback_resolve", _resolved_via_fallback)
    monkeypatch.setattr(discovery_service, "fetch_resolved_document_content", _fake_content)
    session = FakeDiscoverySession()

    with patch.object(settings, "SYVAI_DISCOVERY_LANGLINKS_BOOTSTRAP", True), patch.object(
        settings, "SYVAI_DISCOVERY_RUWIKI_SEARCH_FALLBACK", True
    ):
        outcome = await run_discovery(session, _author(), FakeDiscoveryProvider())

    rows = [c for c in outcome.candidates if c.provider == "wikipedia-langlinks"]
    assert len(rows) == 1
    row = rows[0]
    assert row.origin == "ruwiki_search_fallback"
    evidence = row.evidence or ""
    assert "search_fallback" in evidence
    assert "alias_fold" in evidence
    assert "Q257261" in evidence
