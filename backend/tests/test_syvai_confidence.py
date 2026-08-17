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
        distinct_source_count=1,
        reliabilities=["0.8"],
    )
    assert 0.60 <= score <= 0.75


def test_multiple_sources_increase_confidence():
    one = compute_confidence(
        validation=_validation(),
        source_count=1,
        distinct_source_count=1,
        reliabilities=["0.8"],
    )
    two = compute_confidence(
        validation=_validation(),
        source_count=2,
        distinct_source_count=2,
        reliabilities=["0.8", "0.8"],
    )
    three = compute_confidence(
        validation=_validation(),
        source_count=3,
        distinct_source_count=3,
        reliabilities=["0.8", "0.8", "0.8"],
    )
    assert one < two < three


def test_conflict_and_invalid_penalized():
    base = compute_confidence(
        validation=_validation(),
        source_count=2,
        distinct_source_count=2,
        reliabilities=["0.8", "0.8"],
    )
    conflict = compute_confidence(
        validation=_validation(state="conflict", conflict="conflict"),
        source_count=2,
        distinct_source_count=2,
        reliabilities=["0.8", "0.8"],
    )
    invalid = compute_confidence(
        validation=_validation(state="invalid"),
        source_count=2,
        distinct_source_count=2,
        reliabilities=["0.8", "0.8"],
    )
    assert conflict < base
    assert invalid < base


def test_duplicate_flag_reduces_confidence():
    clean = compute_confidence(
        validation=_validation(),
        source_count=1,
        distinct_source_count=1,
        reliabilities=["0.8"],
    )
    duplicate = compute_confidence(
        validation=_validation(conflict="duplicate"),
        source_count=1,
        distinct_source_count=1,
        reliabilities=["0.8"],
    )
    assert duplicate < clean


def test_verified_grounding_boosts_confidence():
    """0.2C: a source with deterministically verified evidence adds +0.05."""
    base = compute_confidence(
        validation=_validation(),
        source_count=1,
        distinct_source_count=1,
        reliabilities=["0.8"],
    )
    grounded = compute_confidence(
        validation=_validation(),
        source_count=1,
        distinct_source_count=1,
        reliabilities=["0.8"],
        grounded_source_count=1,
    )
    assert grounded > base


def test_clamped_bounds():
    low = compute_confidence(
        validation=_validation(state="invalid"),
        source_count=0,
        distinct_source_count=0,
        reliabilities=[],
    )
    high = compute_confidence(
        validation=_validation(),
        source_count=3,
        distinct_source_count=3,
        reliabilities=["1.0", "1.0", "1.0"],
    )
    assert low >= 0.10
    assert high <= 0.99
