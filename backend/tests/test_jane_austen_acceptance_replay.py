"""Offline replay and adversarial checks for Jane Austen acceptance remediation."""

from types import SimpleNamespace

import pytest

from app.syvai.discovery.langlinks import ResolvedIdentity, fetch_resolved_document_content
from app.syvai.discovery.verification import inspect_content_capabilities, verify_candidate_identity
from app.syvai.evidence import build_material_requirements, verify_evidence
from app.syvai.timeline_claims import TimelineClaim
from app.syvai.timeline_minimization import minimize_timeline_claim


EMMA_EVIDENCE = (
    "Emma is a novel written by English author Jane Austen. "
    "The novel was first published in December 1815, although the title page is dated 1816."
)


def _claim(**updates):
    data = {
        "event_type": "publication",
        "date_value": "1815-12-01",
        "date_precision": "full",
        "label": "Publication of Emma",
        "description": "Jane Austen's novel 'Emma' was first published.",
        "place": "Highbury, Surrey, England",
        "sources": [{"title": "Emma (novel)", "evidence": EMMA_EVIDENCE}],
    }
    data.update(updates)
    return TimelineClaim.model_validate(data)


def test_exact_jane_austen_replay_shrinks_claim_to_direct_grounding():
    claim = minimize_timeline_claim(_claim(), [EMMA_EVIDENCE])
    assert claim.date_value == "1815-12"
    assert claim.date_precision == "month"
    assert claim.place is None
    assert claim.description == "Jane Austen's novel 'Emma' was first published."

    material = build_material_requirements(
        label=claim.label,
        description=claim.description,
        place=claim.place,
        date_value=claim.date_value,
    )
    verification = verify_evidence(EMMA_EVIDENCE, EMMA_EVIDENCE, material=material)
    assert verification.verification_state == "direct_grounded"


@pytest.mark.parametrize(
    "date_value,evidence,expected_value,expected_precision",
    [
        ("1815-12-01", "Emma was published in December 1815.", "1815-12", "month"),
        ("1815-12-01", "Emma was published in 1815.", "1815", "year"),
    ],
)
def test_partial_dates_never_gain_unknown_components(date_value, evidence, expected_value, expected_precision):
    claim = minimize_timeline_claim(_claim(date_value=date_value), [evidence])
    assert (claim.date_value, claim.date_precision) == (expected_value, expected_precision)


def test_source_with_no_place_omits_place():
    assert minimize_timeline_claim(_claim(), [EMMA_EVIDENCE]).place is None


def test_country_without_city_does_not_preserve_city():
    claim = minimize_timeline_claim(
        _claim(place="London, England"),
        ["Emma was published in England in December 1815."],
    )
    assert claim.place is None


def test_city_without_country_does_not_infer_country():
    claim = minimize_timeline_claim(
        _claim(place="London, England"),
        ["Emma was published in London in December 1815."],
    )
    assert claim.place is None


def test_lifespan_dates_do_not_become_active_years():
    claim = minimize_timeline_claim(
        _claim(event_type="career", label="Active literary career", date_value="1775-07-01"),
        ["Jane Austen was born in 1775 and died in 1817."],
    )
    assert claim.event_type == "career"
    assert claim.date_value == "1775"
    material = build_material_requirements(label=claim.label, date_value=claim.date_value)
    assert not verify_evidence(
        "Jane Austen was born in 1775 and died in 1817.",
        "Jane Austen was born in 1775 and died in 1817.",
        material=material,
    ).is_grounded


def test_publication_date_does_not_become_career_date():
    claim = minimize_timeline_claim(
        _claim(event_type="career", label="Career began"),
        ["Emma was first published in December 1815."],
    )
    assert claim.event_type == "career"
    material = build_material_requirements(label=claim.label, date_value=claim.date_value)
    assert not verify_evidence(
        "Emma was first published in December 1815.",
        "Emma was first published in December 1815.",
        material=material,
    ).is_grounded


def test_supported_core_drops_unsupported_optional_description():
    claim = minimize_timeline_claim(
        _claim(description="Emma transformed the English literary canon.", place=None),
        ["Emma was first published in December 1815."],
    )
    assert claim.description is None


def _resolved_identity():
    return ResolvedIdentity(
        source_variant="Джейн Остин",
        ru_title="Остин, Джейн",
        en_title="Jane Austen",
        en_url="https://en.wikipedia.org/wiki/Jane_Austen",
        romanized_terms=("Jane Austen",),
    )


def test_resolved_identity_term_validates_creator_without_fuzzy_transliteration():
    result = verify_candidate_identity(
        query_terms=["Джейн Остин"],
        title="Pride and Prejudice",
        metadata_fields={"creator": "Jane Austen"},
        origin="archive_search",
        resolved_identity=_resolved_identity(),
        candidate_url="https://archive.org/details/pride-prejudice",
    )
    assert result["state"] == "verified"
    assert result["method"] == "structured_creator_resolved_identity_term"
    assert result["matched_identity_term"] == "Jane Austen"


def test_unresolved_or_colliding_identity_exports_no_trusted_alias():
    unresolved = verify_candidate_identity(
        query_terms=["Джейн Остин"],
        title="Pride and Prejudice",
        metadata_fields={"creator": "Jane Austen"},
        origin="archive_search",
        resolved_identity=None,
    )
    collision = verify_candidate_identity(
        query_terms=["Джейн Остин"],
        title="A different work",
        metadata_fields={"creator": "Jane Austin"},
        origin="archive_search",
        resolved_identity=_resolved_identity(),
    )
    assert unresolved["state"] == "rejected"
    assert collision["state"] == "rejected"


@pytest.mark.asyncio
async def test_resolved_document_content_is_separate_from_identity_material():
    class Fetcher:
        async def fetch(self, _url):
            return SimpleNamespace(text='{"query":{"pages":[{"title":"Jane Austen","extract":"Jane Austen (1775–1817) was an English novelist associated with literary realism."}]}}')

    content = await fetch_resolved_document_content(_resolved_identity(), fetcher=Fetcher())
    capabilities, evidence = inspect_content_capabilities(evidence=content, metadata_fields={})
    assert {"BIOGRAPHY", "DATES", "OCCUPATIONS", "LITERARY_CONTEXT"}.issubset(capabilities)
    assert all(evidence[capability] for capability in capabilities)
