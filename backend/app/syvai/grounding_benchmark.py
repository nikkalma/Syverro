"""Grounding benchmark — material-detail evidence verification.

0.2D objective: ``AUTO_APPROVED`` must never rest on a matching year or a
single token. This module measures the 0.2D grounding gate against a
deterministic corpus of claim/evidence pairs, each with an expected
grounding state.

Metric definitions (all deterministic, no provider calls):

  * grounding precision   — of the fragments the gate accepts as grounded,
                            how many are truly grounded.
  * auto-approval accuracy — fraction of cases where the gate decides to
                            approve (grounded) or send to a human exactly as
                            the corpus expects.
  * false auto-approvals  — cases the gate grounds but the corpus marks as
                            NOT grounded. Target: 0 (this is the 0.2D audit
                            invariant).
  * false human reviews   — cases the corpus marks grounded but the gate
                            sends to a human. Measured as a cost of strictness
                            so over-strictness is visible, not silent.

The corpus mirrors the Phase 2 adversarial matrix: year-only fragments,
single proper nouns, unrelated years, unsupported place, unsupported named
entity, absent distinctive detail, generic verbatim prose, fabricated text,
and genuinely grounded fragments.
"""

from __future__ import annotations

import dataclasses
from dataclasses import dataclass, field

from app.syvai.evidence import (
    GROUNDING_GROUNDED,
    GROUNDING_NO_EVIDENCE,
    GROUNDING_PARTIAL,
    GROUNDING_UNGROUNDED,
    build_material_requirements,
    verify_evidence,
)

GROUNDING_CITATION = (
    "Anne Brontë was born in Thornton, Yorkshire, England on 17 January 1820. "
    "She was known for her 1847 novel Agnes Grey and her 1848 novel The Tenant of "
    "Wildfell Hall. Anne Brontë died of tuberculosis in Scarborough, England on "
    "28 May 1849."
)


@dataclass(frozen=True)
class GroundingCase:
    label: str
    evidence: str | None
    expected: str
    description: str | None = None
    place: str | None = None
    date_value: str | None = None

    def run(self) -> str:
        material = build_material_requirements(
            label=self.label,
            description=self.description,
            place=self.place,
            date_value=self.date_value,
        )
        return verify_evidence(self.evidence, GROUNDING_CITATION, material=material).state


# ---------------------------------------------------------------------------
# Fixture corpus (expected states are the ground truth)
# ---------------------------------------------------------------------------

GROUNDING_FIXTURE_CASES: list[GroundingCase] = [
    # Fully grounded: all asserted material details supported verbatim.
    GroundingCase(
        label="Publication of Agnes Grey",
        date_value="1847",
        evidence="her 1847 novel Agnes Grey",
        expected=GROUNDING_GROUNDED,
    ),
    GroundingCase(
        label="Publication of The Tenant of Wildfell Hall",
        date_value="1848",
        evidence="her 1848 novel The Tenant of Wildfell Hall",
        expected=GROUNDING_GROUNDED,
    ),
    GroundingCase(
        label="Death of Anne Brontë in Scarborough",
        description="Anne Brontë died of tuberculosis in Scarborough.",
        place="Scarborough",
        evidence="Anne Brontë died of tuberculosis in Scarborough, England on 28 May 1849",
        expected=GROUNDING_GROUNDED,
    ),
    # Year-only fragment: date verbatim, claim's own wording absent.
    GroundingCase(
        label="Born",
        date_value="1820",
        evidence="17 January 1820",
        expected=GROUNDING_PARTIAL,
    ),
    # Single proper noun only.
    GroundingCase(
        label="Birth of Anne Brontë",
        place="Thornton, Yorkshire, England",
        date_value="1820-01-17",
        evidence="born in Thornton",
        expected=GROUNDING_PARTIAL,
    ),
    # Unrelated year elsewhere in the fragment.
    GroundingCase(
        label="Birth of Anne Brontë",
        date_value="1820",
        evidence="her 1848 novel The Tenant of Wildfell Hall",
        expected=GROUNDING_PARTIAL,
    ),
    # Claimed place not supported by the fragment.
    GroundingCase(
        label="Birth of Anne Brontë",
        place="Thornton, Yorkshire, England",
        date_value="1820-01-17",
        evidence="on 17 January 1820",
        expected=GROUNDING_PARTIAL,
    ),
    # Claimed named entity not supported by the fragment.
    GroundingCase(
        label="Publication of Agnes Grey",
        description="Anne Brontë's first novel",
        date_value="1847",
        evidence="She was known for her 1847 novel",
        expected=GROUNDING_PARTIAL,
    ),
    # Distinctive claim detail absent (year-only generic prose).
    GroundingCase(
        label="Moved to the parsonage",
        date_value="1820",
        evidence="on 17 January 1820",
        expected=GROUNDING_PARTIAL,
    ),
    # Generic verbatim prose with no asserted material detail.
    GroundingCase(
        label="Milestone event in the author's life",
        date_value="1820",
        evidence="was born in Thornton, Yorkshire, England on 17 January 1820",
        expected=GROUNDING_PARTIAL,
    ),
    # Fabricated text: not present in the source at all.
    GroundingCase(
        label="Birth of Anne Brontë",
        place="Thornton",
        date_value="1820-01-17",
        evidence="Anne Brontë was born in Haworth",
        expected=GROUNDING_UNGROUNDED,
    ),
    # Too short to be evidence.
    GroundingCase(
        label="Birth of Anne Brontë",
        date_value="1820",
        evidence="1820",
        expected=GROUNDING_UNGROUNDED,
    ),
    # No evidence fragment returned at all.
    GroundingCase(
        label="Birth of Anne Brontë",
        date_value="1820-01-17",
        evidence=None,
        expected=GROUNDING_NO_EVIDENCE,
    ),
]


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------


