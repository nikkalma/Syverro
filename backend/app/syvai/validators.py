"""Deterministic validation for timeline claims.

All checks here are pure code — no LLM calls. The classifier produces a
minimal outcome set:

    validated    — structurally sound and grounded in trusted evidence
    needs_review — acceptable but requires a human decision (missing
                   evidence, near-duplicate, posthumous date)
    conflict     — conflicts with an existing curated timeline event
    invalid      — malformed or impossible (bad date, precedes author birth)

Every outcome also carries a review band that separates *why* a claim needs
attention and separates genuinely unsafe claims from policy-mandated review:

    auto_approved  — validated and new: no human decision needed (apply is
                     still explicit, but there is nothing to arbitrate)
    auto_rejected  — deterministically resolvable: restatements of curated
                     events (exact duplicate / same-day restatement) and
                     schema-invalid claims add nothing or are garbage; the
                     proposal is rejected without queuing a reviewer
    quality_review — factual risk: unsupported claim, date conflict, or an
                     ambiguous near-duplicate a human must decide on
    policy_review  — factually fine but policy says confirm (posthumous
                     publication)
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from datetime import date

from app.syvai.timeline_claims import DATE_PRECISION_VALUES, TimelineClaim

# ---------------------------------------------------------------------------
# Date normalization
# ---------------------------------------------------------------------------

_APPROX_PREFIXES = (
    "circa ",
    "c. ",
    "c ",
    "around ",
    "approximately ",
    "approx. ",
    "approx ",
    "~",
    "ca. ",
)
_DECADE_QUALIFIER = re.compile(r"^\s*(early|mid|late|early-|mid-|late-)?\s*(\d{4})s?\.?\s*$")
_YEAR_ONLY = re.compile(r"^\s*(\d{4})\.?\s*$")
_MONTH_ONLY = re.compile(r"^\s*(\d{4})-(\d{1,2})\.?\s*$")
_FULL_DATE = re.compile(r"^\s*(\d{4})-(\d{1,2})-(\d{1,2})\.?\s*$")

_DATE_SANITY_MIN_YEAR = 1000
_DATE_SANITY_MAX_YEAR = 2100


def normalize_date_value(value: str) -> str:
    """Strip approximate qualifiers and return a clean ``YYYY``/``YYYY-MM``/
    ``YYYY-MM-DD`` value. ``early 1840s`` -> ``1840``; ``circa 1847`` -> ``1847``.
    """
    v = value.strip().strip("[]()")
    lowered = v.lower()
    for prefix in _APPROX_PREFIXES:
        if lowered.startswith(prefix):
            v = v[len(prefix) :]
            break
    m = _DECADE_QUALIFIER.match(v)
    if m:
        return m.group(2)
    return v.strip()


@dataclass(frozen=True)
class ParsedDate:
    year: int
    month: int | None = None
    day: int | None = None


def parse_date(value: str) -> ParsedDate | None:
    """Parse a cleaned date string into (year, month, day) or None."""
    v = normalize_date_value(value)
    m = _FULL_DATE.match(v)
    if m:
        year, month, day = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if not (1 <= month <= 12 and 1 <= day <= 31):
            return None
        try:
            date(year, month, day)
        except ValueError:
            return None
        return ParsedDate(year, month, day)
    m = _MONTH_ONLY.match(v)
    if m:
        year, month = int(m.group(1)), int(m.group(2))
        if not 1 <= month <= 12:
            return None
        return ParsedDate(year, month)
    m = _YEAR_ONLY.match(v)
    if m:
        return ParsedDate(int(m.group(1)))
    return None


def date_granularity(value: str) -> str:
    """Return the granularity implied by a date string."""
    v = normalize_date_value(value)
    if _FULL_DATE.match(v):
        return "full"
    if _MONTH_ONLY.match(v):
        return "month"
    if _YEAR_ONLY.match(v):
        return "year"
    return "unknown"


def date_key(value: str) -> str:
    """A comparable key: ``1847`` < ``1847-10`` < ``1847-10-16``."""
    return normalize_date_value(value)


def _precision_granularity_order(precision: str) -> int:
    return {"year": 1, "month": 2, "full": 3}.get(precision, 0)


# ---------------------------------------------------------------------------
# Normalized label similarity
# ---------------------------------------------------------------------------


def normalize_label(label: str) -> str:
    text = unicodedata.normalize("NFKD", label).casefold()
    text = re.sub(r"[^\w\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def labels_similar(a: str, b: str) -> bool:
    na, nb = normalize_label(a), normalize_label(b)
    if not na or not nb:
        return False
    if na == nb:
        return True
    return na.startswith(nb) or nb.startswith(na)


# ---------------------------------------------------------------------------
# Review bands and reasons
# ---------------------------------------------------------------------------

REVIEW_BAND_AUTO_APPROVED = "auto_approved"
REVIEW_BAND_AUTO_REJECTED = "auto_rejected"
REVIEW_BAND_QUALITY = "quality_review"
REVIEW_BAND_POLICY = "policy_review"

REVIEW_BAND_VALUES = {
    REVIEW_BAND_AUTO_APPROVED,
    REVIEW_BAND_AUTO_REJECTED,
    REVIEW_BAND_QUALITY,
    REVIEW_BAND_POLICY,
}

REVIEW_REASON_NEW_GROUNDED = "new_grounded"
REVIEW_REASON_INVALID_CLAIM = "invalid_claim"
REVIEW_REASON_EXACT_DUPLICATE = "exact_duplicate"
REVIEW_REASON_RESTATEMENT = "restatement"
REVIEW_REASON_NEAR_DUPLICATE_AMBIGUOUS = "near_duplicate_ambiguous"
REVIEW_REASON_DATE_CONFLICT = "date_conflict"
REVIEW_REASON_UNSUPPORTED = "unsupported_claim"
REVIEW_REASON_POSTHUMOUS = "posthumous_event"

# Bands whose proposals genuinely require a human decision.
REVIEW_BANDS_NEEDING_HUMAN = {REVIEW_BAND_QUALITY, REVIEW_BAND_POLICY}


def _label_token_overlap(a: str, b: str) -> float:
    """Fraction of the shorter label's normalized tokens present in the longer."""
    tokens_a = normalize_label(a).split()
    tokens_b = normalize_label(b).split()
    if not tokens_a or not tokens_b:
        return 0.0
    shorter, longer = (
        (tokens_a, tokens_b) if len(tokens_a) <= len(tokens_b) else (tokens_b, tokens_a)
    )
    common = sum(1 for token in shorter if token in longer)
    return common / len(shorter)


