"""Corroboration benchmark — family-aware multi-source corroboration.

SyvAI 0.2E objective: independence is counted in VERIFIED SOURCE FAMILIES, not
linked SourceRefs. This module measures the corroboration classifier against a
deterministic corpus of source-family combinations (Phase 6 matrix A-K), each
with an expected corroboration state and an expected independent-family count.

Metric definitions (all deterministic, no provider calls):

  * fully classified       — predicted state == expected state
  * corroboration accuracy — fraction of cases classified exactly as expected
  * false_corroborations   — cases where the classifier credits >=2 independent
                            families when the corpus expects fewer (phantom
                            corroboration; over-count inflation). Target: 0.
  * missed_corroborations  — cases the classifier credits <2 independent
                            families when the corpus expects >=2 (under-count).
  * duplicate_family_inflation — sum over cases of
                            (predicted_independent - expected_independent) when
                            positive; same-family duplicates falsely counted as
                            independent. Target: 0.
  * false_auto_approvals   — cases predicted CORROBORATED but expected NOT
                            (the operational over-claim that would wrongly
                            strengthen confidence). Target: 0.
  * false_human_reviews    — cases expected CORROBORATED but predicted NOT
                            (strictness cost, made visible not silent).

Targets: false_corroborations == 0, duplicate_family_inflation == 0,
false_auto_approvals == 0.
"""

from __future__ import annotations

import dataclasses
from dataclasses import dataclass, field

from app.syvai.corroboration import (
    STATE_CORROBORATED,
    STATE_NONE,
    STATE_SINGLE_SOURCE,
    corroborate_sources,
)


@dataclass(frozen=True)
class CorroborationCase:
    label: str
    sources: list[dict]
    grounded: list[bool]
    expected_state: str
    expected_independent: int

    def predicted(self):
        result = corroborate_sources(self.sources, self.grounded)
        return result.state, result.independent_grounded_source_count


def _src(url: str | None, normalized_url: str | None = None) -> dict:
    return {"url": url, "normalized_url": normalized_url}


WIKIPEDIA_EN = "https://en.wikipedia.org/wiki/Anne_Bront%C3%AB"
WIKIPEDIA_FR = "https://fr.wikipedia.org/wiki/Anne_Bront%C3%AB"
BRITANNICA = "https://www.britannica.com/biography/Anne-Bronte"
LOC = "https://www.loc.gov/item/2020123456/"


CORROBORATION_FIXTURE_CASES: list[CorroborationCase] = [
    # A — one grounded source -> single_source (1 family).
    CorroborationCase(
        label="A: one grounded",
        sources=[_src(BRITANNICA)],
        grounded=[True],
        expected_state=STATE_SINGLE_SOURCE,
        expected_independent=1,
    ),
    # B — two distinct grounded -> corroborated.
    CorroborationCase(
        label="B: two distinct grounded",
        sources=[_src(BRITANNICA), _src(LOC)],
        grounded=[True, True],
        expected_state=STATE_CORROBORATED,
        expected_independent=2,
    ),
    # C — two same-family grounded -> single_source (NOT corroborated).
    CorroborationCase(
        label="C: two same-family grounded",
        sources=[_src(WIKIPEDIA_EN), _src(WIKIPEDIA_FR)],
        grounded=[True, True],
        expected_state=STATE_SINGLE_SOURCE,
        expected_independent=1,
    ),
    # D — duplicate URL variants -> single_source (same canonical URL family).
    CorroborationCase(
        label="D: duplicate URL variants",
        sources=[
            _src("https://example.com/a?utm_source=x", normalized_url="https://example.com/a"),
            _src("https://example.com/a#frag", normalized_url="https://example.com/a"),
        ],
        grounded=[True, True],
        expected_state=STATE_SINGLE_SOURCE,
        expected_independent=1,
    ),
    # E — grounded + partially-grounded -> single_source.
    CorroborationCase(
        label="E: grounded + partial",
        sources=[_src(BRITANNICA), _src(WIKIPEDIA_EN)],
        grounded=[True, False],
        expected_state=STATE_SINGLE_SOURCE,
        expected_independent=1,
    ),
    # F — two partials -> none (complementary synthesis out of scope).
    CorroborationCase(
        label="F: two partials",
        sources=[_src(BRITANNICA), _src(LOC)],
        grounded=[False, False],
        expected_state=STATE_NONE,
        expected_independent=0,
    ),
    # G — grounded + fabricated (ungrounded) -> single_source.
    CorroborationCase(
        label="G: grounded + fabricated",
        sources=[_src(BRITANNICA), _src(LOC)],
        grounded=[True, False],
        expected_state=STATE_SINGLE_SOURCE,
        expected_independent=1,
    ),
    # H — three grounded across two families -> corroborated.
    CorroborationCase(
        label="H: three grounded, two families",
        sources=[_src(WIKIPEDIA_EN), _src(WIKIPEDIA_FR), _src(BRITANNICA)],
        grounded=[True, True, True],
        expected_state=STATE_CORROBORATED,
        expected_independent=2,
    ),
    # I — same domain, different articles -> single_source (one family).
    CorroborationCase(
        label="I: same domain different articles",
        sources=[
            _src("https://example.com/biography/anne"),
            _src("https://example.com/biography/emily"),
        ],
        grounded=[True, True],
        expected_state=STATE_SINGLE_SOURCE,
        expected_independent=1,
    ),
    # J — unparseable URLs -> single unknown family, no inflation.
    CorroborationCase(
        label="J: unknown/unparseable URLs",
        sources=[_src("not a url"), _src("???")],
        grounded=[True, True],
        expected_state=STATE_SINGLE_SOURCE,
        expected_independent=1,
    ),
    # K — multiple sources, unsupported material detail -> none regardless of count.
    CorroborationCase(
        label="K: multiple sources, unsupported detail",
        sources=[_src(BRITANNICA), _src(LOC)],
        grounded=[False, False],
        expected_state=STATE_NONE,
        expected_independent=0,
    ),
]


