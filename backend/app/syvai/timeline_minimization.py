"""Deterministically shrink timeline claims to what their evidence supports."""

from __future__ import annotations

import re

from app.syvai.evidence import build_material_requirements, extract_detail_tokens, verify_evidence
from app.syvai.timeline_claims import TimelineClaim

_MONTHS = (
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
)


def _joined_evidence(fragments: list[str | None]) -> str:
    return " ".join(fragment.strip() for fragment in fragments if fragment and fragment.strip())


def _month_is_supported(month: int, evidence: str, year: str) -> bool:
    name = _MONTHS[month - 1]
    lowered = evidence.casefold()
    return (
        name in lowered
        or bool(re.search(rf"(?<!\d){re.escape(year)}[-/.]0?{month}(?!\d)", evidence))
        or bool(re.search(rf"(?<!\d)0?{month}[-/.](?:\d{{1,2}}[-/.])?{re.escape(year)}(?!\d)", evidence))
    )


def _day_is_supported(day: int, month: int, evidence: str, year: str) -> bool:
    name = _MONTHS[month - 1]
    return any(
        re.search(pattern, evidence, flags=re.IGNORECASE)
        for pattern in (
            rf"(?<!\d){day}(?:st|nd|rd|th)?\s+{name}\s+{re.escape(year)}(?!\d)",
            rf"{name}\s+{day}(?:st|nd|rd|th)?(?:,)?\s+{re.escape(year)}(?!\d)",
            rf"(?<!\d){re.escape(year)}[-/.]0?{month}[-/.]0?{day}(?!\d)",
        )
    )


def _minimal_date(date_value: str, evidence: str) -> tuple[str, str]:
    match = re.fullmatch(r"(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?", date_value.strip())
    if not match:
        return date_value, "approximate"
    year, month_text, day_text = match.groups()
    if year not in evidence:
        return date_value, "full" if day_text else "month" if month_text else "year"
    if not month_text:
        return year, "year"
    month = int(month_text)
    if not _month_is_supported(month, evidence, year):
        return year, "year"
    if not day_text:
        return f"{year}-{month:02d}", "month"
    day = int(day_text)
    if not _day_is_supported(day, month, evidence, year):
        return f"{year}-{month:02d}", "month"
    return f"{year}-{month:02d}-{day:02d}", "full"


def _place_is_supported(place: str, evidence: str) -> bool:
    tokens = {
        token.casefold()
        for token in re.findall(r"[^\W_]+", place, flags=re.UNICODE)
        if len(token) >= 3
    }
    evidence_tokens = set(re.findall(r"[^\W_]+", evidence.casefold(), flags=re.UNICODE))
    return bool(tokens) and tokens.issubset(evidence_tokens)


def minimize_timeline_claim(
    claim: TimelineClaim,
    evidence_fragments: list[str | None],
) -> TimelineClaim:
    """Return a copy whose optional/date components do not exceed evidence.

    The factual core (label/event type) is never rewritten. If it is not
    supported, the normal epistemic verifier still rejects it.
    """
    evidence = _joined_evidence(evidence_fragments)
    if not evidence:
        return claim

    date_value, precision = _minimal_date(claim.date_value, evidence)
    place = claim.place if claim.place and _place_is_supported(claim.place, evidence) else None
    description = claim.description

    minimized = claim.model_copy(update={
        "date_value": date_value,
        "date_precision": precision,
        "place": place,
        "description": description,
    })

    if description:
        evidence_words = set(re.findall(r"[^\W_]+", evidence.casefold(), flags=re.UNICODE))
        description_words = extract_detail_tokens(description)
        if description_words and not description_words.issubset(evidence_words):
            minimized = minimized.model_copy(update={"description": None})
            description = None

    if description:
        material = build_material_requirements(
            label=minimized.label,
            description=description,
            place=place,
            date_value=date_value,
        )
        if not verify_evidence(evidence, evidence, material=material).is_grounded:
            without_description = minimized.model_copy(update={"description": None})
            reduced_material = build_material_requirements(
                label=without_description.label,
                description=None,
                place=place,
                date_value=date_value,
            )
            if verify_evidence(evidence, evidence, material=reduced_material).is_grounded:
                minimized = without_description

    return minimized