def _is_restatement(claim: "TimelineClaim", matched_event: ExistingEvent | None) -> bool:
    """True when ``claim`` re-describes ``matched_event`` with no new information.

    Used only for the auto-reject decision — ``compare_with_existing`` is
    untouched. A claim is a restatement when it shares the event type and the
    exact same date value as the curated event, and either the labels overlap
    (identical, prefix, or >=70% token overlap) or both dates are day-precise
    (same-type same-day events are overwhelmingly restatements, not distinct
    events). Anything else stays in human review.
    """
    if not matched_event:
        return False
    if claim.event_type != matched_event.event_type:
        return False
    if normalize_date_value(claim.date_value) != normalize_date_value(matched_event.date_value):
        return False
    if labels_similar(claim.label, matched_event.label):
        return True
    if _label_token_overlap(claim.label, matched_event.label) >= 0.7:
        return True
    return (
        date_granularity(claim.date_value) == "full"
        and date_granularity(matched_event.date_value) == "full"
    )


# ---------------------------------------------------------------------------
# Result types
# ---------------------------------------------------------------------------


@dataclass
class ExistingEvent:
    id: str
    event_type: str
    date_value: str
    date_precision: str
    label: str


@dataclass
class ValidationResult:
    validation_state: str
    conflict_state: str
    issues: list[str] = field(default_factory=list)
    matched_event: ExistingEvent | None = None
    normalized_date_value: str | None = None
    parsed_date: ParsedDate | None = None
    review_band: str = REVIEW_BAND_AUTO_APPROVED
    review_reason: str = REVIEW_REASON_NEW_GROUNDED

    @property
    def is_validated(self) -> bool:
        return self.validation_state == "validated"


