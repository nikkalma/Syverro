"""Deterministic assessment of discovered source candidates.

Every candidate is classified into exactly one bucket:

  * ``auto_usable`` — high authority, high quality score: promoted to
    ``sources`` without a human (review-by-exception does not surface it).
  * ``needs_review`` — a curator must decide; the Studio review surface shows
    these candidates.
  * ``rejected``    — deterministically excluded: duplicate, untrusted TLD,
    or so little content / authority that it cannot be evidence.

The score is transparent and unit-testable: authority weight + title/URL
relevance to the author query + content signal from the evidence excerpt.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.syvai.discovery.urls import normalize_url, registrable_domain

ASSESSMENT_AUTO_USABLE = "auto_usable"
ASSESSMENT_NEEDS_REVIEW = "needs_review"
ASSESSMENT_REJECTED = "rejected"

TIERS = ("high", "medium", "low", "unknown")

AUTHORITY_WEIGHT = {
    "high": 1.0,
    "medium": 0.7,
    "low": 0.4,
    "unknown": 0.3,
}

AUTO_USABLE_SCORE = 0.85

SPAM_TLDS = {
    ".xyz", ".top", ".club", ".click", ".site", ".online", ".icu",
    ".work", ".gdn", ".loan", ".stream",
}

REASON_DUPLICATE = "duplicate"
REASON_UNTRUSTED_TLD = "untrusted_tld"
REASON_LOW_QUALITY = "low_quality"
REASON_HIGH_AUTHORITY = "high_authority"
REASON_MANUAL_REVIEW = "manual_review"


@dataclass(frozen=True)
class Assessment:
    assessment: str
    reason: str
    quality_score: float
    authority_tier: str
    normalized_url: str


def _content_signal(evidence: str | None) -> float:
    length = len((evidence or "").strip())
    if length >= 40:
        return 1.0
    if length >= 10:
        return 0.6
    return 0.3


def _untrusted_tld(url: str) -> bool:
    host = registrable_domain(url)
    return any(host.endswith(tld) for tld in SPAM_TLDS)


def _title_relevance(title: str | None, url: str, query_terms: list[str]) -> float:
    haystack = f"{title or ''} {url}".casefold()
    for term in query_terms:
        if not term:
            continue
        if term.casefold() in haystack:
            return 1.0
    return 0.5


def assess_candidate(
    *,
    url: str,
    title: str | None,
    evidence: str | None,
    authority_tier: str,
    query_terms: list[str],
    existing_normalized: set[str] | None = None,
) -> Assessment:
    """Classify a normalized candidate URL into an assessment bucket."""
    normalized = normalize_url(url) or ""
    if existing_normalized and normalized in existing_normalized:
        return Assessment(
            assessment=ASSESSMENT_REJECTED,
            reason=REASON_DUPLICATE,
            quality_score=0.0,
            authority_tier=authority_tier,
            normalized_url=normalized,
        )

    if _untrusted_tld(url):
        return Assessment(
            assessment=ASSESSMENT_REJECTED,
            reason=REASON_UNTRUSTED_TLD,
            quality_score=0.0,
            authority_tier=authority_tier,
            normalized_url=normalized,
        )

    content_signal = _content_signal(evidence)
    if authority_tier in {"unknown", "low"} and content_signal <= 0.3:
        return Assessment(
            assessment=ASSESSMENT_REJECTED,
            reason=REASON_LOW_QUALITY,
            quality_score=0.2,
            authority_tier=authority_tier,
            normalized_url=normalized,
        )

    relevance = _title_relevance(title, url, query_terms)
    score = round(
        0.4 * AUTHORITY_WEIGHT.get(authority_tier, 0.3)
        + 0.4 * relevance
        + 0.2 * content_signal,
        4,
    )

    if authority_tier == "high" and score >= AUTO_USABLE_SCORE:
        return Assessment(
            assessment=ASSESSMENT_AUTO_USABLE,
            reason=REASON_HIGH_AUTHORITY,
            quality_score=score,
            authority_tier=authority_tier,
            normalized_url=normalized,
        )

    return Assessment(
        assessment=ASSESSMENT_NEEDS_REVIEW,
        reason=REASON_MANUAL_REVIEW,
        quality_score=score,
        authority_tier=authority_tier,
        normalized_url=normalized,
    )
