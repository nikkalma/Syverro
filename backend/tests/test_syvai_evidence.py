"""Unit tests for SyvAI 0.2C claim-level evidence verification."""

from app.syvai.evidence import (
    GROUNDING_GROUNDED,
    GROUNDING_NO_EVIDENCE,
    GROUNDING_PARTIAL,
    GROUNDING_UNGROUNDED,
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


def test_verbatim_fragment_with_year_is_grounded():
    result = verify_evidence(
        "Her first novel, Agnes Grey, was published in 1847.",
        CITATION,
        detail_tokens=extract_detail_tokens("Agnes Grey published"),
    )
    assert result.is_grounded
    assert result.state == GROUNDING_GROUNDED


def test_verbatim_fragment_with_claim_term_is_grounded_without_year():
    result = verify_evidence(
        "She died of tuberculosis in Scarborough",
        CITATION,
        detail_tokens=extract_detail_tokens("Death of Anne Bronte in Scarborough"),
    )
    assert result.state == GROUNDING_GROUNDED


def test_paraphrase_not_present_in_source_is_ungrounded():
    result = verify_evidence(
        "Anne Bronte died while on holiday at the seaside resort.",
        CITATION,
        detail_tokens=extract_detail_tokens("Anne Bronte death"),
    )
    assert result.state == GROUNDING_UNGROUNDED


def test_generic_verbatim_fragment_is_partially_grounded():
    result = verify_evidence("an English novelist and poet", CITATION)
    assert result.state == GROUNDING_PARTIAL


def test_no_evidence_fragment():
    result = verify_evidence(None, CITATION)
    assert result.state == GROUNDING_NO_EVIDENCE
    result = verify_evidence("   ", CITATION)
    assert result.state == GROUNDING_NO_EVIDENCE


def test_too_short_fragment_is_ungrounded():
    result = verify_evidence("1847", CITATION)
    assert result.state == GROUNDING_UNGROUNDED


def test_too_long_fragment_is_ungrounded():
    result = verify_evidence("x" * 800, CITATION)
    assert result.state == GROUNDING_UNGROUNDED


def test_missing_source_text_is_ungrounded():
    result = verify_evidence("Her first novel, Agnes Grey, was published in 1847.", None)
    assert result.state == GROUNDING_UNGROUNDED


def test_matching_tolerates_whitespace_and_punctuation_differences():
    result = verify_evidence(
        "Agnes Grey, was published in 1847", "Renamed. Agnes Grey,\nwas published in 1847. After."
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