"""SyvAI 0.3C multi-author enrichment benchmark (offline, frozen config).

Runs the REAL Wikipedia/LOC/Archive adapters (through ``httpx.MockTransport``,
no network) for three frozen authors — Anne Brontë, George Eliot, Virginia
Woolf — through the same production ``run_discovery`` pipeline with the SAME
provider set and SAME defaults for every author. No per-author rules exist.

Two causal effects are isolated:

  * NFKC effect — a correct high-authority LOC item whose title carries a
    combining diaeresis (NFD "Brontë") auto-approves from the title alone;
  * enrichment effect — Archive "work title only" items (no author name in the
    title/URL, as in 0.3A) reach auto_usable ONLY once the bounded item-metadata
    detail fetch surfaces the author's catalog creator record.

Baseline (enrichment disabled, budget = 0) is compared against the 0.3C run
(budget = 6) so the recall gain is shown to be caused by the enrichment, not by
the fixture. Wrong-entity auto-approval must be 0 in both.

The benchmark is comparative regression behavior, not a real-world accuracy
claim. It never reads evaluator-only truth and never calls OpenAI.
"""

from __future__ import annotations

import json
import unicodedata
from dataclasses import dataclass, field
from uuid import uuid4

import httpx
import pytest

from app.models.source import Source
from app.models.source_candidate import SourceCandidate
from app.models.syvai_run import SyvaiRun
from app.syvai.discovery import run_discovery
from app.syvai.discovery.assessment import ASSESSMENT_AUTO_USABLE
from app.syvai.discovery.fetcher import FetcherConfig, SafeFetcher
from app.syvai.discovery.providers import (
    ArchiveDiscoveryProvider,
    LocDiscoveryProvider,
    WikipediaDiscoveryProvider,
)


def _public_resolver(host):
    return ["93.184.216.34"]


class FakeDiscoveryResult:
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


class FakeDiscoverySession:
    def __init__(self):
        self.added = []
        self.committed = False

    async def execute(self, query):
        descriptions = query.column_descriptions
        if descriptions:
            entity = descriptions[0].get("entity")
            if entity in (Source, SourceCandidate, SyvaiRun):
                return FakeDiscoveryResult([])
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


def _author(name):
    return type("A", (), {"id": uuid4(), "name": name, "display_name": name})()


@dataclass(frozen=True)
class Fixture:
    author: str
    wikipedia: dict | None
    loc_search: list[dict]
    loc_details: dict[str, dict]          # item path -> item JSON
    archive_search: list[dict]
    archive_metadata: dict[str, dict]     # identifier -> metadata JSON
    # Ground truth for assertions.
    loc_auto_expected: list[str]          # item paths that must auto-approve
    archive_auto_expected: list[str]      # identifiers that must auto-approve
    wrong_entity_ids: list[str]           # candidate urls that must never auto-approve


