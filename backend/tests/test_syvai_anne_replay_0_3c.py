"""SyvAI 0.3C — Anne offline replay vs the 0.3B live baseline (no network, no OpenAI).

Replays the *actual* 0.3B discovery inputs for Anne Brontë (run
``8b8620c4-f27f-4145-9e0e-a363e7c3fb43``, captured from the live database —
titles, evidence snippets and authority tiers verbatim) through the 0.3C
enrichment pipeline.

0.3B outcome: 1 trusted source in the timeline corpus (Wikipedia Anne), 6
candidates, none promoted by the 0.3B run. LOC items scored exactly 0.80
(needs_review) because their titles carry the COMBINING diaeresis ("Bronte$\u0308")
while the query is precomposed ("Brontë"), and Archive audio items were
wrong-entity with "No Description".

0.3C predicted outcome (offline, identical inputs):
  * LOC "No coward soul ... Anne Bronte\u0308" -> auto_usable (score 1.0) ->
    promoted: the Unicode fix + bounded detail enrichment recover it.
  * LOC "A companion to the Bronte\u0308s" -> stays needs_review: the item ID is
    on the lccn.loc.gov host, outside the LOC allow-list, so detail enrichment
    is correctly refused; title still lacks the author name.
  * Archive "Fluctuations ..." (LCW/SQ) -> stays needs_review (wrong entity).
  * Wikipedia Emily/The Tenant -> needs_review (unchanged, medium authority).

No OpenAI is called; timeline proposals are not run. This measures the trusted
corpus gain that gates strict recall.
"""

from __future__ import annotations

import json
from uuid import uuid4

import httpx
import pytest

from app.models.source import Source
from app.models.source_candidate import SourceCandidate
from app.models.syvai_run import SyvaiRun
from app.syvai.discovery import run_discovery
from app.syvai.discovery.assessment import ASSESSMENT_AUTO_USABLE, ASSESSMENT_NEEDS_REVIEW
from app.syvai.discovery.fetcher import FetcherConfig, SafeFetcher
from app.syvai.discovery.providers import (
    ArchiveDiscoveryProvider,
    LocDiscoveryProvider,
    WikipediaDiscoveryProvider,
)
from app.syvai.discovery.urls import normalize_url


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


def _author():
    return type("A", (), {"id": uuid4(), "name": "Anne Brontë", "display_name": "Anne Brontë"})()


# Captured 0.3B inputs (verbatim: NFD combining diaeresis U+0308 in titles).
LOC_ITEM = "https://www.loc.gov/item/95770513/"
LOC_TITLE_ITEM = "No coward soul a dramatic portrait of Charlotte, Emily, and Anne Bronte\u0308"
LOC_EVIDENCE_ITEM = (
    "Compiled from Charlotte Bronte\u0308's letters, Mrs. Gaskell's Life, and the "
    "poems, diaries, etc. of the sisters, with extracts from their writings."
)
LOC_LCCN = "https://lccn.loc.gov/2016006356"
LOC_TITLE_LCCN = "A companion to the Bronte\u0308s"
LOC_EVIDENCE_LCCN = (
    '"A Companion to the Bronte\u0308s brings the latest literary research and '
    "theory to bear on the life, work, and legacy of the Brontës."
)
ARCHIVE_LCW = "https://archive.org/details/satszxnqiqmmyjcgpjqj6ehpep8mllraec6dcxf7"
ARCHIVE_SQ = "https://archive.org/details/xcx7gcnzowuhxfflr3ozh9ipwiybad8aqtslpvfi"
WP_EMILY = "https://en.wikipedia.org/wiki/Emily_Bront%C3%AB"
WP_TENANT = "https://en.wikipedia.org/wiki/The_Tenant_of_Wildfell_Hall"


def _loc_handler(request):
    if request.url.path in {"/item/95770513", "/item/95770513/"}:
        return httpx.Response(200, headers={"content-type": "application/json"}, content=json.dumps({
            "item": {
                "title": LOC_TITLE_ITEM,
                "contributor": [{"name": "Brontë, Anne, 1820-1849"}],
                "date": "1994",
                "description": [LOC_EVIDENCE_ITEM],
            }
        }).encode())
    return httpx.Response(200, headers={"content-type": "application/json"}, content=json.dumps({
        "results": [
            {"id": LOC_ITEM, "title": LOC_TITLE_ITEM, "description": [LOC_EVIDENCE_ITEM], "original_format": ["image"]},
            {"id": LOC_LCCN, "title": LOC_TITLE_LCCN, "description": [LOC_EVIDENCE_LCCN], "original_format": ["reference"]},
        ]
    }).encode())


