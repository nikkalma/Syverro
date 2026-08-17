"""Unit tests for the SyvAI 0.2E corroboration benchmark."""

import pytest

from app.syvai.corroboration import STATE_CORROBORATED, STATE_SINGLE_SOURCE
from app.syvai.corroboration_benchmark import (
    CORROBORATION_FIXTURE_CASES,
    CorroborationCase,
    evaluate_corroboration_cases,
    format_corroboration_report,
    run_corroboration_benchmark,
)


def test_benchmark_runs_with_zero_false_corroborations():
    report = run_corroboration_benchmark()
    assert report.total_cases == len(CORROBORATION_FIXTURE_CASES) == 11
    assert report.false_corroborations == 0


def test_benchmark_targets_all_zero():
    report = run_corroboration_benchmark()
    assert report.duplicate_family_inflation == 0
    assert report.false_auto_approvals == 0
    assert report.false_human_reviews == 0


def test_benchmark_expected_distribution():
    report = run_corroboration_benchmark()
    assert report.expected[STATE_CORROBORATED] == 2
    assert report.expected[STATE_SINGLE_SOURCE] == 7
    assert report.predicted == report.expected
    assert report.correctly_classified == report.total_cases == 11
    assert report.accuracy == 1.0


def test_benchmark_detects_false_corroboration_when_same_family_counted_twice():
    # A human mis-biasing the expectation to "corroborated" for a same-family
    # pair must surface as an under-count discrepancy, not a false positive.
    case = CorroborationCase(
        label="same family wrongly expected as corroborated",
        sources=[
            {"url": "https://en.wikipedia.org/wiki/Anne_Bront%C3%AB"},
            {"url": "https://fr.wikipedia.org/wiki/Anne_Bront%C3%AB"},
        ],
        grounded=[True, True],
        expected_state=STATE_CORROBORATED,
        expected_independent=2,
    )
    report = evaluate_corroboration_cases([case])
    assert report.per_case[0]["predicted"] == STATE_SINGLE_SOURCE
    assert report.missed_corroborations == 1
    assert report.false_auto_approvals == 0
    assert report.false_corroborations == 0


def test_format_report_contains_key_metrics():
    text = format_corroboration_report(run_corroboration_benchmark())
    for label in [
        "false corroborations",
        "duplicate family inflation",
        "false auto-approvals",
        "false human reviews",
    ]:
        assert label in text