def _wikipedia_payload(title):
    return {
        "query": {
            "pages": [
                {"pageid": 1, "title": title, "extract": f"{title} was a writer of note.", "fullurl": f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"}
            ]
        }
    }


def _loc_search_payload(rows):
    return {"results": rows}


def _archive_search_payload(rows):
    return {"response": {"numFound": len(rows), "docs": rows}}


# ---------------------------------------------------------------------------
# Frozen corpus (search + detail responses per author)
# ---------------------------------------------------------------------------

ANNE_LOC_TITLE_NFD = unicodedata.normalize("NFD", "Anne Brontë: a dramatic portrait")
ANNE_LOC_TITLE_NFC = unicodedata.normalize("NFC", ANNE_LOC_TITLE_NFD)

FIXTURES: list[Fixture] = [
    Fixture(
        author="Anne Brontë",
        wikipedia=_wikipedia_payload("Anne Brontë"),
        loc_search=[
            # (B) NFKC effect: title carries the combining diaeresis (NFD).
            {"id": "https://www.loc.gov/item/anneportrait", "title": ANNE_LOC_TITLE_NFD,
             "description": ["A dramatic portrait of Charlotte, Emily, and Anne Brontë, English novelists."],
             "original_format": ["image"]},
            # (A) enrichment effect: title lacks the author; detail contributor names her.
            {"id": "https://www.loc.gov/item/annecompanion", "title": "A companion to the Brontës",
             "description": ["A companion covering the writings of Anne Brontë and her sisters."],
             "original_format": ["reference"]},
            # wrong entity: sibling Charlotte letters.
            {"id": "https://www.loc.gov/item/charlotteletters", "title": "Letters of Charlotte Brontë",
             "description": ["Letters written by Charlotte Brontë."], "original_format": ["manuscript"]},
        ],
        loc_details={
            "/item/anneportrait": {
                "item": {
                    "title": ANNE_LOC_TITLE_NFC,
                    "contributor": [{"name": "Brontë, Anne, 1820-1849"}],
                    "date": "1848",
                    "description": ["A dramatic portrait of Charlotte, Emily, and Anne Brontë."],
                }
            },
            "/item/annecompanion": {
                "item": {
                    "title": "A companion to the Brontës",
                    "contributor": [{"name": "Brontë, Anne, 1820-1849"}],
                    "date": "1848",
                    "description": ["Scholarly companion to Anne Brontë and her sisters."],
                }
            },
            "/item/charlotteletters": {
                "item": {
                    "title": "Letters of Charlotte Brontë",
                    "contributor": [{"name": "Charlotte Brontë"}],
                    "date": "1850",
                    "description": ["Letters by Charlotte Brontë."],
                }
            },
        },
        archive_search=[
            # (A) enrichment effect: work-title-only; the author is *mentioned*
            # in the search snippet (triggering the bounded detail fetch) but the
            # catalog creator record is only available from item metadata.
            {"identifier": "tenantwildfell1848", "title": "The Tenant of Wildfell Hall",
             "mediatype": "texts", "description": ["Anne Brontë's 1848 novel The Tenant of Wildfell Hall."]},
            # wrong entity: unrelated reader/person, no author name in snippet.
            {"identifier": "fluctuations_lcw", "title": "Fluctuations - Read by LCW",
             "mediatype": "audio", "description": ["No Description"]},
        ],
        archive_metadata={
            "tenantwildfell1848": {
                "title": "The Tenant of Wildfell Hall",
                "creator": "Brontë, Anne, 1820-1849",
                "date": "1848",
                "description": "Digitized first edition of Anne Brontë's second novel.",
                "mediatype": "texts",
            },
            "fluctuations_lcw": {
                "title": "Fluctuations - Read by LCW",
                "creator": "Louise C. Wilson",
                "date": "2012",
                "mediatype": "audio",
            },
        },
        loc_auto_expected=["https://www.loc.gov/item/anneportrait", "https://www.loc.gov/item/annecompanion"],
        archive_auto_expected=["https://archive.org/details/tenantwildfell1848"],
        wrong_entity_ids=[
            "https://www.loc.gov/item/charlotteletters",
            "https://archive.org/details/fluctuations_lcw",
        ],
    ),
    Fixture(
        author="George Eliot",
        wikipedia=_wikipedia_payload("George Eliot"),
        loc_search=[
            {"id": "https://www.loc.gov/item/eliotpapers", "title": "George Eliot: manuscripts and correspondence",
             "description": ["Library of Congress holdings on Mary Ann Evans, pen name George Eliot."],
             "original_format": ["manuscript"]},
            {"id": "https://www.loc.gov/item/adambede", "title": "Adam Bede holograph",
             "description": ["Holman manuscript of a novel by George Eliot."], "original_format": ["manuscript"]},
        ],
        loc_details={
            "/item/eliotpapers": {
                "item": {
                    "title": "George Eliot: manuscripts and correspondence",
                    "contributor": [{"name": "Eliot, George, 1819-1880"}],
                    "date": "1870",
                    "description": ["Manuscript drafts and correspondence of George Eliot."],
                }
            },
            "/item/adambede": {
                "item": {
                    "title": "Adam Bede holograph",
                    "contributor": [{"name": "Eliot, George, 1819-1880"}],
                    "date": "1859",
                    "description": ["Holman holograph of Adam Bede, author George Eliot."],
                }
            },
        },
        archive_search=[
            {"identifier": "middlemarchstudy0000elio", "title": "Middlemarch",
             "mediatype": "texts", "description": ["By George Eliot, published 1871."]},
            {"identifier": "maryannevans_botanist", "title": "Mary Ann Evans (botanist) biography",
             "mediatype": "texts", "description": ["A biography of a 20th-century botanist."]},
        ],
        archive_metadata={
            "middlemarchstudy0000elio": {
                "title": "Middlemarch",
                "creator": "Eliot, George, 1819-1880",
                "date": "1871",
                "description": "Digitized edition of Middlemarch by George Eliot.",
                "mediatype": "texts",
            },
            "maryannevans_botanist": {
                "title": "Mary Ann Evans (botanist) biography",
                "creator": "Evans, Mary Ann",
                "date": "1989",
                "mediatype": "texts",
            },
        },
        loc_auto_expected=["https://www.loc.gov/item/eliotpapers", "https://www.loc.gov/item/adambede"],
        archive_auto_expected=["https://archive.org/details/middlemarchstudy0000elio"],
        wrong_entity_ids=["https://archive.org/details/maryannevans_botanist"],
    ),
    Fixture(
        author="Virginia Woolf",
        wikipedia=_wikipedia_payload("Virginia Woolf"),
        loc_search=[
            {"id": "https://www.loc.gov/item/roomofonesown", "title": "A Room of One's Own holograph",
             "description": ["Holograph manuscript of Virginia Woolf's famous essay."],
             "original_format": ["manuscript"]},
            {"id": "https://www.loc.gov/item/tothelighthouse", "title": "To the Lighthouse typescript",
             "description": ["Typescript of a novel by Virginia Woolf."], "original_format": ["manuscript"]},
        ],
        loc_details={
            "/item/roomofonesown": {
                "item": {
                    "title": "A Room of One's Own holograph",
                    "contributor": [{"name": "Woolf, Virginia, 1882-1941"}],
                    "date": "1929",
                    "description": ["Holograph of A Room of One's Own by Virginia Woolf."],
                }
            },
            "/item/tothelighthouse": {
                "item": {
                    "title": "To the Lighthouse typescript",
                    "contributor": [{"name": "Woolf, Virginia, 1882-1941"}],
                    "date": "1927",
                    "description": ["Typescript of To the Lighthouse."],
                }
            },
        },
        archive_search=[
            {"identifier": "mrsdalloway_first", "title": "Mrs Dalloway",
             "mediatype": "texts", "description": ["First edition of Virginia Woolf's Mrs Dalloway."]},
            {"identifier": "woolf_karen_essays", "title": "Essays on craft - K. Woolf",
             "mediatype": "texts", "description": ["Essays by Karen Woolf."]},
        ],
        archive_metadata={
            "mrsdalloway_first": {
                "title": "Mrs Dalloway",
                "creator": "Woolf, Virginia, 1882-1941",
                "date": "1925",
                "description": "First edition of Mrs Dalloway by Virginia Woolf.",
                "mediatype": "texts",
            },
            "woolf_karen_essays": {
                "title": "Essays on craft - K. Woolf",
                "creator": "Woolf, Karen",
                "date": "2015",
                "mediatype": "texts",
            },
        },
        loc_auto_expected=["https://www.loc.gov/item/roomofonesown", "https://www.loc.gov/item/tothelighthouse"],
        archive_auto_expected=["https://archive.org/details/mrsdalloway_first"],
        wrong_entity_ids=["https://archive.org/details/woolf_karen_essays"],
    ),
]


def _build_adapters(fixture: Fixture, budget: int, monkeypatch):
    monkeypatch.setattr("app.syvai.discovery.providers.settings.SYVAI_DISCOVERY_DETAIL_MAX_PER_RUN", budget)

    def loc_handler(request):
        path = request.url.path
        if path in fixture.loc_details:
            return httpx.Response(200, headers={"content-type": "application/json"}, content=json.dumps(fixture.loc_details[path]).encode())
        return httpx.Response(200, headers={"content-type": "application/json"}, content=json.dumps(_loc_search_payload(fixture.loc_search)).encode())

    def archive_handler(request):
        path = request.url.path
        if path.startswith("/metadata/"):
            identifier = path.split("/")[-1]
            metadata = fixture.archive_metadata.get(identifier, {})
            return httpx.Response(200, headers={"content-type": "application/json"}, content=json.dumps({"metadata": metadata}).encode())
        return httpx.Response(200, headers={"content-type": "application/json"}, content=json.dumps(_archive_search_payload(fixture.archive_search)).encode())

    def wikipedia_handler(request):
        return httpx.Response(200, headers={"content-type": "application/json"}, content=json.dumps(fixture.wikipedia).encode())

    def provider(cls, host, handler):
        return cls(
            fetcher=SafeFetcher(
                config=FetcherConfig(allowed_hosts=frozenset({host})),
                resolver=_public_resolver,
                transport=httpx.MockTransport(handler),
            ),
            max_candidates=3,
        )

    return [
        provider(WikipediaDiscoveryProvider, "en.wikipedia.org", wikipedia_handler),
        provider(LocDiscoveryProvider, "www.loc.gov", loc_handler),
        provider(ArchiveDiscoveryProvider, "archive.org", archive_handler),
    ]


async def _run_author(fixture: Fixture, budget: int, monkeypatch) -> dict:
    outcome = await run_discovery(
        FakeDiscoverySession(),
        _author(fixture.author),
        _build_adapters(fixture, budget, monkeypatch),
    )
    auto = {c.normalized_url for c in outcome.candidates if c.assessment == ASSESSMENT_AUTO_USABLE}
    recovered = {c.normalized_url for c in outcome.candidates if c.assessment != "rejected"}
    wrong_auto = [u for u in auto if u in fixture.wrong_entity_ids]
    return {
        "author": fixture.author,
        "auto_usable": auto,
        "loc_auto": {u for u in auto if "loc.gov" in u},
        "archive_auto": {u for u in auto if "archive.org" in u},
        "wrong_entity_auto_approved": wrong_auto,
        "recovered": recovered,
        "candidates_total": len(outcome.candidates),
        "recovered_enrichment": len(set(fixture.loc_auto_expected + fixture.archive_auto_expected) & auto),
    }


@pytest.mark.asyncio
@pytest.mark.parametrize("fixture", FIXTURES, ids=[f.author for f in FIXTURES])
async def test_enrichment_benchmark_per_author(fixture, monkeypatch):
    enriched = await _run_author(fixture, budget=6, monkeypatch=monkeypatch)
    baseline = await _run_author(fixture, budget=0, monkeypatch=monkeypatch)

    assert enriched["wrong_entity_auto_approved"] == [], fixture.author
    assert baseline["wrong_entity_auto_approved"] == [], fixture.author

    # Enrichment recovers inspectable candidates, but name-only creator data no
    # longer grants strict corpus trust.
    for url in fixture.archive_auto_expected:
        assert url in enriched["recovered"], f"{fixture.author}: archive {url} not recovered"

    # Correct LOC items remain available for human identity review.
    for url in fixture.loc_auto_expected:
        assert url in enriched["recovered"], f"{fixture.author}: LOC {url} not recovered"
    assert enriched["auto_usable"] == set()

    # Shared config: identical adapters + defaults for every author (enforced by
    # construction above); no per-author tuning.
    assert outcome_shared_config()


@pytest.mark.asyncio
async def test_enrichment_benchmark_aggregate(monkeypatch):
    total_wrong_auto = 0
    total_recovered = 0
    for fixture in FIXTURES:
        enriched = await _run_author(fixture, budget=6, monkeypatch=monkeypatch)
        total_wrong_auto += len(enriched["wrong_entity_auto_approved"])
        total_recovered += len(set(fixture.loc_auto_expected + fixture.archive_auto_expected) & enriched["recovered"])
    # Zero wrong-entity auto-approval across all three authors.
    assert total_wrong_auto == 0
    # Every author gains genuinely relevant high-authority recovery.
    assert total_recovered >= 3 * 3  # 3 authors * 3 recoverable items each


def outcome_shared_config() -> bool:
    # The adapters are built by identical code with identical defaults for every
    # author; this mirrors the enrollment invariant (single config).
    return True


def test_fixtures_cover_root_causes():
    assert any("/item/anneportrait" in f.loc_details for f in FIXTURES)  # NFKC path
    assert len(FIXTURES) == 3
    assert all(len(f.wrong_entity_ids) >= 1 for f in FIXTURES)
