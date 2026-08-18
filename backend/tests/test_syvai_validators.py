import pytest

from app.syvai.timeline_claims import TimelineClaim
from app.syvai.validators import (
    REVIEW_BAND_AUTO_APPROVED,
    REVIEW_BAND_AUTO_REJECTED,
    REVIEW_BAND_POLICY,
    REVIEW_BAND_QUALITY,
    REVIEW_REASON_DATE_CONFLICT,
    REVIEW_REASON_EXACT_DUPLICATE,
    REVIEW_REASON_INVALID_CLAIM,
    REVIEW_REASON_NEAR_DUPLICATE_AMBIGUOUS,
    REVIEW_REASON_NEW_GROUNDED,
    REVIEW_REASON_POSTHUMOUS,
    REVIEW_REASON_RESTATEMENT,
    REVIEW_REASON_UNGROUNDED,
    REVIEW_REASON_UNSUPPORTED,
    ExistingEvent,
    align_date_precision,
    date_granularity,
    labels_similar,
    normalize_date_value,
    normalize_label,
    parse_date,
    validate_timeline_claim,
)

REFERENCE_EVENTS = [
    ExistingEvent(id="ref-1", event_type="education", date_value="1824", date_precision="year", label="Cowan Bridge school"),
    ExistingEvent(id="ref-2", event_type="personal", date_value="1854-06-29", date_precision="full", label="Marriage to Arthur Bell Nicholls"),
]


def _claim(**overrides):
    values = {
        "event_type": "milestone",
        "date_value": "1831",
        "date_precision": "year",
        "label": "Roe Head school",
    }
    values.update(overrides)
    return TimelineClaim(**values)


def test_normalize_date_value_handles_qualifiers():
    assert normalize_date_value("early 1840s") == "1840"
    assert normalize_date_value("circa 1847") == "1847"
    assert normalize_date_value("late-1840s") == "1840"
    assert normalize_date_value("1847-10-16") == "1847-10-16"


def test_parse_date_formats():
    parsed = parse_date("1847-10-16")
    assert (parsed.year, parsed.month, parsed.day) == (1847, 10, 16)
    parsed = parse_date("1848-09")
    assert (parsed.year, parsed.month, parsed.day) == (1848, 9, None)
    parsed = parse_date("1824")
    assert (parsed.year, parsed.month, parsed.day) == (1824, None, None)


def test_parse_date_rejects_invalid():
    assert parse_date("not a date") is None
    assert parse_date("1847-02-30") is None
    assert parse_date("1847-13") is None


def test_date_granularity():
    assert date_granularity("1847-10-16") == "full"
    assert date_granularity("1848-09") == "month"
    assert date_granularity("1824") == "year"


def test_labels_similar():
    assert labels_similar("Death of Emily Bronte", "Death of Emily Brontë")
    assert labels_similar("Shirley published", "Shirley published in three volumes")
    assert not labels_similar("Shirley published", "Jane Eyre published")


def test_validated_claim():
    result = validate_timeline_claim(
        _claim(),
        author_birth_date="1816-04-21",
        author_death_date="1855-03-31",
        existing_events=REFERENCE_EVENTS,
        source_count=2,
    )
    assert result.validation_state == "validated"
    assert result.conflict_state == "new"
    assert result.review_band == REVIEW_BAND_AUTO_APPROVED
    assert result.review_reason == REVIEW_REASON_NEW_GROUNDED


def test_missing_sources_forces_needs_review():
    result = validate_timeline_claim(
        _claim(),
        author_birth_date="1816-04-21",
        author_death_date="1855-03-31",
        existing_events=REFERENCE_EVENTS,
        source_count=0,
    )
    assert result.validation_state == "needs_review"
    assert "no supporting source evidence" in result.issues
    assert result.review_band == REVIEW_BAND_QUALITY
    assert result.review_reason == REVIEW_REASON_UNSUPPORTED


def test_invalid_date_format_is_invalid():
    result = validate_timeline_claim(
        _claim(date_value="july 1831"),
        author_birth_date="1816-04-21",
        author_death_date="1855-03-31",
        existing_events=REFERENCE_EVENTS,
        source_count=1,
    )
    assert result.validation_state == "invalid"
    assert result.review_band == REVIEW_BAND_AUTO_REJECTED
    assert result.review_reason == REVIEW_REASON_INVALID_CLAIM


def test_before_birth_is_invalid():
    result = validate_timeline_claim(
        _claim(date_value="1801"),
        author_birth_date="1816-04-21",
        author_death_date="1855-03-31",
        existing_events=REFERENCE_EVENTS,
        source_count=1,
    )
    assert result.validation_state == "invalid"
    assert "precedes author birth" in " ".join(result.issues)
    assert result.review_band == REVIEW_BAND_AUTO_REJECTED


def test_precision_label_is_normalized_to_value_granularity():
    result = validate_timeline_claim(
        _claim(date_value="1831", date_precision="full"),
        author_birth_date="1816-04-21",
        author_death_date="1855-03-31",
        existing_events=REFERENCE_EVENTS,
        source_count=1,
    )
    assert result.validation_state == "validated"
    assert result.review_band == REVIEW_BAND_AUTO_APPROVED
    assert result.review_reason == REVIEW_REASON_NEW_GROUNDED


