"""Unit tests for SyvAI 0.2D material-detail evidence verification.

Covers the 0.2C semantics (verbatim matching, bounds, no-evidence states)
plus the 0.2D hardening: an evidence fragment is only ``grounded`` when it
supports EVERY material detail the claim asserts — its own year, its place,
its named entities, and at least one distinctive claim token — conjunctively.
"""

import pytest

from app.syvai.evidence import (
    GROUNDING_GROUNDED,
    GROUNDING_NO_EVIDENCE,
    GROUNDING_PARTIAL,
    GROUNDING_UNGROUNDED,
    build_material_requirements,
    extract_detail_tokens,
    normalize_evidence,
    verify_evidence,
)

CITATION = (
    "Anne Brontë (17 January 1820 – 28 May 1849) was an English novelist and poet, "
    "the youngest member of the Brontë literary family. Her first novel, Agnes Grey, "
    "was published in 1847. She died of tuberculosis in Scarborough, where a memorial "
    "window commemorates her."
)

MATRIX_CITATION = (
    "Anne Brontë was born in Thornton, Yorkshire, England on 17 January 1820. "
    "She was known for her 1847 novel Agnes Grey and her 1848 novel The Tenant of "
    "Wildfell Hall. Anne Brontë died of tuberculosis in Scarborough, England on "
    "28 May 1849."
)


def _requirements(label="", description=None, place=None, date_value=None):
    return build_material_requirements(
        label=label,
        description=description,
        place=place,
        date_value=date_value,
    )


def test_verbatim_fragment_supporting_all_details_is_grounded():
    material = _requirements(label="Publication of Agnes Grey", date_value="1847")
    result = verify_evidence(
        "Her first novel, Agnes Grey, was published in 1847.",
        CITATION,
        material=material,
    )
    assert result.state == GROUNDING_GROUNDED
    assert result.is_grounded


def test_grounded_without_year_when_no_year_asserted():
    material = _requirements(
        label="Death of Anne Brontë in Scarborough",
        description="Anne Brontë died of tuberculosis in Scarborough.",
        place="Scarborough",
    )
    result = verify_evidence(
        "Anne Brontë died of tuberculosis in Scarborough",
        MATRIX_CITATION,
        material=material,
    )
    assert result.state == GROUNDING_GROUNDED


def test_paraphrase_not_present_in_source_is_ungrounded():
    material = _requirements(label="Death of Anne Brontë", place="Scarborough", date_value="1849")
    result = verify_evidence(
        "Anne Bronte died while on holiday at the seaside resort.",
        CITATION,
        material=material,
    )
    assert result.state == GROUNDING_UNGROUNDED


def test_generic_verbatim_fragment_without_material_is_partially_grounded():
    result = verify_evidence("an English novelist and poet", CITATION)
    assert result.state == GROUNDING_PARTIAL


def test_no_evidence_fragment():
    material = _requirements(label="Death of Anne Brontë")
    result = verify_evidence(None, CITATION, material=material)
    assert result.state == GROUNDING_NO_EVIDENCE
    result = verify_evidence("   ", CITATION, material=material)
    assert result.state == GROUNDING_NO_EVIDENCE


def test_too_short_fragment_is_ungrounded():
    result = verify_evidence("1847", CITATION)
    assert result.state == GROUNDING_UNGROUNDED


def test_too_long_fragment_is_ungrounded():
    result = verify_evidence("x" * 800, CITATION)
    assert result.state == GROUNDING_UNGROUNDED


def test_missing_source_text_is_ungrounded():
    material = _requirements(label="Publication of Agnes Grey", date_value="1847")
    result = verify_evidence(
        "Her first novel, Agnes Grey, was published in 1847.",
        None,
        material=material,
    )
    assert result.state == GROUNDING_UNGROUNDED


def test_matching_tolerates_whitespace_and_punctuation_differences():
    material = _requirements(label="Agnes Grey published", date_value="1847")
    result = verify_evidence(
        "Agnes Grey, was published in 1847", "Renamed. Agnes Grey,\nwas published in 1847. After.",
        material=material,
    )
    assert result.state == GROUNDING_GROUNDED


def test_normalize_evidence_collapses_punctuation():
    assert normalize_evidence("  Anne Brontë's  'voice' — calm. ") == "anne brontë s voice — calm"


def test_extract_detail_tokens_skips_stopwords_and_short_tokens():
    tokens = extract_detail_tokens("The death of Anne Brontë in Scarborough", "in 1849")
    assert "death" in tokens
    assert "scarborough" in tokens
    assert "bront" in tokens
    assert "the" not in tokens
    assert "in" not in tokens


def test_build_material_requirements_extracts_year_from_date_value():
    assert _requirements(label="X", date_value="1820-01-17").year == "1820"
    assert _requirements(label="X", date_value="1847").year == "1847"
    assert _requirements(label="X", date_value="1849-05-28").year == "1849"
    assert _requirements(label="X", date_value="circa 1847").year == "1847"
    assert _requirements(label="X", date_value=None).year is None


def test_build_material_requirements_extracts_place_tokens():
    req = _requirements(label="X", place="Thornton, Yorkshire, England")
    assert req.place_tokens == frozenset({"thornton", "yorkshire", "england"})


def test_build_material_requirements_extracts_entity_tokens_from_capitalized_runs():
    req = _requirements(
        label="Publication of The Tenant of Wildfell Hall",
        description="Considered to be one of the first feminist novels.",
    )
    assert {"tenant", "wildfell", "hall"} <= req.entity_tokens


