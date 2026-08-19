"""SyvAI 0.2E corroboration adversarial matrix (A-K).

Each case exercises the source-family classifier + corroboration classification
without any provider call. The matrix mirrors the Phase 6 requirements:

  A  one grounded source                      -> single_source
  B  two distinct grounded sources            -> corroborated
  C  two same-family grounded sources         -> single_source (NOT corroborated)
  D  duplicate URL variants                   -> single_source (same family)
  E  grounded + partially-grounded            -> single_source (partial never counts)
  F  two partially-grounded                   -> none (no synthesis)
  G  grounded + fabricated (ungrounded)       -> single_source
  H  three grounded, two families             -> corroborated
  I  same domain, different articles          -> single_source (same family)
  J  unparseable / unknown URL                -> no inflation (single family bucket)
  K  multiple sources, unsupported detail     -> none (grounding gate first)
"""

from __future__ import annotations

import pytest

from app.syvai.corroboration import (
    STATE_CORROBORATED,
    STATE_NONE,
    STATE_SINGLE_SOURCE,
    UNKNOWN_FAMILY,
    corroborate_sources,
    source_family,
)

WIKIPEDIA_ANNE = "https://en.wikipedia.org/wiki/Anne_Bront%C3%AB"
WIKIPEDIA_FR = "https://fr.wikipedia.org/wiki/Anne_Bront%C3%AB"
BRITANNICA_ANNE = "https://www.britannica.com/biography/Anne-Bronte"
LOC = "https://www.loc.gov/item/2020123456/"


def _src(url: str | None, normalized_url: str | None = None) -> dict:
    return {"url": url, "normalized_url": normalized_url}


# ---------------------------------------------------------------------------
# Family classifier
# ---------------------------------------------------------------------------


def test_family_wikipedia_mirrors_collapse():
    assert source_family(WIKIPEDIA_ANNE) == "wikipedia.org"
    assert source_family(WIKIPEDIA_FR) == "wikipedia.org"
    assert source_family(WIKIPEDIA_ANNE) == source_family(WIKIPEDIA_FR)


def test_family_distinct_registrable_domains():
    assert source_family(BRITANNICA_ANNE) == "britannica.com"
    assert source_family(LOC) == "loc.gov"
    assert source_family(BRITANNICA_ANNE) != source_family(LOC)


def test_family_uses_normalized_url_when_url_else_fallback():
    assert source_family("https://example.com/path", normalized_url="https://example.com/path") == "example.com"
    assert source_family(None, normalized_url="https://example.com/path") == "example.com"
    assert source_family("https://example.com/path") == "example.com"


def test_family_unparseable_or_missing_is_unknown_bucket():
    assert source_family(None) == UNKNOWN_FAMILY
    assert source_family("") == UNKNOWN_FAMILY
    assert source_family("not a url") == UNKNOWN_FAMILY
    assert source_family("ftp://example.com/file") == UNKNOWN_FAMILY


# ---------------------------------------------------------------------------
# Matrix
# ---------------------------------------------------------------------------


def test_case_a_one_grounded_single_source():
    result = corroborate_sources([_src(BRITANNICA_ANNE)], [True])
    assert result.state == STATE_SINGLE_SOURCE
    assert result.grounded_source_count == 1
    assert result.independent_grounded_source_count == 1


def test_case_b_two_distinct_grounded_corroborated():
    result = corroborate_sources([_src(BRITANNICA_ANNE), _src(LOC)], [True, True])
    assert result.state == STATE_CORROBORATED
    assert result.grounded_source_count == 2
    assert result.independent_grounded_source_count == 2


def test_case_c_two_same_family_grounded_single_source():
    result = corroborate_sources([_src(WIKIPEDIA_ANNE), _src(WIKIPEDIA_FR)], [True, True])
    assert result.state == STATE_SINGLE_SOURCE
    assert result.grounded_source_count == 2
    assert result.independent_grounded_source_count == 1


def test_case_d_duplicate_url_variants_single_source():
    a = _src("https://example.com/a?utm_source=x", normalized_url="https://example.com/a")
    b = _src("https://example.com/a#frag", normalized_url="https://example.com/a")
    result = corroborate_sources([a, b], [True, True])
    assert result.state == STATE_SINGLE_SOURCE
    assert result.independent_grounded_source_count == 1


def test_case_e_grounded_plus_partial_single_source():
    result = corroborate_sources([_src(BRITANNICA_ANNE), _src(WIKIPEDIA_ANNE)], [True, False])
    assert result.state == STATE_SINGLE_SOURCE
    assert result.grounded_source_count == 1
    assert result.independent_grounded_source_count == 1


def test_case_f_two_partial_none_no_synthesis():
    result = corroborate_sources([_src(BRITANNICA_ANNE), _src(LOC)], [False, False])
    assert result.state == STATE_NONE
    assert result.grounded_source_count == 0
    assert result.independent_grounded_source_count == 0


def test_case_g_grounded_plus_fabricated_single_source():
    result = corroborate_sources([_src(BRITANNICA_ANNE), _src(LOC)], [True, False])
    assert result.state == STATE_SINGLE_SOURCE
    assert result.grounded_source_count == 1


def test_case_h_three_grounded_two_families_corroborated():
    result = corroborate_sources(
        [_src(WIKIPEDIA_ANNE), _src(WIKIPEDIA_FR), _src(BRITANNICA_ANNE)],
        [True, True, True],
    )
    assert result.state == STATE_CORROBORATED
    assert result.grounded_source_count == 3
    assert result.independent_grounded_source_count == 2


def test_case_i_same_domain_different_articles_single_source():
    a = _src("https://example.com/biography/anne")
    b = _src("https://example.com/biography/emily")
    result = corroborate_sources([a, b], [True, True])
    assert result.state == STATE_SINGLE_SOURCE
    assert result.independent_grounded_source_count == 1


def test_case_j_unparseable_url_no_inflation():
    a = _src("not a url")
    b = _src("???")
    result = corroborate_sources([a, b], [True, True])
    assert result.state == STATE_SINGLE_SOURCE
    assert result.independent_grounded_source_count == 1


def test_case_k_unsupported_material_detail_no_corroboration():
    result = corroborate_sources([_src(BRITANNICA_ANNE), _src(LOC)], [False, False])
    assert result.state == STATE_NONE
    assert result.grounded_source_count == 0


# ---------------------------------------------------------------------------
# Conservative properties
# ---------------------------------------------------------------------------


def test_grounded_flags_mismatch_is_bounded_by_zip():
    result = corroborate_sources([_src(BRITANNICA_ANNE), _src(LOC)], [True])
    assert result.linked_source_count == 2
    assert result.grounded_source_count == 1


def test_sources_with_attributes_supported():
    from types import SimpleNamespace

    a = SimpleNamespace(url=BRITANNICA_ANNE, normalized_url=None)
    result = corroborate_sources([a], [True])
    assert result.state == STATE_SINGLE_SOURCE


def test_to_dict_roundtrip():
    result = corroborate_sources([_src(BRITANNICA_ANNE), _src(LOC)], [True, True])
    payload = result.to_dict()
    assert payload == {
        "state": STATE_CORROBORATED,
        "linked_source_count": 2,
        "grounded_source_count": 2,
        "independent_grounded_source_count": 2,
    }