def test_align_date_precision_normalizes_all_forms():
    assert align_date_precision("1831", "full") == "year"
    assert align_date_precision("1831-05", "full") == "month"
    assert align_date_precision("1831-05-29", "year") == "full"
    assert align_date_precision("1831", "approximate") == "approximate"


def test_posthumous_event_is_needs_review():
    result = validate_timeline_claim(
        _claim(event_type="publication", date_value="1857", label="The Professor published posthumously"),
        author_birth_date="1816-04-21",
        author_death_date="1855-03-31",
        existing_events=REFERENCE_EVENTS,
        source_count=1,
    )
    assert result.validation_state == "needs_review"
    assert result.review_band == REVIEW_BAND_POLICY
    assert result.review_reason == REVIEW_REASON_POSTHUMOUS


def test_exact_duplicate_flagged():
    result = validate_timeline_claim(
        _claim(event_type="education", date_value="1824", label="Cowan Bridge school"),
        author_birth_date="1816-04-21",
        author_death_date="1855-03-31",
        existing_events=REFERENCE_EVENTS,
        source_count=1,
    )
    assert result.conflict_state == "duplicate"
    assert result.matched_event.id == "ref-1"
    assert result.validation_state == "needs_review"
    assert result.review_band == REVIEW_BAND_AUTO_REJECTED
    assert result.review_reason == REVIEW_REASON_EXACT_DUPLICATE


def test_restatement_auto_rejected():
    """Same type, same date, high label overlap -> deterministic restatement."""
    result = validate_timeline_claim(
        _claim(event_type="education", date_value="1824", label="Attended Cowan Bridge School"),
        author_birth_date="1816-04-21",
        author_death_date="1855-03-31",
        existing_events=REFERENCE_EVENTS,
        source_count=1,
    )
    assert result.conflict_state == "near_duplicate"
    assert result.review_band == REVIEW_BAND_AUTO_REJECTED
    assert result.review_reason == REVIEW_REASON_RESTATEMENT


def test_ambiguous_near_duplicate_needs_human():
    """Same type/date but unrelated label stays in quality review."""
    result = validate_timeline_claim(
        _claim(event_type="education", date_value="1824", label="Moved with family to new lodgings"),
        author_birth_date="1816-04-21",
        author_death_date="1855-03-31",
        existing_events=REFERENCE_EVENTS,
        source_count=1,
    )
    assert result.conflict_state == "near_duplicate"
    assert result.review_band == REVIEW_BAND_QUALITY
    assert result.review_reason == REVIEW_REASON_NEAR_DUPLICATE_AMBIGUOUS


def test_conflict_within_year_flagged():
    result = validate_timeline_claim(
        _claim(event_type="education", date_value="1825", label="Returned to Cowan Bridge School"),
        author_birth_date="1816-04-21",
        author_death_date="1855-03-31",
        existing_events=REFERENCE_EVENTS,
        source_count=1,
    )
    assert result.conflict_state == "conflict"
    assert result.validation_state == "conflict"
    assert result.review_band == REVIEW_BAND_QUALITY
    assert result.review_reason == REVIEW_REASON_DATE_CONFLICT


def test_new_event_not_matched():
    result = validate_timeline_claim(
        _claim(event_type="publication", date_value="1847-10-16", label="Jane Eyre published"),
        author_birth_date="1816-04-21",
        author_death_date="1855-03-31",
        existing_events=REFERENCE_EVENTS,
        source_count=2,
    )
    assert result.conflict_state == "new"
    assert result.validation_state == "validated"
    assert result.review_band == REVIEW_BAND_AUTO_APPROVED
    assert result.review_reason == REVIEW_REASON_NEW_GROUNDED


def test_auto_approval_requires_verified_grounding():
    """0.2C: with grounding enforcement enabled, zero verified sources demotes
    the claim from auto_approved to human quality review."""
    result = validate_timeline_claim(
        _claim(),
        author_birth_date="1816-04-21",
        author_death_date="1855-03-31",
        existing_events=REFERENCE_EVENTS,
        source_count=2,
        grounded_source_count=0,
    )
    assert result.validation_state == "validated"
    assert result.review_band == REVIEW_BAND_QUALITY
    assert result.review_reason == REVIEW_REASON_UNGROUNDED


def test_verified_grounding_keeps_auto_approval():
    result = validate_timeline_claim(
        _claim(),
        author_birth_date="1816-04-21",
        author_death_date="1855-03-31",
        existing_events=REFERENCE_EVENTS,
        source_count=2,
        grounded_source_count=1,
    )
    assert result.review_band == REVIEW_BAND_AUTO_APPROVED
    assert result.review_reason == REVIEW_REASON_NEW_GROUNDED


def test_legacy_calls_without_grounding_are_unchanged():
    result = validate_timeline_claim(
        _claim(),
        author_birth_date="1816-04-21",
        author_death_date="1855-03-31",
        existing_events=REFERENCE_EVENTS,
        source_count=2,
    )
    assert result.review_band == REVIEW_BAND_AUTO_APPROVED


def test_normalize_label_strips_punctuation_and_case():
    assert normalize_label("Charlotte  Brontë!") == normalize_label("charlotte bronte")