# ---------------------------------------------------------------------------
# Validation entry point
# ---------------------------------------------------------------------------


def validate_timeline_claim(
    claim: TimelineClaim,
    *,
    author_birth_date: str | None,
    author_death_date: str | None,
    existing_events: list[ExistingEvent],
    source_count: int,
) -> ValidationResult:
    """Validate a single claim deterministically and classify it."""
    issues: list[str] = []
    precision_mismatch = False
    result = ValidationResult(
        validation_state="validated",
        conflict_state="new",
        issues=issues,
    )

    # --- 1. Required fields & date format ---
    if not claim.label.strip():
        issues.append("missing label")
    if not claim.event_type:
        issues.append("missing event_type")
    if not claim.date_value.strip():
        issues.append("missing date_value")

    parsed = parse_date(claim.date_value) if claim.date_value.strip() else None
    if parsed is None:
        issues.append("invalid date format")
    else:
        if not (_DATE_SANITY_MIN_YEAR <= parsed.year <= _DATE_SANITY_MAX_YEAR):
            issues.append(f"date year out of sane range ({_DATE_SANITY_MIN_YEAR}-{_DATE_SANITY_MAX_YEAR})")
        result.parsed_date = parsed
        result.normalized_date_value = normalize_date_value(claim.date_value)

    if claim.date_precision not in DATE_PRECISION_VALUES:
        issues.append(f"invalid date_precision '{claim.date_precision}'")
    elif parsed is not None and claim.date_precision != "approximate":
        needed = _precision_granularity_order(claim.date_precision)
        actual = _precision_granularity_order(date_granularity(claim.date_value))
        if needed > actual:
            issues.append(
                f"date_precision '{claim.date_precision}' requires finer date_value '{claim.date_value}'"
            )
            precision_mismatch = True

    # --- 2. Chronology vs author lifespan ---
    if parsed is not None and author_birth_date:
        author_birth = parse_date(author_birth_date)
        if author_birth and (parsed.year, parsed.month or 1, parsed.day or 1) < (
            author_birth.year,
            author_birth.month or 1,
            author_birth.day or 1,
        ):
            issues.append("event precedes author birth date")

    posthumous = False
    if parsed is not None and author_death_date:
        author_death = parse_date(author_death_date)
        if author_death and (parsed.year, parsed.month or 12, parsed.day or 28) > (
            author_death.year,
            author_death.month or 12,
            author_death.day or 28,
        ):
            issues.append("event after author death date (may be posthumous)")
            posthumous = True

    # --- 3. Comparison against existing curated events ---
    comparison = compare_with_existing(claim, existing_events)
    result.matched_event = comparison.matched_event
    result.conflict_state = comparison.conflict_state
    if comparison.issue:
        issues.append(comparison.issue)

    # --- 4. Source presence ---
    if source_count <= 0:
        issues.append("no supporting source evidence")

    # --- Classify ---
    hard_blockers = {
        "invalid date format",
        "date year out of sane range (1000-2100)",
        "missing label",
        "missing event_type",
        "missing date_value",
        "invalid date_precision",
        "event precedes author birth date",
    }
    if any(issue in hard_blockers for issue in issues) or precision_mismatch:
        result.validation_state = "invalid"
    elif result.conflict_state == "conflict":
        result.validation_state = "conflict"
    elif issues:
        result.validation_state = "needs_review"
    else:
        result.validation_state = "validated"

    if posthumous and result.validation_state == "validated":
        # Posthumous publications are legitimate, but a reviewer should confirm.
        result.validation_state = "needs_review"

    result.review_band, result.review_reason = _classify_review(
        result, claim, source_count=source_count, posthumous=posthumous
    )

    return result


