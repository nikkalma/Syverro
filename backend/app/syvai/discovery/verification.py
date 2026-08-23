"""Deterministic source identity and content-capability inspection.

Identity trust is Author-specific. Capabilities describe retrieved document
content and are routing hints only; neither mechanism establishes claim truth.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from app.syvai.discovery.assessment import _identity_matches

IDENTITY_VERIFIER_VERSION = "identity_v2"
CONTENT_INSPECTOR_VERSION = "content_v2"

CAPABILITIES = (
    "IDENTITY", "BIOGRAPHY", "DATES", "PLACES", "OCCUPATIONS",
    "LANGUAGES", "LITERARY_CONTEXT", "TIMELINE", "BIBLIOGRAPHY",
)

_CREATOR_KEYS = {"creator", "contributor", "author", "authors"}


def _creator_matches(metadata: dict[str, Any] | None, query_terms: list[str]) -> tuple[str, str] | None:
    for key, value in (metadata or {}).items():
        normalized_key = key.casefold().replace(" ", "_")
        if normalized_key not in _CREATOR_KEYS or not value:
            continue
        for term in query_terms:
            if _identity_matches(str(value), term):
                return key, str(value)
    return None


def verify_candidate_identity(
    *,
    query_terms: list[str],
    title: str | None,
    metadata_fields: dict[str, Any] | None,
    origin: str | None,
    resolved_identity=None,
    candidate_url: str | None = None,
) -> dict:
    """Return inspectable, fail-closed Author identity provenance."""
    provenance = {
        "state": "needs_review",
        "method": "unresolved",
        "matched_entity": None,
        "query_provenance": list(query_terms),
        "conflict_checks": ["full_name_collision_not_resolved"],
        "verifier_version": IDENTITY_VERIFIER_VERSION,
        "reason": "No deterministic Author identity proof was available.",
    }

    if resolved_identity is not None and candidate_url and candidate_url == getattr(resolved_identity, "en_url", None):
        fallback = getattr(resolved_identity, "fallback", None) or {}
        provenance.update({
            "state": "verified",
            "method": "wikipedia_langlink" if getattr(resolved_identity, "method", "") == "exact_title" else "wikipedia_resolved_identity",
            "matched_identifier": fallback.get("qid"),
            "matched_title": getattr(resolved_identity, "en_title", None),
            "matched_entity": getattr(resolved_identity, "ru_title", None),
            "resolution_provenance": {
                "source_variant": getattr(resolved_identity, "source_variant", None),
                "origin": origin,
                "corroboration": fallback.get("corroboration"),
            },
            "conflict_checks": ["resolved_identity_unambiguous"],
            "reason": "Candidate is the resolved article in the deterministic identity chain.",
        })
        return provenance

    resolved_terms = list(getattr(resolved_identity, "romanized_terms", ()) or ())
    resolved_creator = _creator_matches(metadata_fields, resolved_terms)
    if resolved_identity is not None and resolved_creator:
        key, value = resolved_creator
        matched_term = next(term for term in resolved_terms if _identity_matches(value, term))
        provenance.update({
            "state": "verified",
            "method": "structured_creator_resolved_identity_term",
            "matched_entity": value,
            "matched_identifier": (getattr(resolved_identity, "fallback", None) or {}).get("qid"),
            "matched_title": title,
            "matched_identity_term": matched_term,
            "resolution_provenance": {
                "metadata_path": key,
                "identity_source_variant": getattr(resolved_identity, "source_variant", None),
                "resolved_title": getattr(resolved_identity, "en_title", None),
                "origin": origin,
            },
            "conflict_checks": ["creator_matches_deterministically_resolved_identity_term"],
            "reason": "Creator metadata matches a term exported by the deterministic Author identity resolution.",
        })
        return provenance

    creator = _creator_matches(metadata_fields, query_terms)
    if creator:
        key, value = creator
        identifier = next((
            (meta_key, meta_value) for meta_key, meta_value in (metadata_fields or {}).items()
            if meta_key.casefold().replace(" ", "_") in {
                "creator_id", "author_id", "authority_id", "lccn", "qid", "wikidata_id",
            } and meta_value
        ), None)
        if identifier:
            provenance.update({
                "state": "verified",
                "method": "structured_creator_authority_identity",
                "matched_entity": value,
                "matched_identifier": str(identifier[1]),
                "matched_title": title,
                "resolution_provenance": {
                    "metadata_path": key, "identifier_path": identifier[0], "origin": origin,
                },
                "conflict_checks": ["full_canonical_name_in_creator_field", "stable_authority_identifier_present"],
                "reason": "Structured creator identity is bound to a stable authority identifier.",
            })
        else:
            provenance.update({
                "method": "structured_creator_name_only",
                "matched_entity": value,
                "matched_title": title,
                "resolution_provenance": {"metadata_path": key, "origin": origin},
                "conflict_checks": ["stable_authority_identifier_missing"],
                "reason": "Creator metadata matches the name but lacks a stable disambiguating identifier.",
            })
        return provenance

    creator_values = [
        str(value) for key, value in (metadata_fields or {}).items()
        if key.casefold().replace(" ", "_") in _CREATOR_KEYS and value
    ]
    if creator_values:
        provenance.update({
            "state": "rejected",
            "method": "structured_creator_mismatch",
            "conflict_checks": ["creator_field_does_not_match_author"],
            "reason": "Structured creator metadata identifies a different or unresolved entity.",
        })
    return provenance


def inspect_content_capabilities(
    *, evidence: str | None, metadata_fields: dict[str, Any] | None
) -> tuple[list[str], dict[str, list[dict]]]:
    """Conservatively detect capabilities from actual text/metadata only."""
    text = " ".join((evidence or "").split())
    lowered = text.casefold()
    result: dict[str, list[dict]] = {}

    def add(capability: str, *, span: str | None = None, path: str | None = None, value: Any = None):
        if capability not in CAPABILITIES or (not span and not path):
            return
        item = {"kind": "source_span", "span": span} if span else {
            "kind": "structured_metadata", "path": path, "value": str(value),
        }
        result.setdefault(capability, []).append(item)

    creator = next((
        (key, value) for key, value in (metadata_fields or {}).items()
        if key.casefold().replace(" ", "_") in _CREATOR_KEYS and value
    ), None)
    if creator:
        add("IDENTITY", path=creator[0], value=creator[1])
        title_item = next(((k, v) for k, v in (metadata_fields or {}).items() if k.casefold() == "title" and v), None)
        if title_item:
            add("BIBLIOGRAPHY", path=title_item[0], value=title_item[1])
            add("BIBLIOGRAPHY", path=creator[0], value=creator[1])

    if text:
        sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+", text) if part.strip()]
        for span in sentences:
            low = span.casefold()
            if any(word in low for word in (" biography", " biographical", " biography:", "born ", "was born", "родил", "биограф")) or re.search(
                r"\b(?:was|is)\s+(?:an?\s+)?(?:english\s+)?(?:writer|novelist|poet|playwright)\b", low
            ):
                add("BIOGRAPHY", span=span)
            if re.search(r"\b(?:1[0-9]{3}|20[0-9]{2})\b", span):
                add("DATES", span=span)
            if any(word in low for word in (" lived in", " born in", "place:", "место", "жил в", "родил")):
                add("PLACES", span=span)
            if any(word in low for word in (" writer", " poet", " novelist", "playwright", "писател", "поэт", "драматург")):
                add("OCCUPATIONS", span=span)
            if any(word in low for word in (" language", "wrote in", "язык", "писал на")):
                add("LANGUAGES", span=span)
            if any(word in low for word in (" literary movement", "critical introduction", "literary criticism", "романтизм", "литературн")) or re.search(
                r"\bliterary\s+(?:realism|romanticism|modernism|naturalism)\b", low
            ):
                add("LITERARY_CONTEXT", span=span)
            if re.search(r"\b(?:1[0-9]{3}|20[0-9]{2})\b", span) and any(word in low for word in ("published", "award", "born", "died", "издан", "родил", "умер")):
                add("TIMELINE", span=span)

    return sorted(result), result


def inspected_at() -> datetime:
    return datetime.now(timezone.utc)
