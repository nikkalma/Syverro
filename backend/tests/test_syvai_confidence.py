"""Unit tests for explainable confidence (0.2D grounded + 0.2E corroboration)."""

import pytest

from app.syvai.confidence import (
    compute_confidence,
    normalize_reliability,
    source_reliability_score,
)
from app.syvai.validators import ValidationResult


def _validation(state="validated", conflict="new"):
    return ValidationResult(
        validation_state=state,
        conflict_state=conflict,
        issues=[],
    )


def test_normalize_reliability_legacy_scales():
    assert normalize_reliability("0.8") == 0.8
    assert normalize_reliability("0.5") == 0.5
    assert normalize_reliability("5") == 1.0
    assert normalize_reliability("4") == 0.9
    assert normalize_reliability("3") == 0.7
    assert normalize_reliability("2") == 0.5
    assert normalize_reliability("1") == 0.3
    assert normalize_reliability("1.0") == 1.0
    assert normalize_reliability(None) == 0.5
    assert normalize_reliability("garbage") == 0.5
    assert normalize_reliability(1.4) == 0.3


def test_source_reliability_score_mean():
    assert source_reliability_score([]) == 0.0
    assert source_reliability_score(["0.8", "0.6"]) == pytest.approx(0.7)


def test_single_source_validated_baseline():
    score = compute_confidence(
        validation=_validation(),
        source_count=1,
        reliabilities=["0.8"],
    )
    assert 0.60 <= score <= 0.75


def test_solely_linked_duplicates_do_not_inflate_confidence():
    """0.2E: two same-family grounded sources must NOT score like two independents."""
    same_family = compute_confidence(
        validation=_validation(),
        source_count=2,
        reliabilities=["0.7", "0.7"],
        grounded_source_count=2,
        independent_grounded_source_count=1,
        grounded_reliabilities=["0.7", "0.7"],
    )
    one_grounded = compute_confidence(
        validation=_validation(),
        source_count=1,
        reliabilities=["0.7"],
        grounded_source_count=1,
        independent_grounded_source_count=1,
        grounded_reliabilities=["0.7"],
    )
    assert same_family == pytest.approx(one_grounded)


def test_two_independent_grounded_increase_confidence():
    one = compute_confidence(
        validation=_validation(),
        source_count=1,
        reliabilities=["0.7"],
        grounded_source_count=1,
        independent_grounded_source_count=1,
        grounded_reliabilities=["0.7"],
    )
    two = compute_confidence(
        validation=_validation(),
        source_count=2,
        reliabilities=["0.7", "0.7"],
        grounded_source_count=2,
        independent_grounded_source_count=2,
        grounded_reliabilities=["0.7", "0.7"],
    )
    three = compute_confidence(
        validation=_validation(),
        source_count=3,
        reliabilities=["0.7", "0.7", "0.7"],
        grounded_source_count=3,
        independent_grounded_source_count=3,
        grounded_reliabilities=["0.7", "0.7", "0.7"],
    )
    assert one < two < three


def test_partial_sources_get_no_reliability_bonus():
    """0.2E: reliability averaging is scoped to GROUNDED sources only."""
    with_partial = compute_confidence(
        validation=_validation(),
        source_count=2,
        reliabilities=["1.0", "1.0"],
        grounded_source_count=1,
        independent_grounded_source_count=1,
        grounded_reliabilities=["0.5"],
    )
    grounded_only = compute_confidence(
        validation=_validation(),
        source_count=1,
        reliabilities=["0.5"],
        grounded_source_count=1,
        independent_grounded_source_count=1,
        grounded_reliabilities=["0.5"],
    )
    assert with_partial == pytest.approx(grounded_only)


def test_conflict_and_invalid_penalized():
    base = compute_confidence(
        validation=_validation(),
        source_count=2,
        reliabilities=["0.8", "0.8"],
        grounded_source_count=2,
        independent_grounded_source_count=2,
        grounded_reliabilities=["0.8", "0.8"],
    )
    conflict = compute_confidence(
        validation=_validation(state="conflict", conflict="conflict"),
        source_count=2,
        reliabilities=["0.8", "0.8"],
        grounded_source_count=2,
        independent_grounded_source_count=2,
        grounded_reliabilities=["0.8", "0.8"],
    )
    invalid = compute_confidence(
        validation=_validation(state="invalid"),
        source_count=2,
        reliabilities=["0.8", "0.8"],
        grounded_source_count=2,
        independent_grounded_source_count=2,
        grounded_reliabilities=["0.8", "0.8"],
    )
    assert conflict < base
    assert invalid < base


def test_duplicate_flag_reduces_confidence():
    clean = compute_confidence(
        validation=_validation(),
        source_count=1,
        reliabilities=["0.8"],
        grounded_source_count=1,
        independent_grounded_source_count=1,
        grounded_reliabilities=["0.8"],
    )
    duplicate = compute_confidence(
        validation=_validation(conflict="duplicate"),
        source_count=1,
        reliabilities=["0.8"],
        grounded_source_count=1,
        independent_grounded_source_count=1,
        grounded_reliabilities=["0.8"],
    )
    assert duplicate < clean


def test_verified_grounding_boosts_confidence():
    """0.2C: a source with deterministically verified evidence adds +0.05."""
    base = compute_confidence(
        validation=_validation(),
        source_count=1,
        reliabilities=["0.8"],
    )
    grounded = compute_confidence(
        validation=_validation(),
        source_count=1,
        reliabilities=["0.8"],
        grounded_source_count=1,
        grounded_reliabilities=["0.8"],
    )
    assert grounded > base


def test_clamped_bounds():
    low = compute_confidence(
        validation=_validation(state="invalid"),
        source_count=0,
        reliabilities=[],
    )
    high = compute_confidence(
        validation=_validation(),
        source_count=3,
        reliabilities=["1.0", "1.0", "1.0"],
        grounded_source_count=3,
        independent_grounded_source_count=3,
        grounded_reliabilities=["1.0", "1.0", "1.0"],
    )
    assert low >= 0.10
    assert high <= 0.99