@dataclass
class CorroborationReport:
    total_cases: int = 0
    expected: dict[str, int] = field(default_factory=dict)
    predicted: dict[str, int] = field(default_factory=dict)
    expected_corroborated: int = 0
    predicted_corroborated: int = 0
    correctly_classified: int = 0
    accuracy: float = 0.0
    false_corroborations: int = 0
    missed_corroborations: int = 0
    duplicate_family_inflation: int = 0
    false_auto_approvals: int = 0
    false_human_reviews: int = 0
    per_case: list[dict] = field(default_factory=list)


def _rate(numerator: int, denominator: int) -> float:
    return round(numerator / denominator, 4) if denominator else 0.0


def _is_corroborated(state: str) -> bool:
    return state == STATE_CORROBORATED


def evaluate_corroboration_cases(
    cases: list[CorroborationCase] | None = None,
) -> CorroborationReport:
    """Run every case through the real classifier and score corroboration."""
    cases = cases if cases is not None else CORROBORATION_FIXTURE_CASES

    report = CorroborationReport(total_cases=len(cases))
    predicted_pairs = [case.predicted() for case in cases]
    expected_pairs = [(case.expected_state, case.expected_independent) for case in cases]

    report.expected_corroborated = sum(1 for s, _ in expected_pairs if _is_corroborated(s))
    report.predicted_corroborated = sum(1 for s, _ in predicted_pairs if _is_corroborated(s))

    for case, (pred_state, pred_independent), (exp_state, exp_independent) in zip(
        cases, predicted_pairs, expected_pairs
    ):
        report.expected[exp_state] = report.expected.get(exp_state, 0) + 1
        report.predicted[pred_state] = report.predicted.get(pred_state, 0) + 1

        classified = pred_state == exp_state
        if classified:
            report.correctly_classified += 1

        if pred_independent >= 2 and exp_independent < 2:
            report.false_corroborations += 1
        if exp_independent >= 2 and pred_independent < 2:
            report.missed_corroborations += 1
        report.duplicate_family_inflation += max(0, pred_independent - exp_independent)

        if _is_corroborated(pred_state) and not _is_corroborated(exp_state):
            report.false_auto_approvals += 1
        if not _is_corroborated(pred_state) and _is_corroborated(exp_state):
            report.false_human_reviews += 1

        report.per_case.append(
            {
                "label": case.label,
                "expected": exp_state,
                "predicted": pred_state,
                "expected_independent": exp_independent,
                "predicted_independent": pred_independent,
                "classified": classified,
            }
        )

    report.accuracy = _rate(report.correctly_classified, report.total_cases)
    return report


def format_corroboration_report(report: CorroborationReport) -> str:
    lines = [
        "=== Corroboration benchmark: independent grounded source families ===",
        f"cases: {report.total_cases}",
        f"expected: none={report.expected.get(STATE_NONE, 0)}, "
        f"single_source={report.expected.get(STATE_SINGLE_SOURCE, 0)}, "
        f"corroborated={report.expected.get(STATE_CORROBORATED, 0)}",
        f"predicted: none={report.predicted.get(STATE_NONE, 0)}, "
        f"single_source={report.predicted.get(STATE_SINGLE_SOURCE, 0)}, "
        f"corroborated={report.predicted.get(STATE_CORROBORATED, 0)}",
        f"fully classified: {report.correctly_classified}/{report.total_cases} "
        f"({report.accuracy:.1%})",
        f"false corroborations: {report.false_corroborations} (target 0)",
        f"missed corroborations: {report.missed_corroborations}",
        f"duplicate family inflation: {report.duplicate_family_inflation} (target 0)",
        f"false auto-approvals: {report.false_auto_approvals} (target 0)",
        f"false human reviews: {report.false_human_reviews}",
        "--- per case ---",
    ]
    for case in report.per_case:
        marker = "ok" if case["classified"] else "MISMATCH"
        lines.append(
            f"  [{marker}] {case['label']}: expected={case['expected']} "
            f"(ind={case['expected_independent']}) predicted={case['predicted']} "
            f"(ind={case['predicted_independent']})"
        )
    return "\n".join(lines)


def run_corroboration_benchmark() -> CorroborationReport:
    return evaluate_corroboration_cases(CORROBORATION_FIXTURE_CASES)


def main() -> None:
    print(format_corroboration_report(run_corroboration_benchmark()))


if __name__ == "__main__":
    main()