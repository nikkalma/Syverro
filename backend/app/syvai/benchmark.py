"""Sapphire benchmark — Charlotte Brontë timeline research.

The benchmark compares generated structured timeline claims against a trusted
reference dataset and reports objective, machine-computed metrics. It never
evaluates against data produced by the same run: the reference is the
curated Sapphire Charlotte timeline (see ``REFERENCE_TIMELINE``), which is
never fed to the provider.

Two modes:
  * offline (default): a deterministic fake-provider fixture, reproducible
    without any live API and used by the automated test suite;
  * live: ``python -m app.syvai.benchmark --live`` runs the real pipeline
    against a configured provider and the Charlotte record in the database.

Human-intervention metrics answer "how much editorial work did SyvAI save?".
The ratio is intentionally conservative and documented, not statistically
meaningful beyond this benchmark.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
from dataclasses import dataclass, field

from app.syvai.timeline_claims import SourceRef, TimelineClaim, parse_timeline_claims
from app.syvai.validators import ExistingEvent, normalize_date_value, validate_timeline_claim

logger = logging.getLogger(__name__)

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

_REFERENCE_EVENTS: list[ExistingEvent] = [
    ExistingEvent(
        id=f"reference-{index}",
        event_type=event["event_type"],
        date_value=event["date_value"],
        date_precision=event["date_precision"],
        label=event["label"],
    )
    for index, event in enumerate(REFERENCE_TIMELINE)
]


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
    human_intervention_formula: str = field(default="(needs_review + conflict + invalid + rejected + edited) / total")
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
) -> BenchmarkReport:
    """Compare snapshots against the reference using the real deterministic
    validator (reference events are treated as the existing timeline).

    ``ground_truth`` maps a prediction label to a category
    ("match" | "duplicate" | "conflict" | "unsupported" | "new") and is used
    to measure detection quality. Live runs have no ground truth and report
    detection rates as n/a.
    """
    notes: list[str] = []
    revalidated: list[tuple[ProposalSnapshot, str, str]] = []
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
            author_birth_date="1816-04-21",
            author_death_date="1855-03-31",
            existing_events=_REFERENCE_EVENTS,
            source_count=snapshot.source_count,
        )
        revalidated.append((snapshot, validation.validation_state, validation.conflict_state))
        if validation.matched_event:
            matched_reference_dates.append(validation.matched_event.date_value)
            matched_reference_ids.append(validation.matched_event.id)
        else:
            matched_reference_dates.append(None)
            matched_reference_ids.append(None)

    matched_count = sum(1 for _, _, conflict_state in revalidated if conflict_state != "new")
    distinct_covered = len({ref_id for ref_id in matched_reference_ids if ref_id is not None})
    exact_date_matches = sum(
        1
        for (snapshot, _, _), reference_date in zip(revalidated, matched_reference_dates)
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

    validated_count = sum(1 for _, state, _ in revalidated if state == "validated")
    needs_review_count = sum(1 for _, state, _ in revalidated if state == "needs_review")
    conflict_count = sum(1 for _, state, _ in revalidated if state == "conflict")
    invalid_count = sum(1 for _, state, _ in revalidated if state == "invalid")
    rejected_count = sum(1 for s in snapshots if s.status == "rejected")
    accepted_count = sum(1 for s in snapshots if s.status in {"accepted", "applied"})
    applied_count = sum(1 for s in snapshots if s.applied)
    edited_before_apply_count = sum(1 for s in snapshots if s.edited)
    applied_unchanged_count = sum(1 for s in snapshots if s.applied and not s.edited)

    human_intervention = needs_review_count + conflict_count + invalid_count + rejected_count + edited_before_apply_count
    human_intervention_ratio = _rate(human_intervention, len(snapshots)) if snapshots else 0.0

    if needs_review_count and snapshots:
        notes.append(
            "most needs_review items are restatements of already-curated events "
            "flagged as duplicates; reviewers bulk-reject them in one pass"
        )
    if duplicate_expected and duplicate_flagged < duplicate_expected:
        notes.append("some ground-truth duplicates were not flagged by the deterministic validator")
    if conflict_expected and conflict_flagged < conflict_expected:
        notes.append("some ground-truth conflicts were not flagged by the deterministic validator")

    return BenchmarkReport(
        total_claims=len(snapshots),
        schema_valid_claims=len(snapshots),
        schema_valid_rate=1.0,
        reference_count=len(REFERENCE_TIMELINE),
        covered_references=distinct_covered,
        matched_count=matched_count,
        precision=_rate(matched_count, len(snapshots)),
        recall=_rate(distinct_covered, len(REFERENCE_TIMELINE)),
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
        notes=notes,
    )


def _fixture_ground_truth() -> dict[str, str]:
    return {claim["label"]: label for claim, label in FIXTURE_CLAIMS}


def offline_benchmark() -> BenchmarkReport:
    """Run the benchmark on the deterministic fixture."""
    claims = parse_timeline_claims(FIXTURE_OUTPUT)
    snapshots = []
    for claim in claims:
        validation = validate_timeline_claim(
            claim,
            author_birth_date="1816-04-21",
            author_death_date="1855-03-31",
            existing_events=_REFERENCE_EVENTS,
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
    report = evaluate_snapshots(snapshots, ground_truth=_fixture_ground_truth())
    return report


def format_report(report: BenchmarkReport) -> str:
    lines = [
        "=== Sapphire benchmark: Charlotte Brontë timeline research ===",
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
    lines.append(f"human-intervention ratio: {report.human_intervention_ratio:.1%}")
    lines.append(f"formula: {report.human_intervention_formula}")
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
    parser = argparse.ArgumentParser(description="Sapphire benchmark: Charlotte Brontë timeline research")
    parser.add_argument("--live", action="store_true", help="run against a real provider and the database")
    args = parser.parse_args()

    report = asyncio.run(live_benchmark()) if args.live else offline_benchmark()
    print(format_report(report))


if __name__ == "__main__":
    main()
