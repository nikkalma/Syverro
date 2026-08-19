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

import unicodedata
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


def _norm(text: str) -> str:
    """Prepare text for deterministic matching.

    NFKC first, so precomposed (U+00EB) and combining (e + U+0308) forms of the
    *same* character compare equal, then casefold. This is the generic fix for
    provider titles that arrive in a different normalization than the query
    terms (e.g. LOC's combining diaeresis in "Brontë").
    """
    return unicodedata.normalize("NFKC", text or "").casefold()


# Metadata keys that may legitimately identify the *author* of a work. Only
# these are consulted for relevance; free-text description/subject fields never
# are, so a passing mention in prose cannot inflate a candidate's score.
_AUTHOR_IDENTITY_METADATA_KEYS = {"creator", "contributor", "author", "authors"}


def _author_identity_text(metadata_fields: dict[str, str] | None) -> str:
    if not metadata_fields:
        return ""
    parts: list[str] = []
    for key, value in metadata_fields.items():
        if key.casefold().replace(" ", "_") in _AUTHOR_IDENTITY_METADATA_KEYS and value:
            parts.append(str(value))
    return " ".join(parts)


def _name_variants(name: str) -> list[str]:
    """Variants of an author full name likely to appear in catalog records.

    Handles both stored orders in either input: natural ("Anne Brontë") maps to
    inverted ("Brontë, Anne") and inverted maps back to natural. Only the last
    token is treated as the surname for multi-token names ("Mary Ann Evans" ->
    "Evans, Mary Ann").
    """
    stripped = name.strip()
    if not stripped:
        return []
    variants = [stripped]
    if "," in stripped:
        parts = [part.strip() for part in stripped.split(",")]
        if len(parts) == 2 and all(parts) and " " in parts[0]:
            variants.append(f"{parts[0]} {parts[1]}")
        elif len(parts) == 2 and all(parts):
            variants.append(f"{parts[1]} {parts[0]}")
    elif " " in stripped:
        given, _, surname = stripped.rpartition(" ")
        if given and surname:
            variants.append(f"{surname}, {given}")
    return variants


def _identity_matches(candidate: str, term: str) -> bool:
    """True when ``term`` (an author full name) identifies ``candidate`` text.

    Accepts both natural ("Anne Brontë") and inverted ("Brontë, Anne") orders,
    normalized NFKC + casefold so combining/precomposed forms compare equal.
    A different person with the same surname never matches, so sibling/family
    items cannot be promoted through authorship fields.
    """
    haystack = _norm(candidate)
    if not haystack:
        return False
    for variant in _name_variants(term):
        normalized = _norm(variant)
        if normalized and normalized in haystack:
            return True
    return False


def _title_relevance(
    title: str | None,
    url: str,
    query_terms: list[str],
    metadata_fields: dict[str, str] | None = None,
) -> float:
    # Title/URL matches keep the pre-0.3C semantics verbatim: an exact
    # normalized query term must appear.
    base = _norm(f"{title or ''} {url}")
    for term in query_terms:
        if term and _norm(term) in base:
            return 1.0
    # Rich metadata may only push relevance as far as *author identity*: the
    # author's own full name must appear in an author-identifying field.
    identity_text = _author_identity_text(metadata_fields)
    if identity_text:
        for term in query_terms:
            if _identity_matches(identity_text, term):
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
    metadata_fields: dict[str, str] | None = None,
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

    relevance = _title_relevance(title, url, query_terms, metadata_fields)
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