@dataclass
class GroundingReport:
    total_cases: int
    predicted: dict[str, int] = field(default_factory=dict)
    expected: dict[str, int] = field(default_factory=dict)
    grounded_precision: float = 0.0
    gate_accuracy: float = 0.0
    false_auto_approvals: int = 0
    false_human_reviews: int = 0
    per_case: list[dict] = field(default_factory=list)


def _rate(numerator: int, denominator: int) -> float:
    return round(numerator / denominator, 4) if denominator else 0.0


def _grounding_counts(states: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for state in states:
        counts[state] = counts.get(state, 0) + 1
    return counts


def _gate_approves(state: str) -> bool:
    return state == GROUNDING_GROUNDED


def evaluate_grounding_cases(cases: list[GroundingCase] | None = None) -> GroundingReport:
    """Run every case through the real verifier and score the gate."""
    cases = cases if cases is not None else GROUNDING_FIXTURE_CASES
    predicted = [case.run() for case in cases]
    expected = [case.expected for case in cases]

    predicted_counts = _grounding_counts(predicted)
    expected_counts = _grounding_counts(expected)

    true_positives = sum(
        1
        for pred, exp in zip(predicted, expected)
        if pred == GROUNDING_GROUNDED and exp == GROUNDING_GROUNDED
    )
    predicted_grounded = predicted_counts.get(GROUNDING_GROUNDED, 0)
    grounded_precision = _rate(true_positives, predicted_grounded)

    gate_correct = sum(
        1
        for pred, exp in zip(predicted, expected)
        if _gate_approves(pred) == _gate_approves(exp)
    )
    gate_accuracy = _rate(gate_correct, len(cases))

    false_auto_approvals = sum(
        1
        for pred, exp in zip(predicted, expected)
        if _gate_approves(pred) and not _gate_approves(exp)
    )
    false_human_reviews = sum(
        1
        for pred, exp in zip(predicted, expected)
        if not _gate_approves(pred) and _gate_approves(exp)
    )

    per_case = [
        {
            "label": case.label,
            "expected": exp,
            "predicted": pred,
            "gate_correct": _gate_approves(pred) == _gate_approves(exp),
        }
        for case, pred, exp in zip(cases, predicted, expected)
    ]

    return GroundingReport(
        total_cases=len(cases),
        predicted=predicted_counts,
        expected=expected_counts,
        grounded_precision=grounded_precision,
        gate_accuracy=gate_accuracy,
        false_auto_approvals=false_auto_approvals,
        false_human_reviews=false_human_reviews,
        per_case=per_case,
    )


def format_grounding_report(report: GroundingReport) -> str:
    lines = [
        "=== Grounding benchmark: material-detail evidence gate ===",
        f"cases: {report.total_cases}",
        f"predicted: grounded={report.predicted.get(GROUNDING_GROUNDED, 0)}, "
        f"partial={report.predicted.get(GROUNDING_PARTIAL, 0)}, "
        f"ungrounded={report.predicted.get(GROUNDING_UNGROUNDED, 0)}, "
        f"no_evidence={report.predicted.get(GROUNDING_NO_EVIDENCE, 0)}",
        f"expected: grounded={report.expected.get(GROUNDING_GROUNDED, 0)}, "
        f"partial={report.expected.get(GROUNDING_PARTIAL, 0)}, "
        f"ungrounded={report.expected.get(GROUNDING_UNGROUNDED, 0)}, "
        f"no_evidence={report.expected.get(GROUNDING_NO_EVIDENCE, 0)}",
        f"grounding precision: {report.grounded_precision:.1%}",
        f"auto-approval gate accuracy: {report.gate_accuracy:.1%}",
        f"false auto-approvals: {report.false_auto_approvals} (target 0)",
        f"false human reviews: {report.false_human_reviews}",
        "--- per case ---",
    ]
    for case in report.per_case:
        marker = "ok" if case["gate_correct"] else "MISMATCH"
        lines.append(
            f"  [{marker}] {case['label']}: expected={case['expected']} "
            f"predicted={case['predicted']}"
        )
    return "\n".join(lines)


def run_grounding_benchmark() -> GroundingReport:
    return evaluate_grounding_cases(GROUNDING_FIXTURE_CASES)


def main() -> None:
    print(format_grounding_report(run_grounding_benchmark()))


if __name__ == "__main__":
    main()
