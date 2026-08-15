from app.syvai.benchmark import (
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
    expected = (report.needs_review_count + report.conflict_count + report.invalid_count) / report.total_claims
    assert report.human_intervention_ratio == expected
    assert 0.0 < report.human_intervention_ratio < 1.0


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
