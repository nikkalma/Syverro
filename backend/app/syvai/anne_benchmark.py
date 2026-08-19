"""SyvAI 0.3B — Independent Anne Brontë reference benchmark.

This module is the REFERENCE TRUTH for the 0.3B evaluation. It is built
independently of SyvAI research input: every event was compiled from external
reference sources (Britannica, Wikipedia, the Visit Haworth chronology,
New World Encyclopedia, WikiTree, Find a Grave, and community biographies) and
is not seeded anywhere in the author record, the source registry, or the
prompt inputs.

Leakage firewall contract:
    * The reference data in this module must NEVER be added to the author
      record, ``sources`` registry, ``timeline_events``, or any research input
      builder.
    * It is consumed only by the evaluator AFTER a run has produced proposals.
    * Tests in ``tests/test_syvai_anne_benchmark.py`` assert the firewall
      (no reference URL, label, or date appears in research input builders).

Classification:
    * STRICT — well-documented date, corroborated by >=2 independent
      references; eligible for the factual scoring denominator.
    * SOFT   — context / chronologically relevant but with a disputed or
      approximate date; included for context but EXCLUDED from the strict
      scoring denominator so a contested date cannot be scored as an error.

Rationale notes for SOFT events (documented where the source record is
ambiguous):
    * Thorp Green start year: Britannica says 1841-45; Find a Grave,
      English Verse and the Haworth Village chronology say 1840.
"""

from __future__ import annotations

from app.syvai.validators import ExistingEvent

ANNE_BIRTH = "1820-01-17"
ANNE_DEATH = "1849-05-28"

STRICT = "STRICT"
SOFT = "SOFT"

# Provenance references gathered during the independent Phase 1 research.
# ``kind`` is one of: encyclopedia / reference-chronology / genealogy / community.
_REFERENCES = {
    "britannica": {
        "title": "Anne Brontë — Encyclopaedia Britannica",
        "url": "https://www.britannica.com/biography/Anne-Bronte",
        "kind": "encyclopedia",
    },
    "wikipedia": {
        "title": "Anne Brontë — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Anne_Bront%C3%AB",
        "kind": "encyclopedia",
    },
    "visit-haworth": {
        "title": "The Brontë Family Chronology — Visit Haworth",
        "url": "https://visithaworth.com/bronte-sisters/timeline",
        "kind": "reference-chronology",
    },
    "newworld": {
        "title": "Anne Brontë — New World Encyclopedia",
        "url": "https://www.newworldencyclopedia.org/entry/Anne_Bront%C3%AB",
        "kind": "encyclopedia",
    },
    "wikitree": {
        "title": "Anne Brontë (1820-1849) — WikiTree",
        "url": "https://www.wikitree.com/wiki/Bront%C3%AB-7",
        "kind": "genealogy",
    },
    "findagrave": {
        "title": "Anne Brontë (1820-1849) — Find a Grave",
        "url": "https://www.findagrave.com/memorial/136/anne-bront%C3%AB",
        "kind": "genealogy",
    },
    "englishverse": {
        "title": "Anne Brontë 1820-1849 — English Verse",
        "url": "https://englishverse.com/poets/bronte_anne",
        "kind": "community",
    },
    "haworth-village": {
        "title": "Biography — Anne Bronte — Haworth Village",
        "url": "https://www.haworth-village.org.uk/brontes/anne/anne.asp",
        "kind": "community",
    },
    "penguin": {
        "title": "Anne Bronte — Penguin Random House",
        "url": "https://www.penguinrandomhouse.com/authors/3348/anne-bronte",
        "kind": "reference",
    },
    "annebronte-org": {
        "title": "The Baptism Of Anne Brontë And A Sad Farewell — Anne Brontë",
        "url": "http://www.annebronte.org/2023/03/26/the-baptism-of-anne-bronte-and-a-sad-farewell/",
        "kind": "community",
    },
    "geneastar": {
        "title": "Family tree of Anne Brontë — Geneastar",
        "url": "https://en.geneastar.org/genealogy/bronteanne/anne-bronte",
        "kind": "genealogy",
    },
}

