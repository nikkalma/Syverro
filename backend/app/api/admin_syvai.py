"""SyvAI admin endpoints for the 0.1A timeline vertical slice.

- POST /admin/authors/{author_id}/ai/timeline  — run one grounded research run
- GET  /admin/authors/{author_id}/ai/runs       — list runs (telemetry/review)
- POST /admin/authors/{author_id}/proposals/{proposal_id}/apply
                                               — explicit, audited apply of an
                                                 accepted timeline proposal

Public visibility is never touched here: applying a proposal only creates or
updates a TimelineEvent inside the existing Sapphire editorial lifecycle.
"""

import json
import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.ai_proposal import AIProposal
from app.models.ai_proposal_source import AIProposalSource
from app.models.author import Author
from app.models.source import Source
from app.models.syvai_run import SyvaiRun
from app.models.timeline_event import TimelineEvent
from app.models.user import User
from app.services.security_audit import add_security_event
from app.syvai.errors import ConfigurationError
from app.syvai.pipeline import run_timeline_research
from app.syvai.provider import OpenAICompatibleProvider, ProviderConfig
from app.syvai.validators import date_granularity, normalize_date_value, parse_date

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/authors", tags=["admin-syvai"])


async def check_admin(user: User) -> User:
    if user.role not in ["owner", "admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def get_author_or_404(db: AsyncSession, author_id: str) -> Author:
    result = await db.execute(select(Author).where(Author.id == author_id))
    author = result.scalar_one_or_none()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    return author


async def get_proposal_or_404(db: AsyncSession, author_id: str, proposal_id: str) -> AIProposal:
    result = await db.execute(
        select(AIProposal).where(
            AIProposal.id == proposal_id,
            AIProposal.entity_id == author_id,
        )
    )
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal


def _proposal_dict(proposal: AIProposal, sources: list) -> dict:
    return {
        "id": str(proposal.id),
        "entity_type": proposal.entity_type,
        "entity_id": proposal.entity_id,
        "field_name": proposal.field_name,
        "current_value": proposal.current_value,
        "suggested_value": proposal.suggested_value,
        "edited_value": proposal.edited_value,
        "source_type": proposal.source_type,
        "confidence": proposal.confidence,
        "status": proposal.status,
        "validation_state": proposal.validation_state,
        "conflict_state": proposal.conflict_state,
        "review_band": proposal.review_band,
        "review_reason": proposal.review_reason,
        "run_id": str(proposal.run_id) if proposal.run_id else None,
        "applied_at": proposal.applied_at.isoformat() if proposal.applied_at else None,
        "timeline_event_id": str(proposal.timeline_event_id) if proposal.timeline_event_id else None,
        "created_at": proposal.created_at.isoformat() if proposal.created_at else None,
        "reviewed_at": proposal.reviewed_at.isoformat() if proposal.reviewed_at else None,
        "reviewed_by": str(proposal.reviewed_by) if proposal.reviewed_by else None,
        "sources": sources,
    }


async def _proposal_sources(db: AsyncSession, proposal_id: UUID) -> list[dict]:
    result = await db.execute(
        select(AIProposalSource, Source)
        .join(Source, Source.id == AIProposalSource.source_id)
        .where(AIProposalSource.proposal_id == proposal_id)
    )
    return [
        {
            "id": str(source.id),
            "title": source.title,
            "url": source.url,
            "source_type": source.source_type,
            "reliability_score": source.reliability_score,
            "reliability_tier": link.reliability_tier,
            "snippet": link.snippet,
        }
        for link, source in result.all()
    ]


# ============================================================
# RUN RESEARCH
# ============================================================


@router.post("/{author_id}/ai/timeline")
async def run_author_timeline_research(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)

    try:
        provider = OpenAICompatibleProvider(ProviderConfig.from_env())
    except ConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    outcome = await run_timeline_research(db, author, provider)
    if outcome.error:
        raise HTTPException(status_code=502, detail=outcome.error)

    proposals = [
        _proposal_dict(proposal, await _proposal_sources(db, proposal.id))
        for proposal in outcome.proposals
    ]
    return {
        "run": _run_dict(outcome.run),
        "proposals": proposals,
        "message": "Timeline research completed",
    }


def _run_dict(run: SyvaiRun) -> dict:
    return {
        "id": str(run.id),
        "author_id": str(run.author_id),
        "domain": run.domain,
        "status": run.status,
        "provider": run.provider,
        "model": run.model,
        "input_tokens": run.input_tokens,
        "output_tokens": run.output_tokens,
        "total_tokens": run.total_tokens,
        "duration_ms": run.duration_ms,
        "estimated_cost_usd": run.estimated_cost_usd,
        "calls": run.calls,
        "source_count": run.source_count,
        "error": run.error,
        "created_at": run.created_at.isoformat() if run.created_at else None,
        "finished_at": run.finished_at.isoformat() if run.finished_at else None,
    }


# ============================================================
# LIST RUNS
# ============================================================


@router.get("/{author_id}/ai/runs")
async def list_author_syvai_runs(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)
    await get_author_or_404(db, author_id)

    result = await db.execute(
        select(SyvaiRun)
        .where(SyvaiRun.author_id == author_id)
        .order_by(SyvaiRun.created_at.desc())
    )
    runs = result.scalars().all()

    counts_result = await db.execute(
        select(AIProposal.run_id, func.count(AIProposal.id))
        .where(AIProposal.run_id.in_([run.id for run in runs] or [UUID("00000000-0000-0000-0000-000000000000")]))
        .group_by(AIProposal.run_id)
    )
    counts = {str(run_id): count for run_id, count in counts_result.all()}

    return {
        "data": [
            {
                **_run_dict(run),
                "proposal_count": counts.get(str(run.id), 0),
            }
            for run in runs
        ]
    }


# ============================================================
# APPLY ACCEPTED PROPOSAL
# ============================================================


@router.post("/{author_id}/proposals/{proposal_id}/apply")
async def apply_author_proposal(
    author_id: str,
    proposal_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)
    await get_author_or_404(db, author_id)
    proposal = await get_proposal_or_404(db, author_id, proposal_id)

    if proposal.field_name != "timeline_event":
        raise HTTPException(
            status_code=400,
            detail="Apply is only supported for timeline_event proposals",
        )
    if proposal.status != "accepted":
        raise HTTPException(
            status_code=400,
            detail="Only accepted proposals can be applied",
        )

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

    payload_text = proposal.edited_value or proposal.suggested_value
    try:
        payload = json.loads(payload_text)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail="Proposal payload is not valid JSON; edit it before applying",
        ) from exc

    event_type = str(payload.get("event_type") or "").strip()
    date_value = str(payload.get("date_value") or "").strip()
    label = str(payload.get("label") or "").strip()
    description = payload.get("description")
    date_precision = str(payload.get("date_precision") or "").strip()

    if not event_type or not label or not date_value:
        raise HTTPException(
            status_code=400,
            detail="Proposal is missing required fields; edit it before applying",
        )
    if parse_date(date_value) is None:
        raise HTTPException(
            status_code=400,
            detail="Proposal date is invalid; edit it before applying",
        )
    if date_precision not in {"full", "month", "year", "approximate"}:
        date_precision = date_granularity(date_value)

    normalized_date = normalize_date_value(date_value)

    source_ids = [link.source_id for link in proposal.sources or []]
    primary_source_id = None
    if source_ids:
        sources_result = await db.execute(select(Source).where(Source.id.in_(source_ids)))
        sources = sources_result.scalars().all()
        if sources:
            tier_order = {"high": 0, "medium": 1, "low": 2, "unknown": 3}
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
    proposal.applied_at = datetime.now(timezone.utc)

    add_security_event(
        db,
        event_type="ai_proposal_apply",
        endpoint=f"/admin/authors/{author_id}/proposals/{proposal_id}/apply",
        method="POST",
        status_code=200,
        actor_id=current_user.id,
        target_id=proposal.id,
        request=request,
        details={"timeline_event_id": str(event.id), "field_name": proposal.field_name},
    )
    await db.commit()

    return {
        "applied": True,
        "already_applied": False,
        "timeline_event_id": str(event.id),
    }
