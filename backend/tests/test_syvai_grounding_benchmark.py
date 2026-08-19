"""Unit tests for the SyvAI 0.2D grounding benchmark."""

import pytest

from app.syvai.evidence import (
    GROUNDING_GROUNDED,
    GROUNDING_NO_EVIDENCE,
    GROUNDING_PARTIAL,
    GROUNDING_UNGROUNDED,
)
from app.syvai.grounding_benchmark import (
    GROUNDING_FIXTURE_CASES,
    GroundingCase,
    evaluate_grounding_cases,
    format_grounding_report,
    run_grounding_benchmark,
)


def test_benchmark_runs_with_zero_false_auto_approvals():
    report = run_grounding_benchmark()
    assert report.total_cases == len(GROUNDING_FIXTURE_CASES) == 13
    assert report.false_auto_approvals == 0
    assert report.grounded_precision == 1.0


def test_benchmark_expected_distribution():
    report = run_grounding_benchmark()
    assert report.expected[GROUNDING_GROUNDED] == 3
    assert report.expected[GROUNDING_PARTIAL] == 7
    assert report.expected[GROUNDING_UNGROUNDED] == 2
    assert report.expected[GROUNDING_NO_EVIDENCE] == 1


def test_benchmark_predicted_matches_expected():
    report = run_grounding_benchmark()
    assert report.predicted == report.expected
    assert report.gate_accuracy == 1.0
    assert report.false_human_reviews == 0


def test_benchmark_detects_false_human_review_for_expected_grounded():
    case = GroundingCase(
        label="Birth of Anne Brontë",
        place="Thornton, Yorkshire, England",
        date_value="1820-01-17",
        evidence="born in Thornton",
        expected=GROUNDING_GROUNDED,
    )
    report = evaluate_grounding_cases([case])
    assert report.false_auto_approvals == 0
    assert report.false_human_reviews == 1
    assert report.grounded_precision == 0.0


def test_benchmark_scores_ungrounded_evidence():
    case = GroundingCase(
        label="Birth of Anne Brontë",
        date_value="1820-01-17",
        evidence="fabricated text",
        expected=GROUNDING_UNGROUNDED,
    )
    report = evaluate_grounding_cases([case])
    assert report.predicted[GROUNDING_UNGROUNDED] == 1
    assert report.false_auto_approvals == 0


def test_format_report_contains_key_metrics():
    text = format_grounding_report(run_grounding_benchmark())
    for label in [
        "grounding precision",
        "auto-approval gate accuracy",
        "false auto-approvals",
        "false human reviews",
    ]:
        assert label in text


def test_no_evidence_never_grounded():
    case = GroundingCase(
        label="Birth of Anne Brontë",
        date_value="1820-01-17",
        evidence=None,
        expected=GROUNDING_NO_EVIDENCE,
    )
    report = evaluate_grounding_cases([case])
    assert report.predicted[GROUNDING_NO_EVIDENCE] == 1
    assert report.false_auto_approvals == 0
