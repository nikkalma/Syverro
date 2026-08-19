"""Explainable confidence for timeline proposals.

Confidence is derived from observable evidence rather than model self-report:

    base 0.50                      structured claim with >=1 trusted source
    + 0.15                         >=2 VERIFIED, INDEPENDENTLY-GROUNDED
                                   source families agree (0.2E)
    + 0.10                         >=3 such families agree (0.2E)
    + 0.10 * avg_reliability       mean reliability of GROUNDED sources (0..1)
    + 0.15                         deterministic validation == validated
    + 0.05                         >=1 source with verified claim-level
                                   grounding (0.2C; skipped when unverified)
    - 0.10                         conflict_state == duplicate / near_duplicate
    - 0.30                         conflict_state == conflict
    - 0.00                         validation_state == needs_review

Final value is clamped to [0.10, 0.99].

0.2E changes (multi-source corroboration):

  * the multiplicity bonuses ($+0.15$ / $+0.10$) are granted ONLY for sources in
    distinct source families whose claim-level evidence was deterministically
    verified (``independent_grounded_source_count``). A second Wikipedia mirror,
    duplicate URL variants, or an unparseable URL never inflates confidence;
  * the reliability averaging term is computed over the GROUNDED sources only,
    so a partially-grounded source never contributes a reliability bonus.

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
    reliabilities: list[str | float | None] | None = None,
    grounded_source_count: int = 0,
    independent_grounded_source_count: int = 0,
    grounded_reliabilities: list[str | float | None] | None = None,
) -> float:
    score = 0.0
    if source_count >= 1:
        score = 0.50
    # 0.2E: multiplicity bonuses reflect verified, family-distinct grounding.
    if independent_grounded_source_count >= 2:
        score += 0.15
    if independent_grounded_source_count >= 3:
        score += 0.10
    # Reliability term counts grounded sources only (never partial/ungrounded).
    reliability_input = (
        grounded_reliabilities if grounded_reliabilities is not None else reliabilities
    )
    if reliability_input:
        score += 0.10 * source_reliability_score(reliability_input)
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