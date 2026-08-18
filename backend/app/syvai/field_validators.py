"""Deterministic validation for 0.4B Author core fill field claims.

Shared across IDENTITY / BIOGRAPHY / LITERARY_CONTEXT. Pure code — no LLM
calls. Reuses ``ValidationResult`` from the timeline validators so the shared
confidence scorer keeps working unchanged.

Key rules (from the 0.4B brief):

  * value gaps -> invalid (auto_rejected);
  * a proposed value identical to an existing Author value -> duplicate
    (auto_rejected); a conflicting existing value -> ``field_conflict``
    (quality_review) — trusted sources never silently overwrite curated data;
  * missing evidence / unverified grounding -> quality_review (0.2D invariant
    preserved: auto-approval still requires deterministic grounding);
  * literary-context items that do not resolve to a canonical taxonomy label
    remain review-required proposals (never auto-created taxonomy nodes).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from app.syvai.field_specs import (
    DOMAIN_LITERARY_CONTEXT,
    TAXONOMY_FIELDS,
    VALUE_TYPE_ENTITY,
    VALUE_TYPE_LIST,
    VALUE_TYPE_TEXT,
    FieldSpec,
)
from app.syvai.validators import (
    REVIEW_BAND_AUTO_APPROVED,
    REVIEW_BAND_AUTO_REJECTED,
    REVIEW_BAND_QUALITY,
    REVIEW_REASON_EXACT_DUPLICATE,
    REVIEW_REASON_FIELD_CONFLICT,
    REVIEW_REASON_INVALID_CLAIM,
    REVIEW_REASON_NEW_GROUNDED,
    REVIEW_REASON_UNGROUNDED,
    REVIEW_REASON_UNRESOLVED_TAXONOMY,
    REVIEW_REASON_UNSUPPORTED,
    ValidationResult,
    parse_date,
)

# Hard, deterministic blockers that can never route to human review.
_HARD_BLOCKERS = {
    "missing value",
    "invalid structured value",
    "invalid date",
}


@dataclass
class FieldValidation:
    validation: ValidationResult
    value: Any
    taxonomy_match: str | None = None


def _text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def _norm_key(value: str) -> str:
    return value.strip().casefold()


def _slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.strip().casefold()).strip("-")


def normalize_list_items(items: list[str]) -> list[str]:
    """Strip, drop empties, and deduplicate case-insensitively (stable order)."""
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        cleaned = _text(item)
        if not cleaned:
            continue
        key = _norm_key(cleaned)
        if key in seen:
            continue
        seen.add(key)
        result.append(cleaned)
    return result


# Deterministic variant forms of existing canonical genre names. Only
# unambiguous abbreviations/compounds that normalize to a REAL canonical label
# are listed; nothing here creates a taxonomy node and nothing semantic is
# inferred. Keys are casefolded exact forms, values are the canonical label.
_TAXONOMY_VARIANTS = {
    "sci-fi": "Science Fiction",
    "sci fi": "Science Fiction",
    "scifi": "Science Fiction",
    "nonfiction": "Non-Fiction",
    "self help": "Self Development",
    "self-help": "Self Development",
    "selfhelp": "Self Development",
    "spiritual practice": "Spiritual Practices",
}


def match_taxonomy(item: str, canonical_names: set[str]) -> str | None:
    """Resolve a proposed literary label against canonical taxonomy names.

    Deterministic, in priority order:

      1. normalized (slug) equality with a canonical name — handles
         case/spacing/punctuation variance (existing behavior);
      2. deterministic variant/alias forms (0.6B Phase 3) mapped to a canonical
         label that actually exists in ``canonical_names``.

    Returns the canonical slug when found, else None (the proposal must then
    remain review-required). Never creates taxonomy rows.
    """
    key = _slugify(item)
    if not key:
        return None
    for name in canonical_names:
        if _slugify(name) == key:
            return key

    variant = _TAXONOMY_VARIANTS.get(item.strip().casefold())
    if variant:
        variant_slug = _slugify(variant)
        if any(_slugify(name) == variant_slug for name in canonical_names):
            return variant_slug
    return None


def _normalize_entity(spec: FieldSpec, value: dict, issues: list[str]) -> dict | None:
    """Validate/normalize one entity-shaped field claim value."""
    if spec.name == "active_years":
        from_year = value.get("from_year")
        to_year = value.get("to_year")
        if from_year is None and to_year is None:
            issues.append("missing value")
            return None
        parsed_from = parse_date(str(from_year)) if from_year is not None else None
        parsed_to = parse_date(str(to_year)) if to_year is not None else None
        if from_year is not None and parsed_from is None:
            issues.append("invalid date")
        if to_year is not None and parsed_to is None:
            issues.append("invalid date")
        return {
            "from_year": parsed_from.year if parsed_from is not None else None,
            "to_year": parsed_to.year if parsed_to is not None else None,
        }

    if spec.name == "citizenship":
        state_name = _text(value.get("state_name"))
        if not state_name:
            issues.append("missing value")
            return None
        for date_field in ("from_date", "to_date"):
            if value.get(date_field) and parse_date(str(value[date_field])) is None:
                issues.append("invalid date")
        return {
            "state_name": state_name,
            "from_date": _text(value.get("from_date")) or None,
            "to_date": _text(value.get("to_date")) or None,
        }

    if spec.name == "residence":
        place = _text(value.get("place"))
        if not place:
            issues.append("missing value")
            return None
        for date_field in ("from_date", "to_date"):
            if value.get(date_field) and parse_date(str(value[date_field])) is None:
                issues.append("invalid date")
        return {
            "place": place,
            "from_date": _text(value.get("from_date")) or None,
            "to_date": _text(value.get("to_date")) or None,
        }

    issues.append("invalid structured value")
    return None


def _existing_entity_key(spec: FieldSpec, value: dict) -> str:
    """A unique normalized key for comparing an entity value against existing."""
    if spec.name == "active_years":
        return f"{value.get('from_year')}-{value.get('to_year')}"
    if spec.name == "citizenship":
        return _norm_key(str(value.get("state_name") or ""))
    if spec.name == "residence":
        return _norm_key(str(value.get("place") or ""))
    return ""


def validate_field_claim(
    *,
    spec: FieldSpec,
    value: Any,
    label: str | None,
    description: str | None,
    existing_value: Any,
    source_count: int,
    grounded_source_count: int | None,
    taxonomy_names: set[str] | None = None,
) -> FieldValidation:
    """Validate one proposed field value and classify its review band."""
    issues: list[str] = []
    result = ValidationResult(
        validation_state="validated",
        conflict_state="new",
        issues=issues,
    )
    taxonomy_match: str | None = None

    # --- 1. Normalize + gap checks by value shape ---
    normalized: Any
    if spec.value_type == VALUE_TYPE_ENTITY:
        if not isinstance(value, dict):
            issues.append("invalid structured value")
            normalized = None
        else:
            normalized = _normalize_entity(spec, value, issues)
    else:
        normalized = _text(value)
        if not normalized:
            issues.append("missing value")
        elif spec.value_type == VALUE_TYPE_TEXT:
            if spec.min_text_length and len(normalized) < spec.min_text_length:
                issues.append("value too short to be an attributable summary")
            if spec.max_text_length and len(normalized) > spec.max_text_length:
                issues.append(f"value exceeds maximum length ({spec.max_text_length})")

    # --- 2. Existing-value comparison (never silent overwrite) ---
    conflict_state = "new"
    if normalized is not None:
        if spec.value_type == VALUE_TYPE_LIST or (
            spec.value_type == VALUE_TYPE_ENTITY and spec.name in {"citizenship", "residence"}
        ):
            existing_set: set[str] = set()
            for item in (existing_value or []):
                key = (
                    _norm_key(str(item))
                    if spec.value_type == VALUE_TYPE_LIST
                    else _norm_key(str(item))
                )
                existing_set.add(key)
            if spec.value_type == VALUE_TYPE_LIST:
                if _norm_key(str(normalized)) in existing_set:
                    conflict_state = "duplicate"
            else:
                if _existing_entity_key(spec, normalized) in existing_set:
                    conflict_state = "duplicate"
        elif spec.name == "active_years":
            existing: Any = existing_value
            if isinstance(existing, dict) and any(existing.get(k) is not None for k in ("from_year", "to_year")):
                if (
                    existing.get("from_year") == normalized.get("from_year")
                    and existing.get("to_year") == normalized.get("to_year")
                ):
                    conflict_state = "duplicate"
                else:
                    conflict_state = "conflict"
        else:
            existing_norm = _norm_key(str(existing_value)) if existing_value not in (None,) else ""
            if isinstance(existing_value, str) and existing_value.strip():
                existing_norm = _norm_key(existing_value)
                if existing_norm == _norm_key(str(normalized)):
                    conflict_state = "duplicate"
                else:
                    conflict_state = "conflict"
    result.conflict_state = conflict_state

    # --- 3. Canonical taxonomy resolution for literary-context lists ---
    if (
        spec.domain == DOMAIN_LITERARY_CONTEXT
        and spec.name in TAXONOMY_FIELDS
        and normalized
        and taxonomy_names
    ):
        taxonomy_match = match_taxonomy(str(normalized), taxonomy_names)

    # --- 4. Classify ---
    hard = any(issue in _HARD_BLOCKERS for issue in issues)
    if hard:
        result.validation_state = "invalid"
    elif conflict_state == "conflict":
        result.validation_state = "conflict"
    elif issues:
        result.validation_state = "needs_review"
    else:
        result.validation_state = "validated"

    result.review_band, result.review_reason = _classify_field_review(
        validation_state=result.validation_state,
        conflict_state=conflict_state,
        source_count=source_count,
        grounded_source_count=grounded_source_count,
        taxonomy_match=taxonomy_match,
        taxonomy_applies=spec.domain == DOMAIN_LITERARY_CONTEXT and spec.name in TAXONOMY_FIELDS,
    )

    return FieldValidation(
        validation=result,
        value=normalized,
        taxonomy_match=taxonomy_match,
    )


def _classify_field_review(
    *,
    validation_state: str,
    conflict_state: str,
    source_count: int,
    grounded_source_count: int | None,
    taxonomy_match: str | None,
    taxonomy_applies: bool,
) -> tuple[str, str]:
    """Deterministic band/reason priority for a field claim.

    Mirrors the timeline classifier: hard invalidity first, then duplicates,
    then evidence gaps (unsupported -> ungrounded), then policy flags.
    """
    if validation_state == "invalid":
        return REVIEW_BAND_AUTO_REJECTED, REVIEW_REASON_INVALID_CLAIM
    if conflict_state == "duplicate":
        return REVIEW_BAND_AUTO_REJECTED, REVIEW_REASON_EXACT_DUPLICATE
    if conflict_state == "conflict":
        return REVIEW_BAND_QUALITY, REVIEW_REASON_FIELD_CONFLICT
    if source_count <= 0:
        return REVIEW_BAND_QUALITY, REVIEW_REASON_UNSUPPORTED
    if grounded_source_count is not None and grounded_source_count == 0:
        return REVIEW_BAND_QUALITY, REVIEW_REASON_UNGROUNDED
    if taxonomy_applies and taxonomy_match is None:
        return REVIEW_BAND_QUALITY, REVIEW_REASON_UNRESOLVED_TAXONOMY
    return REVIEW_BAND_AUTO_APPROVED, REVIEW_REASON_NEW_GROUNDED