def test_build_material_requirements_extracts_distinctive_tokens():
    req = _requirements(label="Publication of Agnes Grey", date_value="1847")
    assert {"publication", "agnes", "grey"} <= req.distinctive_tokens


# ---------------------------------------------------------------------------
# 0.2D adversarial matrix A-I: each case proves a 0.2C weakness is closed.
# ---------------------------------------------------------------------------


def _assert_not_auto_approvable(evidence, *, expected, label="", description=None,
                                place=None, date_value=None):
    material = _requirements(label=label, description=description, place=place, date_value=date_value)
    result = verify_evidence(evidence, MATRIX_CITATION, material=material)
    assert not result.is_grounded, f"expected {expected}, got grounded: {result.reason}"
    assert result.state == expected, result.reason


def test_matrix_a_year_only_fragment_is_partially_grounded():
    """0.2C: a fragment quoting just the date grounded because has_year.
    0.2D: the claim's distinctive wording is unsupported -> human review."""
    _assert_not_auto_approvable(
        "17 January 1820",
        expected=GROUNDING_PARTIAL,
        label="Born",
        date_value="1820",
    )


def test_matrix_b_single_proper_noun_only_is_partially_grounded():
    """0.2C: a fragment naming only one proper noun (e.g. Thornton) grounded.
    0.2D: the claim year and entities are unsupported -> human review."""
    _assert_not_auto_approvable(
        "born in Thornton",
        expected=GROUNDING_PARTIAL,
        label="Birth of Anne Brontë",
        place="Thornton, Yorkshire, England",
        date_value="1820-01-17",
    )


def test_matrix_c_unrelated_year_elsewhere_is_partially_grounded():
    """0.2C: ANY year in the fragment grounded, even a different event's year.
    0.2D: only the claim's own year counts -> human review."""
    _assert_not_auto_approvable(
        "her 1848 novel The Tenant of Wildfell Hall",
        expected=GROUNDING_PARTIAL,
        label="Birth of Anne Brontë",
        date_value="1820",
    )


def test_matrix_d_asserted_place_unsupported_is_partially_grounded():
    """0.2C: unsupported place did not block approval.
    0.2D: every significant place token is required -> human review."""
    _assert_not_auto_approvable(
        "on 17 January 1820",
        expected=GROUNDING_PARTIAL,
        label="Birth of Anne Brontë",
        place="Thornton, Yorkshire, England",
        date_value="1820-01-17",
    )


def test_matrix_e_asserted_named_entity_unsupported_is_partially_grounded():
    """0.2C: a single matching title token grounded.
    0.2D: every significant token of each named entity is required -> review."""
    _assert_not_auto_approvable(
        "She was known for her 1847 novel",
        expected=GROUNDING_PARTIAL,
        label="Publication of Agnes Grey",
        description="Anne Brontë's first novel",
        date_value="1847",
    )


def test_matrix_f_distinctive_claim_detail_absent_is_partially_grounded():
    """0.2C: year + place sufficed even when the claim's own wording was absent.
    0.2D: at least one distinctive claim token is required -> human review."""
    _assert_not_auto_approvable(
        "on 17 January 1820",
        expected=GROUNDING_PARTIAL,
        label="Moved to the parsonage",
        date_value="1820",
    )


def test_matrix_g_fully_supported_fragment_is_grounded():
    material = _requirements(label="Publication of Agnes Grey", date_value="1847")
    result = verify_evidence(
        "her 1847 novel Agnes Grey",
        MATRIX_CITATION,
        material=material,
    )
    assert result.state == GROUNDING_GROUNDED


def test_matrix_h_fabricated_evidence_is_ungrounded():
    _assert_not_auto_approvable(
        "Anne Brontë was born in Haworth",
        expected=GROUNDING_UNGROUNDED,
        label="Birth of Anne Brontë",
        place="Thornton",
        date_value="1820-01-17",
    )


def test_matrix_i_no_evidence_is_no_evidence():
    material = _requirements(label="Birth of Anne Brontë", date_value="1820-01-17")
    result = verify_evidence(None, MATRIX_CITATION, material=material)
    assert result.state == GROUNDING_NO_EVIDENCE
    assert not result.is_grounded


def test_partial_is_persistable_but_not_grounded():
    material = _requirements(
        label="Death of Anne Brontë",
        place="Scarborough, England",
        date_value="1849-05-28",
    )
    result = verify_evidence(
        "Anne Brontë was born in Thornton, Yorkshire, England on 17 January 1820",
        MATRIX_CITATION,
        material=material,
    )
    assert result.state == GROUNDING_PARTIAL
    assert not result.is_grounded
    assert result.is_persistable


def test_year_must_be_the_claims_own_year():
    material = _requirements(label="Death of Anne Brontë", place="Scarborough", date_value="1849")
    result = verify_evidence(
        "Anne Brontë died of tuberculosis in Scarborough, England on 28 May 1849",
        MATRIX_CITATION,
        material=material,
    )
    assert result.state == GROUNDING_GROUNDED
    wrong_year = _requirements(label="Death of Anne Brontë", place="Scarborough", date_value="1848")
    result = verify_evidence(
        "Anne Brontë died of tuberculosis in Scarborough, England on 28 May 1849",
        MATRIX_CITATION,
        material=wrong_year,
    )
    assert result.state == GROUNDING_PARTIAL