def _classify_review(
    result: ValidationResult,
    claim: TimelineClaim,
    *,
    source_count: int,
    posthumous: bool,
) -> tuple[str, str]:
    """Decide the review band and reason deterministically.

    Priority order: hard facts (invalid/conflict/duplicate) first, then
    evidence gaps (unsupported), then policy-only flags (posthumous).
    """
    if result.validation_state == "invalid":
        return REVIEW_BAND_AUTO_REJECTED, REVIEW_REASON_INVALID_CLAIM
    if result.conflict_state == "conflict":
        return REVIEW_BAND_QUALITY, REVIEW_REASON_DATE_CONFLICT
    if result.conflict_state == "duplicate":
        return REVIEW_BAND_AUTO_REJECTED, REVIEW_REASON_EXACT_DUPLICATE
    if result.conflict_state == "near_duplicate":
        if _is_restatement(claim, result.matched_event):
            return REVIEW_BAND_AUTO_REJECTED, REVIEW_REASON_RESTATEMENT
        return REVIEW_BAND_QUALITY, REVIEW_REASON_NEAR_DUPLICATE_AMBIGUOUS
    if source_count <= 0:
        return REVIEW_BAND_QUALITY, REVIEW_REASON_UNSUPPORTED
    if posthumous:
        return REVIEW_BAND_POLICY, REVIEW_REASON_POSTHUMOUS
    return REVIEW_BAND_AUTO_APPROVED, REVIEW_REASON_NEW_GROUNDED


@dataclass
class Comparison:
    conflict_state: str
    matched_event: ExistingEvent | None = None
    issue: str | None = None


def compare_with_existing(claim: TimelineClaim, existing_events: list[ExistingEvent]) -> Comparison:
    """Classify a claim against the author's curated timeline.

    - exact duplicate: same normalized date, event type, and label
    - near duplicate:  same event type and (same date or similar label)
    - conflict:        same event type, overlapping date, different value
    - new:             no match
    """
    if not existing_events:
        return Comparison(conflict_state="new")

    claim_label = normalize_label(claim.label)
    claim_date = parse_date(claim.date_value)
    candidates: list[ExistingEvent] = []
    for event in existing_events:
        event_date = parse_date(event.date_value)
        same_date = (
            event_date is not None
            and claim_date is not None
            and (event_date.year, event_date.month, event_date.day)
            == (claim_date.year, claim_date.month, claim_date.day)
        )
        if not same_date and event_date is not None and claim_date is not None:
            same_date = event_date.year == claim_date.year
        same_label = labels_similar(claim.label, event.label)

        if same_date and same_label and event.event_type == claim.event_type:
            return Comparison(
                conflict_state="duplicate",
                matched_event=event,
                issue="exact duplicate of existing event",
            )
        if event.event_type == claim.event_type and (same_date or same_label):
            candidates.append(event)

    if candidates:
        # Highest similarity candidate is reported.
        best = max(
            candidates,
            key=lambda e: (e.date_value == claim.date_value, labels_similar(claim.label, e.label)),
        )
        return Comparison(
            conflict_state="near_duplicate",
            matched_event=best,
            issue="similar to existing event (possible duplicate/update)",
        )

    # Same event type, close in time (within a year), different date.
    if claim_date is not None:
        for event in existing_events:
            event_date = parse_date(event.date_value)
            if event_date is not None and event.event_type == claim.event_type:
                if abs(event_date.year - claim_date.year) <= 1:
                    return Comparison(
                        conflict_state="conflict",
                        matched_event=event,
                        issue="conflicts with existing event date",
                    )

    return Comparison(conflict_state="new")
