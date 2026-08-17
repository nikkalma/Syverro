"""SyvAI 0.2E — Anne Brontë offline replay (Phase 9).

Deterministic, no discovery / provider / network / database. Locks the
corroboration behavior for the Anne fixtures:

  * 1 Wikipedia source grounded                    -> single_source
  * + a second Wikipedia-family source grounded    -> still single_source
    (no inflation from same-family mirrors)
  * + an independent high-authority source         -> corroborated
  * Birth 1820 + Thornton, Death 1849 + Scarborough with evidence fragments
    that omit the place -> partially grounded; two partials must NOT
    synthesize; reported COMPLEMENTARY_EVIDENCE_SYNTHESIS_DEFERRED.
"""

import pytest

from app.syvai.confidence import compute_confidence
from app.syvai.corroboration import (
    STATE_CORROBORATED,
    STATE_NONE,
    STATE_SINGLE_SOURCE,
)
from app.syvai.corroboration import corroborate_sources
from app.syvai.evidence import build_material_requirements, verify_evidence
from app.syvai.timeline_claims import TimelineClaim
from app.syvai.validators import validate_timeline_claim

WIKIPEDIA_EN = "https://en.wikipedia.org/wiki/Anne_Bront%C3%AB"
WIKIPEDIA_FR = "https://fr.wikipedia.org/wiki/Anne_Bront%C3%AB"
BRITANNICA = "https://www.britannica.com/biography/Anne-Bronte"

WIKI_EN_CITATION = (
    "Anne Brontë was born in Thornton, Yorkshire, England on 17 January 1820. "
    "She was known for her 1847 novel Agnes Grey and her 1848 novel The Tenant of "
    "Wildfell Hall. Anne Brontë died of tuberculosis in Scarborough, England on "
    "28 May 1849."
)
WIKI_FR_CITATION = (
    "Anne Brontë, born on 17 January 1820 in Thornton, Yorkshire, England, wrote "
    "Agnes Grey (1847) and The Tenant of Wildfell Hall (1848). She died in "
    "Scarborough, England on 28 May 1849."
)
BRITANNICA_CITATION = (
    "Anne Brontë was born on 17 January 1820 at Thornton, Yorkshire, England, "
    "the youngest of the Brontë sisters. Agnes Grey appeared in 1847 and The "
    "Tenant of Wildfell Hall in 1848. She died on 28 May 1849 in Scarborough."
)

SOURCES = [
    {"id": "s-wiki-en", "url": WIKIPEDIA_EN, "citation": WIKI_EN_CITATION, "reliability_score": "0.7"},
    {"id": "s-wiki-fr", "url": WIKIPEDIA_FR, "citation": WIKI_FR_CITATION, "reliability_score": "0.7"},
    {"id": "s-britannica", "url": BRITANNICA, "citation": BRITANNICA_CITATION, "reliability_score": "0.9"},
]
SOURCE_BY_ID = {s["id"]: s for s in SOURCES}


def run_claim(claim, refs):
    material = build_material_requirements(
        label=claim.label,
        description=claim.description,
        place=claim.place,
        date_value=claim.date_value,
    )
    grounded = []
    grounded_reliabilities = []
    per_source = []
    for source_id, fragment in refs:
        source = SOURCE_BY_ID[source_id]
        verification = verify_evidence(fragment, source["citation"], material=material)
        grounded.append(verification.is_grounded)
        if verification.is_grounded:
            grounded_reliabilities.append(source["reliability_score"])
        per_source.append(
            {"source_id": source["id"], "url": source["url"], "grounding": verification.state}
        )
    corroboration = corroborate_sources(
        [SOURCE_BY_ID[source_id] for source_id, _ in refs],
        grounded,
    )
    validation = validate_timeline_claim(
        claim,
        author_birth_date="1820-01-17",
        author_death_date="1849-05-28",
        existing_events=[],
        source_count=len(refs),
        grounded_source_count=corroboration.grounded_source_count,
    )
    confidence = compute_confidence(
        validation=validation,
        source_count=len(refs),
        reliabilities=[SOURCE_BY_ID[source_id]["reliability_score"] for source_id, _ in refs],
        grounded_source_count=corroboration.grounded_source_count,
        independent_grounded_source_count=corroboration.independent_grounded_source_count,
        grounded_reliabilities=grounded_reliabilities,
    )
    return corroboration, validation, confidence, per_source


AGNES_1847 = TimelineClaim(
    event_type="publication",
    date_value="1847",
    date_precision="year",
    label="Publication of Agnes Grey",
    description="Anne Brontë's novel Agnes Grey published in 1847.",
    sources=[],
)
BIRTH_1820 = TimelineClaim(
    event_type="birth",
    date_value="1820-01-17",
    date_precision="full",
    label="Birth of Anne Brontë",
    place="Thornton, Yorkshire, England",
    sources=[],
)
DEATH_1849 = TimelineClaim(
    event_type="death",
    date_value="1849-05-28",
    date_precision="full",
    label="Death of Anne Brontë",
    place="Scarborough",
    sources=[],
)


def test_case_1_single_wikipedia_source_is_single_source():
    corroboration, validation, confidence, _ = run_claim(
        AGNES_1847, [("s-wiki-en", "her 1847 novel Agnes Grey")]
    )
    assert corroboration.state == STATE_SINGLE_SOURCE
    assert corroboration.independent_grounded_source_count == 1
    assert validation.review_band == "auto_approved"
    assert confidence > 0.5


def test_case_2_wikipedia_mirror_does_not_inflate():
    single, single_validation, single_confidence, _ = run_claim(
        AGNES_1847, [("s-wiki-en", "her 1847 novel Agnes Grey")]
    )
    mirrored, mirror_validation, mirror_confidence, _ = run_claim(
        AGNES_1847,
        [("s-wiki-en", "her 1847 novel Agnes Grey"), ("s-wiki-fr", "Agnes Grey (1847)")],
    )
    assert mirrored.state == STATE_SINGLE_SOURCE
    assert mirrored.grounded_source_count == 2
    assert mirrored.independent_grounded_source_count == 1
    assert mirror_confidence == pytest.approx(single_confidence)


def test_case_3_independent_high_authority_corroborates():
    corroboration, validation, confidence, _ = run_claim(
        AGNES_1847,
        [
            ("s-wiki-en", "her 1847 novel Agnes Grey"),
            ("s-wiki-fr", "Agnes Grey (1847)"),
            ("s-britannica", "Agnes Grey appeared in 1847"),
        ],
    )
    assert corroboration.state == STATE_CORROBORATED
    assert corroboration.independent_grounded_source_count == 2
    assert validation.review_band == "auto_approved"


def test_case_4_birth_partial_place_never_synthesizes():
    corroboration, validation, _, per_source = run_claim(
        BIRTH_1820,
        [("s-wiki-en", "born on 17 January 1820"), ("s-britannica", "born on 17 January 1820")],
    )
    assert corroboration.state == STATE_NONE
    assert corroboration.grounded_source_count == 0
    assert "partially_grounded" in {p["grounding"] for p in per_source}
    assert validation.review_band == "quality_review"
    assert validation.review_reason == "ungrounded"


def test_case_5_death_partial_place_never_synthesizes():
    corroboration, validation, _, per_source = run_claim(
        DEATH_1849,
        [("s-wiki-en", "died on 28 May 1849"), ("s-britannica", "died on 28 May 1849")],
    )
    assert corroboration.state == STATE_NONE
    assert corroboration.grounded_source_count == 0
    assert "partially_grounded" in {p["grounding"] for p in per_source}
    assert validation.review_band == "quality_review"