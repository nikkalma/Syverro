"""Structured timeline claim schema.

Every claim returned by the provider must conform to this schema; any
unstructured or malformed output is rejected before it can reach validation.
"""

from __future__ import annotations

import json
import logging
from typing import Literal

from pydantic import BaseModel, Field, ValidationError, field_validator

from app.syvai.errors import StructuredOutputError

logger = logging.getLogger(__name__)

EventType = Literal[
    "publication",
    "award",
    "milestone",
    "birth",
    "death",
    "education",
    "correspondence",
    "career",
    "personal",
]

DatePrecision = Literal["full", "month", "year", "approximate"]

EVENT_TYPE_VALUES = set(EventType.__args__)  # type: ignore[attr-defined]
DATE_PRECISION_VALUES = set(DatePrecision.__args__)  # type: ignore[attr-defined]


class SourceRef(BaseModel):
    """A source reference cited by the model for a single claim.

    ``evidence`` is the SyvAI 0.2C claim-level evidence fragment: a short,
    near-verbatim extract from the source's stored citation text that supports
    the claim. It is verified deterministically by ``app.syvai.evidence``
    before a proposal can be auto-approved; it is never trusted on faith.
    """

    title: str = Field(min_length=1)
    source_type: str | None = None
    url: str | None = None
    language: str | None = None
    evidence: str | None = None


class TimelineClaim(BaseModel):
    event_type: str
    date_value: str = Field(min_length=1)
    date_precision: str = "full"
    label: str = Field(min_length=1)
    description: str | None = None
    place: str | None = None
    sources: list[SourceRef] = Field(default_factory=list)
    extraction_source: Literal["ai"] = "ai"

    @field_validator("event_type")
    @classmethod
    def _event_type_allowed(cls, value: str) -> str:
        if value not in EVENT_TYPE_VALUES:
            raise ValueError(f"unsupported event_type '{value}'")
        return value

    @field_validator("date_precision")
    @classmethod
    def _precision_allowed(cls, value: str) -> str:
        # Historical data in the repo uses "month" while some frontend types
        # use "month_year"; normalize the latter once here.
        if value == "month_year":
            return "month"
        if value not in DATE_PRECISION_VALUES:
            raise ValueError(f"unsupported date_precision '{value}'")
        return value


class TimelineClaimSet(BaseModel):
    """Wrapper expected by the provider prompt (a JSON object).

    The prompt asks the model to return ``{"events": [...]}`` so that the
    contract is a JSON object rather than a bare array (required by the
    OpenAI ``json_object`` response format).
    """

    events: list[TimelineClaim] = Field(default_factory=list)


def parse_timeline_claims(raw: str) -> list[TimelineClaim]:
    """Parse provider output into a validated list of timeline claims.

    Raises StructuredOutputError for any non-conforming output.
    """
    cleaned = _strip_fence(raw)
    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise StructuredOutputError(f"provider output is not valid JSON: {exc}") from exc

    if isinstance(payload, list):
        payload = {"events": payload}

    if not isinstance(payload, dict) or "events" not in payload:
        raise StructuredOutputError(
            "provider output must be a JSON object with an 'events' array"
        )

    try:
        claim_set = TimelineClaimSet.model_validate(payload)
    except ValidationError as exc:
        detail = exc.errors()
        # Keep errors compact and safe for logging.
        summary = "; ".join(
            f"{'.'.join(str(p) for p in e.get('loc', []))}: {e.get('msg', 'invalid')}"
            for e in detail[:5]
        )
        raise StructuredOutputError(f"provider output failed schema validation: {summary}") from exc

    return claim_set.events


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