def _archive_handler(request):
    return httpx.Response(200, headers={"content-type": "application/json"}, content=json.dumps({
        "response": {"numFound": 2, "docs": [
            {"identifier": "satszxnqiqmmyjcgpjqj6ehpep8mllraec6dcxf7", "title": "Fluctuations - Read by LCW",
             "mediatype": "audio", "description": ["No Description"]},
            {"identifier": "xcx7gcnzowuhxfflr3ozh9ipwiybad8aqtslpvfi", "title": "Fluctuations - Read by SQ",
             "mediatype": "audio", "description": ["No Description"]},
        ]}
    }).encode())


def _wikipedia_handler(request):
    return httpx.Response(200, headers={"content-type": "application/json"}, content=json.dumps({
        "query": {"pages": [
            {"pageid": 2, "title": "Emily Brontë",
             "extract": "Emily Jane Brontë (30 July 1818 - 19 December 1848) was an English writer best known for Wuthering Heights.",
             "fullurl": WP_EMILY},
            {"pageid": 3, "title": "The Tenant of Wildfell Hall",
             "extract": "The Tenant of Wildfell Hall is the second and final novel written by the English author Anne Brontë.",
             "fullurl": WP_TENANT},
        ]}
    }).encode())


def _adapters():
    def provider(cls, host, handler):
        return cls(
            fetcher=SafeFetcher(
                config=FetcherConfig(allowed_hosts=frozenset({host})),
                resolver=_public_resolver,
                transport=httpx.MockTransport(handler),
            ),
            max_candidates=5,
        )

    return [
        provider(WikipediaDiscoveryProvider, "en.wikipedia.org", _wikipedia_handler),
        provider(LocDiscoveryProvider, "www.loc.gov", _loc_handler),
        provider(ArchiveDiscoveryProvider, "archive.org", _archive_handler),
    ]


@pytest.mark.asyncio
async def test_anne_offline_replay_0_3c():
    outcome = await run_discovery(FakeDiscoverySession(), _author(), _adapters())

    assert outcome.providers_succeeded == 3
    assert outcome.providers_failed == 0

    by_url = {normalize_url(c.normalized_url): c for c in outcome.candidates}
    norm_item = normalize_url(LOC_ITEM)
    norm_lccn = normalize_url(LOC_LCCN)

    # The LOC root-cause item is recovered by the 0.3C pipeline.
    loc_item = by_url.get(norm_item)
    assert loc_item is not None
    assert loc_item.assessment == ASSESSMENT_NEEDS_REVIEW
    assert loc_item.review_action is None
    assert loc_item.quality_score == 1.0
    assert "creator: Brontë, Anne" in (loc_item.evidence or "")

    # Name-only creator metadata is useful review evidence, not strict identity proof.
    assert outcome.created_sources == []

    # The LCCN-host companion stays in review: detail enrichment is refused for
    # a host outside the LOC allow-list, and the title lacks the author name.
    loc_lccn = by_url.get(norm_lccn)
    assert loc_lccn is not None
    assert loc_lccn.assessment == ASSESSMENT_NEEDS_REVIEW
    assert loc_lccn.review_action is None

    # Archive wrong-entity audio + Wikipedia medium-authority stay in review.
    remaining = [c for c in outcome.candidates if c.assessment == ASSESSMENT_NEEDS_REVIEW]
    assert norm_item in {normalize_url(c.normalized_url) for c in remaining}

    # Zero wrong-entity auto-approval.
    assert not any(c.review_action == "auto_approved" and normalize_url(c.normalized_url) in {
        normalize_url(ARCHIVE_LCW), normalize_url(ARCHIVE_SQ),
    } for c in outcome.candidates)

    # No OpenAI: the discovery run never touches a model.
    assert outcome.run.model is None
    assert outcome.run.calls == 3  # provider attempts only

    assert outcome.created_sources == []
