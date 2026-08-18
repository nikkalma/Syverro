"""SyvAI 0.6B — safe canonical Apply boundary for supported Author proposals.

One generic, audited Apply for the 0.4B fill domains (IDENTITY, BIOGRAPHY,
LITERARY_CONTEXT) plus the existing TIMELINE event Apply. This is the only
place that moves an approved proposal into canonical Author data.

Contract
--------
* only ``accepted`` (human-reviewed) or ``auto_approved`` (policy-authorized)
  proposals may apply — anything rejected, auto_rejected, still pending human
  review, invalid or unsupported is refused;
* canonical data is never silently overwritten: an auto-approved scalar/entity
  proposal is blocked when the field already holds a populated, different value
  (resolve it by editing + human approval first); the ``unknown`` placeholder
  for ``gender`` is treated as empty;
* same-value writes are idempotent no-ops;
* list fields merge deterministically without duplicates (existing items are
  never removed);
* relational entities use existing canonical resolution (places are matched or
  created by normalized name; citizenship/residence rows are appended, never
  clobbered);
* taxonomy list fields require a resolved canonical match (from the proposal
  payload, or by deterministic match against the canonical genre table) — a
  non-canonical taxonomy label is never written (no new taxonomy nodes are
  auto-created);
* provenance/audit is preserved via ``add_security_event`` and the proposal
  ``applied_at`` stamp; applying twice is idempotent;
* the caller commits; partial batch failures surface per-proposal (bulk apply).

No BIBLIOGRAPHY / AWARDS targets exist here.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.author import Author
from app.models.author_citizenship import AuthorCitizenship
from app.models.author_residence import AuthorResidence
from app.models.genre import Genre
from app.models.place import Place
from app.models.source import Source
from app.models.timeline_event import TimelineEvent
from app.services.security_audit import add_security_event
from app.syvai.field_specs import (
    TAXONOMY_FIELDS,
    VALUE_TYPE_ENTITY,
    VALUE_TYPE_LIST,
    spec_for_field,
)
from app.syvai.field_validators import match_taxonomy
from app.syvai.validators import (
    align_date_precision,
    normalize_date_value,
    parse_date,
)

logger = logging.getLogger(__name__)

REVIEW_BAND_AUTO_APPROVED = "auto_approved"
STATUS_ACCEPTED = "accepted"

# taxonomy list fields are only written when the label resolves to a canonical
# genre node (see TAXONOMY_FIELDS in field_specs).
_TAXONOMY_LIST_FIELDS = set(TAXONOMY_FIELDS)

# Author columns that are appended (never clobbered) on apply.
_LIST_FIELDS = {
    "pen_names", "pseudonyms", "languages", "occupations",
    "literary_movements", "genres", "themes", "motifs", "concepts",
    "atmospheres", "writing_languages",
}
_ENTITY_FIELDS = {"active_years", "citizenship", "residence"}
_SCALAR_FIELDS = {"native_name", "birth_name", "nationality", "gender", "bio"}


class ApplyError(Exception):
    """Refused Apply. The message is safe to render in admin responses."""


def _norm(value: str) -> str:
    return value.strip().casefold()


def _payload(proposal) -> dict:
    raw = proposal.edited_value or proposal.suggested_value
    try:
        payload = json.loads(raw or "{}")
    except json.JSONDecodeError as exc:
        raise ApplyError("Proposal payload is not valid JSON; edit it before applying") from exc
    if not isinstance(payload, dict):
        raise ApplyError("Proposal payload is not a JSON object")
    return payload


def _require_applyable(proposal) -> None:
    """Hard eligibility gate: accepted or policy-authorized auto_approved only."""
    if proposal.review_band == "auto_rejected" or proposal.status == "rejected":
        raise ApplyError("Rejected proposals cannot be applied")
    if proposal.validation_state == "invalid":
        raise ApplyError("Invalid proposals cannot be applied")
    if proposal.status == STATUS_ACCEPTED:
        return
    if proposal.review_band == REVIEW_BAND_AUTO_APPROVED:
        return
    raise ApplyError(
        "Only accepted or auto-approved proposals can be applied "
        f"(band={proposal.review_band}, status={proposal.status})"
    )


async def _canonical_taxonomy_label(db: AsyncSession, value: str, payload: dict) -> str | None:
    """Resolve the canonical genre slug for a taxonomy list value.

    Prefers the proposal's recorded resolved match; falls back to a
    deterministic match against the canonical genre table (covers a human-edited
    value). Never creates taxonomy nodes.
    """
    taxonomy = payload.get("taxonomy_match")
    if isinstance(taxonomy, dict) and taxonomy.get("resolved") and taxonomy.get("slug"):
        return str(taxonomy["slug"])
    result = await db.execute(select(Genre.name))
    names = {name for (name,) in result.all()}
    return match_taxonomy(str(value or "").strip(), names)


async def _taxonomy_guard(db: AsyncSession, field_name: str, value: str, payload: dict) -> None:
    if field_name not in _TAXONOMY_LIST_FIELDS:
        return
    if await _canonical_taxonomy_label(db, value, payload) is not None:
        return
    raise ApplyError(
        f"Taxonomy label {value!r} does not resolve to a canonical genre; "
        "edit the value to a canonical label and approve it before applying"
    )


def _is_populated_scalar(author: Author, field: str) -> bool:
    current = getattr(author, field, None)
    if current in (None, ""):
        return False
    if field == "gender" and isinstance(current, str) and current.strip().casefold() == "unknown":
        # server placeholder, not canonical data
        return False
    return True


async def _apply_scalar(author: Author, field: str, value: str, proposal) -> None:
    current = getattr(author, field, None)
    if proposal.review_band == REVIEW_BAND_AUTO_APPROVED and _is_populated_scalar(author, field):
        if isinstance(current, str) and _norm(current) != _norm(str(value)):
            raise ApplyError(
                f"Would silently overwrite populated field '{field}' "
                f"(existing={current!r}); edit and explicitly approve before applying"
            )
    setattr(author, field, str(value))


def _apply_list(author: Author, field: str, value: str) -> None:
    current = list(getattr(author, field, None) or [])
    keys = {_norm(str(item)) for item in current}
    cleaned = str(value).strip()
    if not cleaned:
        raise ApplyError(f"List proposal for '{field}' has an empty value")
    if _norm(cleaned) in keys:
        return  # idempotent no-op; deterministic dedupe
    current.append(cleaned)
    setattr(author, field, current)


async def _apply_active_years(author: Author, value: dict, proposal) -> None:
    from_year = value.get("from_year")
    to_year = value.get("to_year")
    if proposal.review_band == REVIEW_BAND_AUTO_APPROVED:
        existing = {
            "from_year": getattr(author, "active_from_year", None),
            "to_year": getattr(author, "active_to_year", None),
        }
        populated = any(existing.get(k) is not None for k in ("from_year", "to_year"))
        if populated and existing != {"from_year": from_year, "to_year": to_year}:
            raise ApplyError(
                "Would silently overwrite populated active_years "
                f"(existing={existing!r}); edit and explicitly approve before applying"
            )
        if populated:
            return  # same values already present
        if from_year is None and to_year is None:
            raise ApplyError("active_years proposal has no value")
    author.active_from_year = from_year
    author.active_to_year = to_year


async def _canonical_citizenship_exists(db: AsyncSession, author: Author, state_name: str) -> bool:
    result = await db.execute(
        select(AuthorCitizenship.id).where(
            AuthorCitizenship.author_id == author.id,
            func.lower(AuthorCitizenship.state_name) == _norm(state_name),
        )
    )
    return result.scalar_one_or_none() is not None


async def _apply_citizenship(db: AsyncSession, author: Author, value: dict) -> None:
    state_name = str(value.get("state_name") or "").strip()
    if not state_name:
        raise ApplyError("citizenship proposal is missing state_name")
    if await _canonical_citizenship_exists(db, author, state_name):
        return  # idempotent no-op; canonical resolution by state name
    db.add(
        AuthorCitizenship(
            author_id=author.id,
            state_name=state_name,
            from_date=_clean_date(value.get("from_date")),
            to_date=_clean_date(value.get("to_date")),
        )
    )


async def _canonical_place(db: AsyncSession, name: str) -> Place:
    result = await db.execute(
        select(Place).where(func.lower(Place.name) == _norm(name))
    )
    place = result.scalars().first()
    if place:
        return place
    place = Place(name=name)
    db.add(place)
    await db.flush()
    return place


async def _apply_residence(db: AsyncSession, author: Author, value: dict) -> None:
    place_name = str(value.get("place") or "").strip()
    if not place_name:
        raise ApplyError("residence proposal is missing place")
    place = await _canonical_place(db, place_name)
    result = await db.execute(
        select(AuthorResidence.id).where(
            AuthorResidence.author_id == author.id,
            AuthorResidence.place_id == place.id,
        )
    )
    if result.scalar_one_or_none():
        return  # idempotent no-op; canonical resolution by place node
    db.add(
        AuthorResidence(
            author_id=author.id,
            place_id=place.id,
            from_date=_clean_date(value.get("from_date")),
            to_date=_clean_date(value.get("to_date")),
        )
    )


def _clean_date(value) -> str | None:
    return str(value).strip() if value not in (None, "") else None


async def apply_author_field_proposal(
    db: AsyncSession,
    *,
    proposal,
    author: Author,
    actor_id,
    endpoint: str,
    request=None,
) -> dict:
    """Apply one accepted/auto-approved Author field proposal (non-timeline).

    Returns ``{applied, already_applied, field, detail}``. The caller commits.
    """
    if proposal.applied_at:
        return {
            "applied": True,
            "already_applied": True,
            "field": proposal.field_name,
            "detail": "already applied",
        }

    _require_applyable(proposal)
    spec = spec_for_field(proposal.field_name)
    if spec is None:
        raise ApplyError(
            f"Apply is not supported for field {proposal.field_name!r} "
            "(supported: IDENTITY, BIOGRAPHY, LITERARY_CONTEXT fields, timeline_event)"
        )
    if author is None:
        raise ApplyError("Author record is required to apply")

    payload = _payload(proposal)
    value = payload.get("value")
    if value in (None, "", [], {}):
        raise ApplyError(f"Proposal for field '{proposal.field_name}' has no value to apply")

    if spec.value_type == VALUE_TYPE_LIST:
        await _taxonomy_guard(db, proposal.field_name, str(value), payload)
        _apply_list(author, proposal.field_name, str(value))
        detail = f"merged into {proposal.field_name}"
    elif spec.value_type == VALUE_TYPE_ENTITY:
        if not isinstance(value, dict):
            raise ApplyError(f"Entity proposal for '{proposal.field_name}' must be an object")
        if proposal.field_name == "active_years":
            await _apply_active_years(author, value, proposal)
        elif proposal.field_name == "citizenship":
            await _apply_citizenship(db, author, value)
        elif proposal.field_name == "residence":
            await _apply_residence(db, author, value)
        else:
            raise ApplyError(f"Apply is not supported for entity field {proposal.field_name!r}")
        detail = f"written to {proposal.field_name}"
    elif spec.name in _SCALAR_FIELDS:
        await _apply_scalar(author, proposal.field_name, str(value), proposal)
        detail = f"written to {proposal.field_name}"
    else:
        raise ApplyError(f"Apply is not supported for field {proposal.field_name!r}")

    proposal.applied_at = datetime.now(timezone.utc).replace(tzinfo=None)

    add_security_event(
        db,
        event_type="ai_proposal_apply",
        endpoint=endpoint,
        method="POST",
        status_code=200,
        actor_id=actor_id,
        target_id=proposal.id,
        request=request,
        details={
            "field_name": proposal.field_name,
            "entity_type": proposal.entity_type,
            "entity_id": str(author.id),
        },
    )
    return {"applied": True, "already_applied": False, "field": proposal.field_name, "detail": detail}


async def apply_timeline_proposal(
    db: AsyncSession,
    *,
    proposal,
    author_id: str,
    actor_id,
    endpoint: str,
    request=None,
) -> dict:
    """Apply one accepted TIMELINE proposal into a verified TimelineEvent.

    This preserves the pre-existing 0.1A Apply contract (accepted only,
    idempotent, audited, primary-source selection, precision alignment) as the
    single timeline boundary. The caller commits.
    """
    if proposal.field_name != "timeline_event":
        raise ApplyError(
            "Apply is only supported for timeline_event proposals in this function"
        )
    if proposal.status != STATUS_ACCEPTED:
        raise ApplyError("Only accepted proposals can be applied")

    # Idempotency: an already-applied proposal returns the same event without
    # mutating anything.
    if proposal.applied_at and proposal.timeline_event_id:
        existing = await db.execute(
            select(TimelineEvent).where(
                TimelineEvent.id == proposal.timeline_event_id,
                TimelineEvent.author_id == author_id,
            )
        )
        event = existing.scalar_one_or_none()
        if event:
            return {
                "applied": True,
                "already_applied": True,
                "timeline_event_id": str(event.id),
            }
        return {
            "applied": True,
            "already_applied": True,
            "timeline_event_id": str(proposal.timeline_event_id),
        }

    payload = _payload(proposal)

    event_type = str(payload.get("event_type") or "").strip()
    date_value = str(payload.get("date_value") or "").strip()
    label = str(payload.get("label") or "").strip()
    description = payload.get("description")
    date_precision = str(payload.get("date_precision") or "").strip()

    if not event_type or not label or not date_value:
        raise ApplyError(
            "Proposal is missing required fields; edit it before applying"
        )
    if parse_date(date_value) is None:
        raise ApplyError(
            "Proposal date is invalid; edit it before applying"
        )
    # 0.4B Phase 8: derive an inconsistent/empty precision label
    # deterministically from the value granularity.
    date_precision = align_date_precision(date_value, date_precision)

    normalized_date = normalize_date_value(date_value)

    source_ids = [link.source_id for link in (proposal.sources or []) if getattr(link, "source_id", None)]
    primary_source_id = None
    if source_ids:
        sources_result = await db.execute(select(Source).where(Source.id.in_(source_ids)))
        sources = sources_result.scalars().all()
        if sources:
            tier_order = {"high": 0, "medium": 1, "low": 2, "unknown": 3}
            # retained selection order: the highest-reliability source wins
            sources.sort(
                key=lambda source: tier_order.get(
                    next(
                        (link.reliability_tier for link in proposal.sources if link.source_id == source.id),
                        "unknown",
                    ),
                    3,
                )
            )
            primary_source_id = sources[0].id

    matched_event = None
    if proposal.current_value:
        try:
            current_payload = json.loads(proposal.current_value)
        except json.JSONDecodeError:
            current_payload = None
        if current_payload and current_payload.get("id"):
            matched = await db.execute(
                select(TimelineEvent).where(
                    TimelineEvent.id == current_payload["id"],
                    TimelineEvent.author_id == author_id,
                )
            )
            matched_event = matched.scalar_one_or_none()

    if matched_event:
        matched_event.event_type = event_type
        matched_event.date_value = normalized_date
        matched_event.date_precision = date_precision
        matched_event.label = label
        matched_event.description = description
        matched_event.source_id = primary_source_id
        matched_event.extraction_source = "ai"
        matched_event.confidence = proposal.confidence
        matched_event.status = "verified"
        event = matched_event
    else:
        event = TimelineEvent(
            author_id=author_id,
            event_type=event_type,
            date_value=normalized_date,
            date_precision=date_precision,
            label=label,
            description=description,
            source_id=primary_source_id,
            extraction_source="ai",
            confidence=proposal.confidence,
            status="verified",
        )
        db.add(event)
    await db.flush()

    proposal.timeline_event_id = event.id
    proposal.applied_at = datetime.now(timezone.utc).replace(tzinfo=None)

    add_security_event(
        db,
        event_type="ai_proposal_apply",
        endpoint=endpoint,
        method="POST",
        status_code=200,
        actor_id=actor_id,
        target_id=proposal.id,
        request=request,
        details={"timeline_event_id": str(event.id), "field_name": proposal.field_name},
    )
    return {
        "applied": True,
        "already_applied": False,
        "timeline_event_id": str(event.id),
    }