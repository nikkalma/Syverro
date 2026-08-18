"""Structured field claim schema for the 0.4B Author core fill consumers.

One generic claim shape for IDENTITY, BIOGRAPHY and LITERARY_CONTEXT:

    field_name  -> the exact target Author field/entity (e.g. "native_name",
                   "occupations", "bio", "citizenship")
    value       -> string for scalar/list/text fields; an object for entity
                   fields (active_years / citizenship / residence)
    label       -> short human-readable label for the proposed value
    sources     -> reusable timeline SourceRef (title/url/evidence)

Any malformed or non-conforming output is rejected before validation.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Literal

from pydantic import BaseModel, Field, ValidationError

from app.syvai.errors import StructuredOutputError
from app.syvai.timeline_claims import SourceRef

logger = logging.getLogger(__name__)


class FieldClaim(BaseModel):
    field_name: str = Field(min_length=1)
    value: str | dict[str, Any] | list[Any] | None = None
    label: str | None = None
    description: str | None = None
    sources: list[SourceRef] = Field(default_factory=list)
    extraction_source: Literal["ai"] = "ai"


class FieldClaimSet(BaseModel):
    """Provider output wrapper (a JSON object with a "fields" array)."""

    fields: list[FieldClaim] = Field(default_factory=list)


def parse_field_claims(raw: str) -> list[FieldClaim]:
    """Parse provider output into a validated list of field claims.

    Raises StructuredOutputError for any non-conforming output.
    """
    cleaned = _strip_fence(raw)
    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise StructuredOutputError(f"provider output is not valid JSON: {exc}") from exc

    if isinstance(payload, list):
        payload = {"fields": payload}

    if not isinstance(payload, dict) or "fields" not in payload:
        raise StructuredOutputError(
            "provider output must be a JSON object with a 'fields' array"
        )

    try:
        claim_set = FieldClaimSet.model_validate(payload)
    except ValidationError as exc:
        detail = exc.errors()
        summary = "; ".join(
            f"{'.'.join(str(p) for p in e.get('loc', []))}: {e.get('msg', 'invalid')}"
            for e in detail[:5]
        )
        raise StructuredOutputError(f"provider output failed schema validation: {summary}") from exc

    return claim_set.fields


def _strip_fence(raw: str) -> str:
    """Strip markdown code fences if the model wrapped its JSON in them."""
    text = raw.strip()
    if text.startswith("```"):
        first_newline = text.find("\n")
        if first_newline != -1:
            text = text[first_newline + 1 :]
        if text.endswith("```"):
            text = text[:-3]
    return text.strip()