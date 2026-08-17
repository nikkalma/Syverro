"""Explainable confidence for timeline proposals.

Confidence is derived from observable evidence rather than model self-report:

    base 0.50                      structured claim with >=1 trusted source
    + 0.15                         >=2 distinct sources agree
    + 0.10                         >=3 distinct sources agree
    + 0.10 * avg_reliability       mean reliability of linked sources (0..1)
    + 0.15                         deterministic validation == validated
    + 0.05                         >=1 source with verified claim-level
                                   grounding (0.2C; skipped when unverified)
    - 0.10                         conflict_state == duplicate / near_duplicate
    - 0.30                         conflict_state == conflict
    - 0.00                         validation_state == needs_review

Final value is clamped to [0.10, 0.99].

Reliability normalization handles the legacy free-form ``reliability_score``
strings in the ``sources`` table ("4", "0.8", "1.0", ...):
  - numeric <= 1.0 is used directly;
  - integer 1-5 is mapped {5: 1.0, 4: 0.9, 3: 0.7, 2: 0.5, 1: 0.3};
  - otherwise 0.5 is assumed.
"""

from __future__ import annotations

from app.syvai.validators import ValidationResult


def normalize_reliability(value: str | float | None) -> float:
    if value is None:
        return 0.5
    # Integer-valued strings ("3", "4", "5") are legacy 1-5 ratings.
    if isinstance(value, str) and value.strip().rstrip(".").isdigit():
        rating = int(value.strip())
        return {5: 1.0, 4: 0.9, 3: 0.7, 2: 0.5, 1: 0.3}.get(rating, 0.5)
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0.5
    if number <= 1.0:
        return max(0.0, min(1.0, number))
    # Fractional/numeric values outside 0-1 are treated as 1-5 ratings.
    return {5: 1.0, 4: 0.9, 3: 0.7, 2: 0.5, 1: 0.3}.get(int(number), 0.5)


def source_reliability_score(reliabilities: list[str | float | None]) -> float:
    if not reliabilities:
        return 0.0
    return sum(normalize_reliability(r) for r in reliabilities) / len(reliabilities)


def compute_confidence(
    *,
    validation: ValidationResult,
    source_count: int,
    distinct_source_count: int,
    reliabilities: list[str | float | None],
    grounded_source_count: int = 0,
) -> float:
    score = 0.0
    if source_count >= 1:
        score = 0.50
    if distinct_source_count >= 2:
        score += 0.15
    if distinct_source_count >= 3:
        score += 0.10
    if reliabilities:
        score += 0.10 * source_reliability_score(reliabilities)
    if source_count >= 1 and grounded_source_count >= 1:
        score += 0.05

    if validation.validation_state == "validated":
        score += 0.15
    elif validation.validation_state == "needs_review":
        score += 0.0
    elif validation.validation_state == "conflict":
        score -= 0.30
    elif validation.validation_state == "invalid":
        score -= 0.30

    if validation.conflict_state in {"duplicate", "near_duplicate"}:
        score -= 0.10

    return round(max(0.10, min(0.99, score)), 4)
