"""Sapphire benchmark — Brontë timeline research.

The benchmark compares generated structured timeline claims against a trusted
reference dataset and reports objective, machine-computed metrics. It never
evaluates against data produced by the same run: the reference is the
curated Sapphire timeline (Charlotte Brontë by default, Emily Brontë as the
generalization probe), which is never fed to the provider.

Two modes:
  * offline (default): a deterministic fake-provider fixture, reproducible
    without any live API and used by the automated test suite;
  * live: ``python -m app.syvai.benchmark --live`` runs the real pipeline
    against a configured provider and the Charlotte record in the database.

Human-intervention metrics answer "how much editorial work did SyvAI save?".
The ratio is intentionally conservative and documented, not statistically
meaningful beyond this benchmark.

0.1B review classification: every claim is assigned a review band —
``auto_approved`` / ``auto_rejected`` (deterministically resolvable, no human
decision) versus ``quality_review`` / ``policy_review`` (human required). The
human-intervention ratio counts only the latter two, and the correction ratio
measures how much of that remaining review is expected to change the timeline
versus a pure confirmation.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
from dataclasses import dataclass, field

from app.syvai.timeline_claims import SourceRef, TimelineClaim, parse_timeline_claims
from app.syvai.validators import (
    REVIEW_BAND_AUTO_APPROVED,
    REVIEW_BAND_AUTO_REJECTED,
    REVIEW_BAND_POLICY,
    REVIEW_BAND_QUALITY,
    REVIEW_BANDS_NEEDING_HUMAN,
    ExistingEvent,
    ValidationResult,
    normalize_date_value,
    validate_timeline_claim,
)

logger = logging.getLogger(__name__)

CHARLOTTE_BIRTH = "1816-04-21"
CHARLOTTE_DEATH = "1855-03-31"
EMILY_BIRTH = "1818-07-30"
EMILY_DEATH = "1848-12-19"


def _reference_events(reference: list[dict]) -> list[ExistingEvent]:
    """Build the ExistingEvent list the deterministic validator compares against."""
    return [
        ExistingEvent(
            id=f"reference-{index}",
            event_type=event["event_type"],
            date_value=event["date_value"],
            date_precision=event["date_precision"],
            label=event["label"],
        )
        for index, event in enumerate(reference)
    ]


# ---------------------------------------------------------------------------
# Reference dataset (trusted curated Sapphire Charlotte timeline)
# ---------------------------------------------------------------------------

REFERENCE_TIMELINE: list[dict] = [
    {"event_type": "education", "date_value": "1824", "date_precision": "year",
     "label": "Cowan Bridge school"},
    {"event_type": "correspondence", "date_value": "1837", "date_precision": "year",
     "label": "Correspondence with Robert Southey"},
    {"event_type": "correspondence", "date_value": "1840", "date_precision": "year",
     "label": "Letters to Hartley Coleridge"},
    {"event_type": "personal", "date_value": "1842", "date_precision": "year",
     "label": "Death of Aunt Elizabeth Branwell"},
    {"event_type": "career", "date_value": "1846", "date_precision": "year",
     "label": "Poems published under pseudonyms"},
    {"event_type": "personal", "date_value": "1848-09", "date_precision": "month",
     "label": "Death of Branwell Bronte"},
    {"event_type": "personal", "date_value": "1848-12-19", "date_precision": "full",
     "label": "Death of Emily Bronte"},
    {"event_type": "personal", "date_value": "1849-05-28", "date_precision": "full",
     "label": "Death of Anne Bronte"},
    {"event_type": "publication", "date_value": "1849-10-26", "date_precision": "full",
     "label": "Shirley published"},
    {"event_type": "personal", "date_value": "1854-06-29", "date_precision": "full",
     "label": "Marriage to Arthur Bell Nicholls"},
]

_REFERENCE_EVENTS: list[ExistingEvent] = _reference_events(REFERENCE_TIMELINE)

# Trusted curated Emily Brontë timeline used as the generalization probe. The
# validation pipeline is author-agnostic; this second dataset must run through
# the exact same code paths without regressing the Charlotte benchmark.
EMILY_REFERENCE_TIMELINE: list[dict] = [
    {"event_type": "personal", "date_value": "1820", "date_precision": "year",
     "label": "Family moved to Haworth"},
    {"event_type": "education", "date_value": "1824", "date_precision": "year",
     "label": "Cowan Bridge school"},
    {"event_type": "education", "date_value": "1835", "date_precision": "year",
     "label": "Roe Head School"},
    {"event_type": "career", "date_value": "1838", "date_precision": "year",
     "label": "Teacher at Law Hill School"},
    {"event_type": "career", "date_value": "1846", "date_precision": "year",
     "label": "Poems published under pseudonyms"},
    {"event_type": "publication", "date_value": "1847-12", "date_precision": "month",
     "label": "Wuthering Heights published"},
    {"event_type": "personal", "date_value": "1848-09-24", "date_precision": "full",
     "label": "Death of Branwell Bronte"},
    {"event_type": "personal", "date_value": "1848-12-19", "date_precision": "full",
     "label": "Death of Emily Bronte"},
]

_EMILY_REFERENCE_EVENTS: list[ExistingEvent] = _reference_events(EMILY_REFERENCE_TIMELINE)


# ---------------------------------------------------------------------------
# Offline fixture (deterministic fake-provider output with ground truth)
# ---------------------------------------------------------------------------

_BRITANNICA = {"title": "Encyclopaedia Britannica", "source_type": "encyclopedia", "url": "https://www.britannica.com", "language": "en"}
_OXFORD = {"title": "Oxford Reference", "source_type": "reference", "url": "https://www.oxfordreference.com", "language": "en"}

FIXTURE_CLAIMS: list[tuple[dict, str]] = [
    ({"event_type": "education", "date_value": "1824", "date_precision": "year",
      "label": "Attended Cowan Bridge School", "description": "Enrolled at the Clergy Daughters' School in Cowan Bridge, Lancashire.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "correspondence", "date_value": "1837", "date_precision": "year",
      "label": "Correspondence with Robert Southey", "description": "Wrote to poet laureate Robert Southey asking for an assessment of her poems.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "correspondence", "date_value": "1840", "date_precision": "year",
      "label": "Letters to Hartley Coleridge", "description": "Sent poems to Hartley Coleridge for an encouraging review.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "personal", "date_value": "1842", "date_precision": "year",
      "label": "Death of Aunt Elizabeth Branwell", "description": "Returned from Brussels after the death of her aunt.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "career", "date_value": "1846", "date_precision": "year",
      "label": "Poems published under pseudonyms", "description": "The Brontë sisters published Poems under the Bell pseudonyms.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "personal", "date_value": "1848-09", "date_precision": "month",
      "label": "Death of Branwell Brontë", "description": "Branwell died of tuberculosis aggravated by alcoholism.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "personal", "date_value": "1848-12-19", "date_precision": "full",
      "label": "Death of Emily Brontë", "description": "Emily died of tuberculosis aged 30.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "personal", "date_value": "1849-05-28", "date_precision": "full",
      "label": "Death of Anne Brontë", "description": "Anne died of tuberculosis in Scarborough.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "publication", "date_value": "1849-10-26", "date_precision": "full",
      "label": "Shirley published", "description": "Social novel about women's position and industrial conflict.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "personal", "date_value": "1854-06-29", "date_precision": "full",
      "label": "Marriage to Arthur Bell Nicholls", "description": "Married Arthur Bell Nicholls, curate of Haworth.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "publication", "date_value": "1847-10-16", "date_precision": "full",
      "label": "Jane Eyre published", "description": "Landmark novel published under the name Currer Bell.",
      "sources": [_BRITANNICA, _OXFORD]}, "new"),
    ({"event_type": "milestone", "date_value": "1831", "date_precision": "year",
      "label": "Enrolled at Roe Head School", "description": "Enrolled at Roe Head, Mirfield, to continue her education.",
      "sources": [_BRITANNICA, _OXFORD]}, "new"),
    ({"event_type": "publication", "date_value": "1857", "date_precision": "year",
      "label": "The Professor published posthumously", "description": "First novel, published after Charlotte's death.",
      "sources": [_BRITANNICA]}, "new"),
    ({"event_type": "milestone", "date_value": "1831", "date_precision": "year",
      "label": "Attended local folklore festival", "description": "Unverifiable from the provided sources.",
      "sources": []}, "unsupported"),
    ({"event_type": "personal", "date_value": "1854-06-29", "date_precision": "full",
      "label": "Charlotte Brontë marries Arthur Bell Nicholls", "description": "Restatement of the wedding event.",
      "sources": [_BRITANNICA, _OXFORD]}, "duplicate"),
    ({"event_type": "education", "date_value": "1825", "date_precision": "year",
      "label": "Returned to Cowan Bridge School", "description": "Conflicting year for the school attendance.",
      "sources": [_BRITANNICA]}, "conflict"),
]

FIXTURE_OUTPUT: str = json.dumps(
    {"events": [claim for claim, _ in FIXTURE_CLAIMS]},
    ensure_ascii=False,
)


# Emily Brontë fixture mirrors the Charlotte claim distribution (same
# proportion of matches/new/unsupported/duplicate/conflict) so the
# human-intervention and correction metrics are comparable across authors.
EMILY_FIXTURE_CLAIMS: list[tuple[dict, str]] = [
    ({"event_type": "education", "date_value": "1824", "date_precision": "year",
      "label": "Attended Cowan Bridge School", "description": "Attended the Clergy Daughters' School with Charlotte.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "personal", "date_value": "1820", "date_precision": "year",
      "label": "Moved to Haworth", "description": "The Brontë family settled at Haworth Parsonage.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "education", "date_value": "1835", "date_precision": "year",
      "label": "Enrolled at Roe Head School", "description": "Studied at Roe Head while Charlotte was a teacher there.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "career", "date_value": "1838", "date_precision": "year",
      "label": "Teacher at Law Hill School", "description": "Worked as a teacher at Law Hill School, Southowram.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "career", "date_value": "1846", "date_precision": "year",
      "label": "Poems published under the Bell pseudonyms", "description": "Poems by Currer, Ellis and Acton Bell published together.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "publication", "date_value": "1847-12", "date_precision": "month",
      "label": "Wuthering Heights published", "description": "Only novel, published under the name Ellis Bell.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "personal", "date_value": "1848-09-24", "date_precision": "full",
      "label": "Death of Branwell Bronte", "description": "Brother Branwell died of tuberculosis.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "personal", "date_value": "1848-12-19", "date_precision": "full",
      "label": "Death of Emily Bronte", "description": "Emily died of tuberculosis aged 30.",
      "sources": [_BRITANNICA, _OXFORD]}, "match"),
    ({"event_type": "publication", "date_value": "1850-05", "date_precision": "month",
      "label": "Wuthering Heights second edition published", "description": "Second edition issued posthumously with a biographical notice.",
      "sources": [_BRITANNICA, _OXFORD]}, "new"),
    ({"event_type": "milestone", "date_value": "1834", "date_precision": "year",
      "label": "Gondal saga created with Anne", "description": "Shared imaginary kingdom Gondal, source of much of her poetry.",
      "sources": [_BRITANNICA]}, "new"),
    ({"event_type": "milestone", "date_value": "1832", "date_precision": "year",
      "label": "Attended local folklore festival", "description": "Unverifiable from the provided sources.",
      "sources": []}, "unsupported"),
    ({"event_type": "personal", "date_value": "1848-12-19", "date_precision": "full",
      "label": "Emily Bronte dies in Haworth", "description": "Restatement of the death event.",
      "sources": [_BRITANNICA, _OXFORD]}, "duplicate"),
    ({"event_type": "career", "date_value": "1839", "date_precision": "year",
      "label": "Returned to Law Hill School", "description": "Conflicting year for the Law Hill employment.",
      "sources": [_BRITANNICA]}, "conflict"),
]

EMILY_FIXTURE_OUTPUT: str = json.dumps(
    {"events": [claim for claim, _ in EMILY_FIXTURE_CLAIMS]},
    ensure_ascii=False,
)


# ---------------------------------------------------------------------------
# Proposal snapshot
# ---------------------------------------------------------------------------


@dataclass
class ProposalSnapshot:
    event_type: str
    date_value: str
    date_precision: str
    label: str
    description: str | None
    validation_state: str
    conflict_state: str
    confidence: float
    source_count: int
    status: str = "proposed"
    edited: bool = False
    applied: bool = False

    @classmethod
    def from_claim(cls, claim: TimelineClaim, *, validation_state: str, conflict_state: str,
                   confidence: float, source_count: int) -> "ProposalSnapshot":
        return cls(
            event_type=claim.event_type,
            date_value=claim.date_value,
            date_precision=claim.date_precision,
            label=claim.label,
            description=claim.description,
            validation_state=validation_state,
            conflict_state=conflict_state,
            confidence=confidence,
            source_count=source_count,
        )


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------


@dataclass
class BenchmarkReport:
    total_claims: int
    schema_valid_claims: int
    schema_valid_rate: float
    reference_count: int
    covered_references: int
    matched_count: int
    precision: float
    recall: float
    exact_date_matches: int
    exact_date_accuracy: float
    unsupported_count: int
    unsupported_rate: float
    source_coverage: float
    source_agreement: float
    duplicate_expected: int
    duplicate_flagged: int
    duplicate_detection_rate: float | None
    conflict_expected: int
    conflict_flagged: int
    conflict_detection_rate: float | None
    # human intervention
    total_proposals: int
    validated_count: int
    needs_review_count: int
    conflict_count: int
    invalid_count: int
    rejected_count: int
    accepted_count: int
    applied_count: int
    edited_before_apply_count: int
    applied_unchanged_count: int
    human_intervention_ratio: float
    human_intervention_formula: str = field(
        default="(quality_review + policy_review) / total"
    )
    # review bands (0.1B): why proposals need attention and how much the
    # system can resolve without a human.
    auto_resolved_count: int = 0
    auto_rejected_count: int = 0
    auto_approved_count: int = 0
    quality_review_count: int = 0
    policy_review_count: int = 0
    reviewed_count: int = 0
    review_reason_counts: dict[str, int] = field(default_factory=dict)
    # correction ratio: of the proposals that reach a human, how many are
    # expected to change the timeline (reject/edit) versus a pure confirmation.
    corrections_expected: int = 0
    confirmations_expected: int = 0
    correction_ratio: float | None = None
    notes: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Evaluation
# ---------------------------------------------------------------------------


def _rate(numerator: int, denominator: int) -> float:
    return round(numerator / denominator, 4) if denominator else 0.0


def evaluate_snapshots(
    snapshots: list[ProposalSnapshot],
    *,
    ground_truth: dict[str, str] | None = None,
    author_birth_date: str = CHARLOTTE_BIRTH,
    author_death_date: str = CHARLOTTE_DEATH,
    existing_events: list[ExistingEvent] | None = None,
) -> BenchmarkReport:
    """Compare snapshots against the reference using the real deterministic
    validator (reference events are treated as the existing timeline).

    ``ground_truth`` maps a prediction label to a category
    ("match" | "duplicate" | "conflict" | "unsupported" | "new") and is used
    to measure detection quality and the expected correction ratio. Live runs
    have no ground truth and report detection rates as n/a.
    """
    existing_events = existing_events if existing_events is not None else _REFERENCE_EVENTS
    notes: list[str] = []
    revalidated: list[tuple[ProposalSnapshot, ValidationResult]] = []
    matched_reference_dates: list[str | None] = []
    matched_reference_ids: list[str | None] = []

    for snapshot in snapshots:
        claim = TimelineClaim(
            event_type=snapshot.event_type,
            date_value=snapshot.date_value,
            date_precision=snapshot.date_precision,
            label=snapshot.label,
            description=snapshot.description,
        )
        validation = validate_timeline_claim(
            claim,
            author_birth_date=author_birth_date,
            author_death_date=author_death_date,
            existing_events=existing_events,
            source_count=snapshot.source_count,
        )
        revalidated.append((snapshot, validation))
        if validation.matched_event:
            matched_reference_dates.append(validation.matched_event.date_value)
            matched_reference_ids.append(validation.matched_event.id)
        else:
            matched_reference_dates.append(None)
            matched_reference_ids.append(None)

    matched_count = sum(1 for _, validation in revalidated if validation.conflict_state != "new")
    distinct_covered = len({ref_id for ref_id in matched_reference_ids if ref_id is not None})
    exact_date_matches = sum(
        1
        for (snapshot, _), reference_date in zip(revalidated, matched_reference_dates)
        if reference_date is not None
        and normalize_date_value(snapshot.date_value) == normalize_date_value(reference_date)
    )

    unsupported_count = sum(1 for snapshot in snapshots if snapshot.source_count == 0)
    source_coverage = _rate(sum(1 for s in snapshots if s.source_count >= 1), len(snapshots))
    source_agreement = _rate(sum(1 for s in snapshots if s.source_count >= 2), len(snapshots))

    def _expected(category: str) -> int:
        if not ground_truth:
            return 0
        return sum(1 for s in snapshots if ground_truth.get(s.label) == category)

    def _flagged(category: str, predicate) -> int:
        if not ground_truth:
            return 0
        return sum(
            1 for s in snapshots if ground_truth.get(s.label) == category and predicate(s)
        )

    duplicate_expected = _expected("duplicate")
    duplicate_flagged = _flagged(
        "duplicate",
        lambda s: s.conflict_state in {"duplicate", "near_duplicate"},
    )
    conflict_expected = _expected("conflict")
    conflict_flagged = _flagged("conflict", lambda s: s.conflict_state == "conflict")

    validated_count = sum(1 for _, v in revalidated if v.validation_state == "validated")
    needs_review_count = sum(1 for _, v in revalidated if v.validation_state == "needs_review")
    conflict_count = sum(1 for _, v in revalidated if v.validation_state == "conflict")
    invalid_count = sum(1 for _, v in revalidated if v.validation_state == "invalid")
    rejected_count = sum(1 for s in snapshots if s.status == "rejected")
    accepted_count = sum(1 for s in snapshots if s.status in {"accepted", "applied"})
    applied_count = sum(1 for s in snapshots if s.applied)
    edited_before_apply_count = sum(1 for s in snapshots if s.edited)
    applied_unchanged_count = sum(1 for s in snapshots if s.applied and not s.edited)

    auto_rejected_count = sum(1 for _, v in revalidated if v.review_band == REVIEW_BAND_AUTO_REJECTED)
    auto_approved_count = sum(1 for _, v in revalidated if v.review_band == REVIEW_BAND_AUTO_APPROVED)
    quality_review_count = sum(1 for _, v in revalidated if v.review_band == REVIEW_BAND_QUALITY)
    policy_review_count = sum(1 for _, v in revalidated if v.review_band == REVIEW_BAND_POLICY)
    auto_resolved_count = auto_rejected_count + auto_approved_count
    reviewed_count = quality_review_count + policy_review_count

    review_reason_counts: dict[str, int] = {}
    for _, v in revalidated:
        review_reason_counts[v.review_reason] = review_reason_counts.get(v.review_reason, 0) + 1

    # Expected correction ratio: proposals that reach a human and are expected
    # to change the timeline (reject/edit) versus confirmations (apply as-is).
    # Derived from ground truth where available; n/a for live runs.
    corrections_expected = 0
    confirmations_expected = 0
    correction_ratio = None
    if ground_truth and reviewed_count:
        for snapshot, validation in revalidated:
            if validation.review_band not in REVIEW_BANDS_NEEDING_HUMAN:
                continue
            category = ground_truth.get(snapshot.label)
            if category in {"unsupported", "conflict", "duplicate"}:
                corrections_expected += 1
            else:
                confirmations_expected += 1
        correction_ratio = _rate(corrections_expected, reviewed_count)

    human_intervention_ratio = _rate(reviewed_count, len(snapshots)) if snapshots else 0.0

    if needs_review_count and snapshots:
        notes.append(
            f"of {needs_review_count} claims flagged needs_review, "
            f"{auto_rejected_count} are deterministic restatements/duplicates auto-rejected; "
            f"only {reviewed_count} genuinely require a human decision "
            f"({quality_review_count} quality-driven, {policy_review_count} policy-driven)"
        )
    if duplicate_expected and duplicate_flagged < duplicate_expected:
        notes.append("some ground-truth duplicates were not flagged by the deterministic validator")
    if conflict_expected and conflict_flagged < conflict_expected:
        notes.append("some ground-truth conflicts were not flagged by the deterministic validator")

    return BenchmarkReport(
        total_claims=len(snapshots),
        schema_valid_claims=len(snapshots),
        schema_valid_rate=1.0,
        reference_count=len(existing_events),
        covered_references=distinct_covered,
        matched_count=matched_count,
        precision=_rate(matched_count, len(snapshots)),
        recall=_rate(distinct_covered, len(existing_events)),
        exact_date_matches=exact_date_matches,
        exact_date_accuracy=_rate(exact_date_matches, matched_count),
        unsupported_count=unsupported_count,
        unsupported_rate=_rate(unsupported_count, len(snapshots)),
        source_coverage=source_coverage,
        source_agreement=source_agreement,
        duplicate_expected=duplicate_expected,
        duplicate_flagged=duplicate_flagged,
        duplicate_detection_rate=_rate(duplicate_flagged, duplicate_expected) if duplicate_expected else None,
        conflict_expected=conflict_expected,
        conflict_flagged=conflict_flagged,
        conflict_detection_rate=_rate(conflict_flagged, conflict_expected) if conflict_expected else None,
        total_proposals=len(snapshots),
        validated_count=validated_count,
        needs_review_count=needs_review_count,
        conflict_count=conflict_count,
        invalid_count=invalid_count,
        rejected_count=rejected_count,
        accepted_count=accepted_count,
        applied_count=applied_count,
        edited_before_apply_count=edited_before_apply_count,
        applied_unchanged_count=applied_unchanged_count,
        human_intervention_ratio=human_intervention_ratio,
        auto_resolved_count=auto_resolved_count,
        auto_rejected_count=auto_rejected_count,
        auto_approved_count=auto_approved_count,
        quality_review_count=quality_review_count,
        policy_review_count=policy_review_count,
        reviewed_count=reviewed_count,
        review_reason_counts=review_reason_counts,
        corrections_expected=corrections_expected,
        confirmations_expected=confirmations_expected,
        correction_ratio=correction_ratio,
        notes=notes,
    )


def _fixture_ground_truth(fixture_claims: list[tuple[dict, str]] | None = None) -> dict[str, str]:
    fixture_claims = fixture_claims if fixture_claims is not None else FIXTURE_CLAIMS
    return {claim["label"]: label for claim, label in fixture_claims}


def _offline_benchmark(
    *,
    author_birth_date: str,
    author_death_date: str,
    reference: list[dict],
    fixture_output: str,
    fixture_claims: list[tuple[dict, str]],
) -> BenchmarkReport:
    claims = parse_timeline_claims(fixture_output)
    reference_events = _reference_events(reference)
    snapshots = []
    for claim in claims:
        validation = validate_timeline_claim(
            claim,
            author_birth_date=author_birth_date,
            author_death_date=author_death_date,
            existing_events=reference_events,
            source_count=len(claim.sources),
        )
        snapshots.append(
            ProposalSnapshot.from_claim(
                claim,
                validation_state=validation.validation_state,
                conflict_state=validation.conflict_state,
                confidence=0.9,
                source_count=len(claim.sources),
            )
        )
    report = evaluate_snapshots(
        snapshots,
        ground_truth=_fixture_ground_truth(fixture_claims),
        author_birth_date=author_birth_date,
        author_death_date=author_death_date,
        existing_events=reference_events,
    )
    return report


def offline_benchmark(author: str = "charlotte") -> BenchmarkReport:
    """Run the deterministic benchmark for a supported author fixture."""
    if author == "emily":
        return _offline_benchmark(
            author_birth_date=EMILY_BIRTH,
            author_death_date=EMILY_DEATH,
            reference=EMILY_REFERENCE_TIMELINE,
            fixture_output=EMILY_FIXTURE_OUTPUT,
            fixture_claims=EMILY_FIXTURE_CLAIMS,
        )
    return _offline_benchmark(
        author_birth_date=CHARLOTTE_BIRTH,
        author_death_date=CHARLOTTE_DEATH,
        reference=REFERENCE_TIMELINE,
        fixture_output=FIXTURE_OUTPUT,
        fixture_claims=FIXTURE_CLAIMS,
    )


def format_report(report: BenchmarkReport, author: str = "charlotte") -> str:
    author_label = "Emily Brontë" if author == "emily" else "Charlotte Brontë"
    lines = [
        f"=== Sapphire benchmark: {author_label} timeline research ===",
        f"claims: {report.total_claims} (schema-valid {report.schema_valid_claims}, {report.schema_valid_rate:.1%})",
        f"reference events: {report.reference_count}",
        f"precision: {report.precision:.1%} ({report.matched_count}/{report.total_claims})",
        f"recall: {report.recall:.1%} ({report.covered_references}/{report.reference_count})",
        f"exact date accuracy: {report.exact_date_accuracy:.1%} ({report.exact_date_matches}/{report.matched_count})",
        f"unsupported rate: {report.unsupported_rate:.1%} ({report.unsupported_count}/{report.total_claims})",
        f"source coverage (>=1): {report.source_coverage:.1%}, agreement (>=2): {report.source_agreement:.1%}",
    ]
    duplicate = f"{report.duplicate_detection_rate:.1%}" if report.duplicate_detection_rate is not None else "n/a"
    conflict = f"{report.conflict_detection_rate:.1%}" if report.conflict_detection_rate is not None else "n/a"
    lines.append(f"duplicate detection: {duplicate} ({report.duplicate_flagged}/{report.duplicate_expected})")
    lines.append(f"conflict detection: {conflict} ({report.conflict_flagged}/{report.conflict_expected})")
    lines.append("--- human intervention ---")
    lines.append(f"proposals: {report.total_proposals} (validated {report.validated_count}, needs_review {report.needs_review_count}, conflict {report.conflict_count}, invalid {report.invalid_count})")
    lines.append(f"rejected {report.rejected_count}, accepted {report.accepted_count}, applied {report.applied_count} (edited {report.edited_before_apply_count}, unchanged {report.applied_unchanged_count})")
    lines.append("--- review bands ---")
    lines.append(f"auto-resolved {report.auto_resolved_count} (auto-approved {report.auto_approved_count}, auto-rejected {report.auto_rejected_count})")
    lines.append(f"human review {report.reviewed_count} (quality {report.quality_review_count}, policy {report.policy_review_count})")
    reason_breakdown = ", ".join(f"{reason}={count}" for reason, count in sorted(report.review_reason_counts.items()))
    lines.append(f"reasons: {reason_breakdown}")
    lines.append(f"human-intervention ratio: {report.human_intervention_ratio:.1%}")
    lines.append(f"formula: {report.human_intervention_formula}")
    if report.correction_ratio is not None:
        lines.append(
            f"correction ratio: {report.correction_ratio:.1%} "
            f"(corrections {report.corrections_expected}/{report.reviewed_count}, confirmations {report.confirmations_expected}/{report.reviewed_count})"
        )
    else:
        lines.append("correction ratio: n/a (no ground truth; needs reviewer actions)")
    for note in report.notes:
        lines.append(f"note: {note}")
    return "\n".join(lines)


async def live_benchmark() -> BenchmarkReport:
    """Run the real pipeline against the Charlotte record and evaluate.

    Requires a configured provider and the Charlotte Brontë record present in
    the database. Raises RuntimeError with a safe message otherwise.
    """
    from sqlalchemy import select

    from app.database import AsyncSessionLocal
    from app.models.author import Author
    from app.syvai.pipeline import run_timeline_research
    from app.syvai.provider import OpenAICompatibleProvider, ProviderConfig

    provider = OpenAICompatibleProvider(ProviderConfig.from_env())
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Author).where(Author.slug == "charlotte-bronte")
        )
        author = result.scalar_one_or_none()
        if not author:
            raise RuntimeError("Charlotte Brontë record not found in the database")
        outcome = await run_timeline_research(db, author, provider)
        if outcome.error:
            raise RuntimeError(outcome.error)

        snapshots = []
        for proposal in outcome.proposals:
            claim = json.loads(proposal.suggested_value)
            snapshots.append(
                ProposalSnapshot(
                    event_type=claim.get("event_type", ""),
                    date_value=claim.get("date_value", ""),
                    date_precision=claim.get("date_precision", "full"),
                    label=claim.get("label", ""),
                    description=claim.get("description"),
                    validation_state=proposal.validation_state or "unknown",
                    conflict_state=proposal.conflict_state or "new",
                    confidence=proposal.confidence or 0.0,
                    source_count=len(proposal.sources or []),
                    status=proposal.status,
                    edited=proposal.edited_value is not None,
                    applied=proposal.applied_at is not None,
                )
            )
        return evaluate_snapshots(snapshots)


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(description="Sapphire benchmark: Brontë timeline research")
    parser.add_argument("--live", action="store_true", help="run against a real provider and the database")
    parser.add_argument("--author", choices=["charlotte", "emily"], default="charlotte")
    args = parser.parse_args()

    if args.live:
        if args.author != "charlotte":
            parser.error("--live is only supported for the charlotte database record")
        report = asyncio.run(live_benchmark())
    else:
        report = offline_benchmark(args.author)
    print(format_report(report, author=args.author))


if __name__ == "__main__":
    main()