# The independent reference timeline. Each event records:
#   event_type / date_value / date_precision / label  — consumed by the real
#       deterministic validator via ExistingEvent
#   place / description                              — evaluator context
#   classification / references                      — 0.3B scoring metadata
# Dates use SyvAI date_value conventions (YYYY / YYYY-MM / YYYY-MM-DD) so the
# existing normalization and precision checks apply unchanged.
ANNE_REFERENCE_TIMELINE: list[dict] = [
    {
        "event_type": "birth",
        "date_value": "1820-01-17",
        "date_precision": "full",
        "label": "Birth of Anne Brontë",
        "place": "Thornton, West Riding of Yorkshire, England",
        "description": "Anne, youngest of six children, born at the Market Street parsonage in Thornton, where her father Patrick was curate.",
        "classification": STRICT,
        "references": ["britannica", "wikipedia", "newworld", "wikitree", "findagrave", "geneastar"],
    },
    {
        "event_type": "personal",
        "date_value": "1820-03-25",
        "date_precision": "full",
        "label": "Baptism of Anne Brontë",
        "place": "Thornton, West Riding of Yorkshire, England",
        "description": "Baptised at the Old Bell Chapel, Thornton, two months before the family's move to Haworth.",
        "classification": STRICT,
        "references": ["wikipedia", "visit-haworth", "annebronte-org", "wikitree"],
    },
    {
        "event_type": "personal",
        "date_value": "1820-04",
        "date_precision": "month",
        "label": "Brontë family moved to Haworth Parsonage",
        "place": "Haworth, West Riding of Yorkshire, England",
        "description": "Patrick Brontë appointed perpetual curate of Haworth; the family moved into the five-roomed Haworth Parsonage.",
        "classification": STRICT,
        "references": ["wikipedia", "visit-haworth", "annebronte-org", "newworld"],
    },
    {
        "event_type": "personal",
        "date_value": "1821-09-15",
        "date_precision": "full",
        "label": "Death of Maria Brontë",
        "place": "Haworth, West Riding of Yorkshire, England",
        "description": "Anne's mother Maria Brontë (née Branwell) died when Anne was barely a year old, of what may have been uterine cancer.",
        "classification": STRICT,
        "references": ["wikipedia", "newworld", "findagrave", "penguin"],
    },
    {
        "event_type": "education",
        "date_value": "1835",
        "date_precision": "year",
        "label": "Enrolled at Roe Head School",
        "place": "Roe Head, Mirfield, West Riding of Yorkshire, England",
        "description": "Attended Miss Wooler's school at Roe Head, Mirfield, for two years as a boarder while Charlotte was a teacher there.",
        "classification": STRICT,
        "references": ["britannica", "findagrave", "englishverse", "haworth-village"],
    },
    {
        "event_type": "career",
        "date_value": "1839",
        "date_precision": "year",
        "label": "Governess for the Ingham family at Blake Hall",
        "place": "Blake Hall, Mirfield, West Riding of Yorkshire, England",
        "description": "Began work as governess for the Ingham family at Blake Hall, Mirfield; dismissed after about nine months after difficulty controlling the unruly children.",
        "classification": STRICT,
        "references": ["britannica", "findagrave", "visit-haworth", "haworth-village"],
    },
    {
        "event_type": "career",
        "date_value": "1840",
        "date_precision": "year",
        "label": "Governess for the Robinson family at Thorp Green",
        "place": "Thorp Green, near York, England",
        "description": "Became governess to the four children of the Rev. Edmund Robinson and his wife at Thorp Green. Start year is disputed (1840 vs 1841) across sources.",
        "classification": SOFT,
        "references": ["britannica", "findagrave", "englishverse", "haworth-village"],
    },
    {
        "event_type": "career",
        "date_value": "1843",
        "date_precision": "year",
        "label": "Branwell Brontë joined Anne as tutor at Thorp Green",
        "place": "Thorp Green, near York, England",
        "description": "Branwell secured a position as tutor to the Robinsons' youngest son; he was dismissed in 1845 after his affair with Lydia Robinson was discovered.",
        "classification": SOFT,
        "references": ["britannica", "findagrave"],
    },
    {
        "event_type": "publication",
        "date_value": "1846-05",
        "date_precision": "month",
        "label": "Poems by Currer, Ellis and Acton Bell published",
        "place": "London, England",
        "description": "The sisters self-published their joint verse collection under the Bell pseudonyms; Anne contributed 21 poems. The first copies arrived at the parsonage on 7 May 1846.",
        "classification": STRICT,
        "references": ["britannica", "penguin", "findagrave", "visit-haworth"],
    },
    {
        "event_type": "publication",
        "date_value": "1847-12",
        "date_precision": "month",
        "label": "Agnes Grey published",
        "place": "London, England",
        "description": "Anne's first novel, published under the name Acton Bell in three volumes together with Emily's Wuthering Heights (Agnes Grey was the third volume).",
        "classification": STRICT,
        "references": ["britannica", "wikipedia", "penguin", "haworth-village"],
    },
    {
        "event_type": "publication",
        "date_value": "1848-06",
        "date_precision": "month",
        "label": "The Tenant of Wildfell Hall published",
        "place": "London, England",
        "description": "Anne's second novel, published in three volumes under the name Acton Bell; it sold out within six weeks.",
        "classification": STRICT,
        "references": ["britannica", "findagrave", "wikipedia"],
    },
    {
        "event_type": "personal",
        "date_value": "1848-09-24",
        "date_precision": "full",
        "label": "Death of Branwell Brontë",
        "place": "Haworth, West Riding of Yorkshire, England",
        "description": "Brother Branwell died of tuberculosis aggravated by alcoholism and chronic bronchitis.",
        "classification": STRICT,
        "references": ["findagrave", "wikipedia", "visit-haworth"],
    },
    {
        "event_type": "personal",
        "date_value": "1848-12-19",
        "date_precision": "full",
        "label": "Death of Emily Brontë",
        "place": "Haworth, West Riding of Yorkshire, England",
        "description": "Sister Emily died of tuberculosis at Haworth, aged 30.",
        "classification": STRICT,
        "references": ["findagrave", "wikipedia", "visit-haworth", "britannica"],
    },
    {
        "event_type": "personal",
        "date_value": "1849-01-05",
        "date_precision": "full",
        "label": "Anne diagnosed with consumption",
        "place": "Haworth, West Riding of Yorkshire, England",
        "description": "Anne caught influenza over the Christmas holidays; consumption (tuberculosis) was diagnosed in both lungs.",
        "classification": STRICT,
        "references": ["visit-haworth", "wikipedia", "findagrave"],
    },
    {
        "event_type": "personal",
        "date_value": "1849-05-24",
        "date_precision": "full",
        "label": "Anne travelled to Scarborough",
        "place": "Scarborough, Yorkshire, England",
        "description": "Charlotte and Anne travelled to Scarborough with Ellen Nussey in the hope that the sea air would ease Anne's illness.",
        "classification": STRICT,
        "references": ["visit-haworth", "findagrave", "haworth-village"],
    },
    {
        "event_type": "death",
        "date_value": "1849-05-28",
        "date_precision": "full",
        "label": "Death of Anne Brontë",
        "place": "Scarborough, Yorkshire, England",
        "description": "Anne died of tuberculosis at Scarborough, aged 29, at 2 o'clock in the afternoon.",
        "classification": STRICT,
        "references": ["britannica", "wikipedia", "findagrave", "visit-haworth", "newworld"],
    },
    {
        "event_type": "personal",
        "date_value": "1849-05-30",
        "date_precision": "full",
        "label": "Burial of Anne Brontë",
        "place": "St Mary's Churchyard, Scarborough, Yorkshire, England",
        "description": "Anne was buried in St Mary's churchyard on Castle Hill, Scarborough — the only Brontë sibling not buried in the Haworth family vault.",
        "classification": STRICT,
        "references": ["visit-haworth", "findagrave", "haworth-village"],
    },
    {
        "event_type": "milestone",
        "date_value": "1832",
        "date_precision": "approximate",
        "label": "Gondal saga created with Emily",
        "place": "Haworth, West Riding of Yorkshire, England",
        "description": "Anne and Emily invented the imaginary kingdom of Gondal, about which they wrote verse and prose from the early 1830s until 1845.",
        "classification": SOFT,
        "references": ["britannica", "wikipedia", "findagrave"],
    },
]

_REFERENCE_EVENTS: list[ExistingEvent] = [
    ExistingEvent(
        id=f"anne-reference-{index}",
        event_type=event["event_type"],
        date_value=event["date_value"],
        date_precision=event["date_precision"],
        label=event["label"],
    )
    for index, event in enumerate(ANNE_REFERENCE_TIMELINE)
]


def anne_reference_events() -> list[ExistingEvent]:
    """The reference as ExistingEvent list for the deterministic validator."""
    return list(_REFERENCE_EVENTS)


def strict_reference_events() -> list[dict]:
    """Only STRICT events — the factual scoring denominator."""
    return [e for e in ANNE_REFERENCE_TIMELINE if e["classification"] == STRICT]


def soft_reference_events() -> list[dict]:
    """Only SOFT events — context, excluded from the scoring denominator."""
    return [e for e in ANNE_REFERENCE_TIMELINE if e["classification"] == SOFT]
