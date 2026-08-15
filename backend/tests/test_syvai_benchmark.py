import pytest

from app.syvai.benchmark import (
    EMILY_FIXTURE_CLAIMS,
    EMILY_REFERENCE_TIMELINE,
    FIXTURE_CLAIMS,
    ProposalSnapshot,
    REFERENCE_TIMELINE,
    evaluate_snapshots,
    format_report,
    offline_benchmark,
)
from app.syvai.timeline_claims import SourceRef, TimelineClaim, parse_timeline_claims
from app.syvai.validators import ExistingEvent, validate_timeline_claim


def _snapshot(claim, *, source_count=2, conflict_state="new", validation_state="validated", **overrides):
    values = {
        "event_type": claim.event_type,
        "date_value": claim.date_value,
        "date_precision": claim.date_precision,
        "label": claim.label,
        "description": claim.description,
        "validation_state": validation_state,
        "conflict_state": conflict_state,
        "confidence": 0.9,
        "source_count": source_count,
    }
    values.update(overrides)
    return ProposalSnapshot(**values)


def test_offline_benchmark_metrics_are_sane():
    report = offline_benchmark()
    assert report.total_claims == 16
    assert report.reference_count == len(REFERENCE_TIMELINE) == 10
    assert report.precision <= 1.0
    assert report.recall <= 1.0
    assert report.schema_valid_rate == 1.0
    assert report.unsupported_count == 1
    assert report.duplicate_expected == 1
    assert report.duplicate_flagged == 1
    assert report.duplicate_detection_rate == 1.0
    assert report.conflict_expected == 1
    assert report.conflict_flagged == 1
    assert report.conflict_detection_rate == 1.0


def test_offline_benchmark_human_intervention():
    report = offline_benchmark()
    expected = report.reviewed_count / report.total_claims
    assert report.human_intervention_ratio == expected
    assert 0.0 < report.human_intervention_ratio < 1.0
    assert report.human_intervention_ratio < 0.3


def test_offline_benchmark_review_bands_and_correction_ratio():
    """0.1B: quality/policy separation, auto-resolution, correction signal."""
    report = offline_benchmark()
    assert report.reviewed_count == 3
    assert report.quality_review_count == 2
    assert report.policy_review_count == 1
    assert report.auto_approved_count == 2
    assert report.auto_rejected_count == 11
    assert report.auto_resolved_count == 13
    assert report.review_reason_counts["date_conflict"] == 1
    assert report.review_reason_counts["unsupported_claim"] == 1
    assert report.review_reason_counts["posthumous_event"] == 1
    assert report.review_reason_counts["restatement"] == 2
    assert report.review_reason_counts["exact_duplicate"] == 9
    assert report.review_reason_counts["new_grounded"] == 2
    assert report.corrections_expected == 2
    assert report.confirmations_expected == 1
    assert report.correction_ratio == pytest.approx(2 / 3, abs=0.001)


def test_emily_offline_benchmark_is_comparable():
    """The unchanged pipeline must generalize to Emily with comparable metrics."""
    report = offline_benchmark("emily")
    assert report.total_claims == len(EMILY_FIXTURE_CLAIMS) == 13
    assert report.reference_count == len(EMILY_REFERENCE_TIMELINE) == 8
    assert report.recall == 1.0
    assert report.precision <= 1.0
    assert report.duplicate_detection_rate == 1.0
    assert report.conflict_detection_rate == 1.0
    assert report.reviewed_count == 3
    assert report.quality_review_count == 2
    assert report.policy_review_count == 1
    assert report.auto_rejected_count == 9
    assert report.correction_ratio == pytest.approx(2 / 3, abs=0.001)
    assert report.human_intervention_ratio == pytest.approx(3 / 13, abs=0.001)


def test_correction_ratio_is_none_without_ground_truth():
    claims = parse_timeline_claims(
        '[{"event_type": "milestone", "date_value": "1831", "date_precision": "year", "label": "Roe Head"}]'
    )
    snapshots = [_snapshot(claims[0])]
    report = evaluate_snapshots(snapshots)
    assert report.correction_ratio is None
    assert report.corrections_expected == 0


def test_detection_rates_are_none_without_ground_truth():
    report = offline_benchmark()
    claims = parse_timeline_claims(
        '[{"event_type": "milestone", "date_value": "1831", "date_precision": "year", "label": "Roe Head"}]'
    )
    snapshots = [_snapshot(claims[0])]
    report = evaluate_snapshots(snapshots)
    assert report.duplicate_detection_rate is None
    assert report.conflict_detection_rate is None


def test_format_report_contains_key_labels():
    report = offline_benchmark()
    text = format_report(report)
    for label in [
        "precision",
        "recall",
        "exact date accuracy",
        "unsupported rate",
        "duplicate detection",
        "conflict detection",
        "human-intervention ratio",
    ]:
        assert label in text


def test_matched_reference_coverage():
    report = offline_benchmark()
    assert report.covered_references == 10
    assert report.recall == 1.0


def test_ground_truth_labels_are_in_fixture():
    labels = [label for _, label in FIXTURE_CLAIMS]
    assert set(labels) == {"match", "new", "unsupported", "duplicate", "conflict"}
