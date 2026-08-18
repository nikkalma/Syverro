"""Canonical editorial review queue for SyvAI proposals.

The queue shows only proposals that *need* a human decision — bands in
REVIEW_BANDS_NEEDING_HUMAN (quality_review, policy_review) with status
proposed/under_review. auto_approved and auto_rejected bands never appear in
the queue; they are visible via /history.

Approving a proposal writes status="accepted" (the canonical reviewed-and-
approved proposal state consumed by the existing Apply flow). Rejecting writes
status="rejected". The proposal status vocabulary is not redesigned here.
"""

import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.ai_proposal import AIProposal
from app.models.ai_proposal_source import AIProposalSource
from app.models.author import Author
from app.models.book import Book
from app.models.source import Source
from app.models.syvai_run import SyvaiRun
from app.models.user import User
from app.services.security_audit import add_security_event
from app.syvai.validators import (
    REVIEW_BANDS_NEEDING_HUMAN,
    REVIEW_BAND_POLICY,
    REVIEW_BAND_QUALITY,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/moderation", tags=["admin-moderation"])

QUEUE_STATES = ("proposed", "under_review")
REVIEW_ACTIONS = ("approve", "reject")


async def check_admin(user: User) -> User:
    if user.role not in ["owner", "admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _proposal_dict(proposal: AIProposal, entity_name: str | None = None) -> dict:
    return {
        "id": str(proposal.id),
        "entity_type": proposal.entity_type,
        "entity_id": proposal.entity_id,
        "entity_name": entity_name,
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
        "run_domain": getattr(proposal, "run_domain", None),
        "applied_at": proposal.applied_at.isoformat() if proposal.applied_at else None,
        "timeline_event_id": str(proposal.timeline_event_id) if proposal.timeline_event_id else None,
        "created_at": proposal.created_at.isoformat() if proposal.created_at else None,
        "reviewed_at": proposal.reviewed_at.isoformat() if proposal.reviewed_at else None,
        "reviewed_by": str(proposal.reviewed_by) if proposal.reviewed_by else None,
        "source_count": getattr(proposal, "source_count", None),
    }


async def _resolve_entity_names(db: AsyncSession, proposals: list[AIProposal]) -> dict[str, str]:
    pairs = {}
    for p in proposals:
        if p.entity_id and p.entity_type:
            pairs.setdefault(p.entity_type, set()).add(p.entity_id)

    names: dict[str, str] = {}
    author_ids = pairs.get("author", set())
    if author_ids:
        result = await db.execute(
            select(Author.id, Author.display_name, Author.name).where(Author.id.in_(author_ids))
        )
        for author_id, display_name, name in result.all():
            names[str(author_id)] = display_name or name

    book_ids = pairs.get("book", set())
    if book_ids:
        result = await db.execute(select(Book.id, Book.title).where(Book.id.in_(book_ids)))
        names.update({str(book_id): title for book_id, title in result.all()})

    return names


async def _attach_run_domains(db: AsyncSession, proposals: list[AIProposal]) -> dict[str, str]:
    run_ids = {p.run_id for p in proposals if p.run_id}
    domains: dict[str, str] = {}
    if run_ids:
        result = await db.execute(
            select(SyvaiRun.id, SyvaiRun.domain).where(SyvaiRun.id.in_(run_ids))
        )
        domains = {str(run_id): domain for run_id, domain in result.all()}
    return domains


async def _attach_source_counts(db: AsyncSession, proposals: list[AIProposal]) -> dict[str, int]:
    proposal_ids = [p.id for p in proposals]
    counts: dict[str, int] = {}
    if proposal_ids:
        result = await db.execute(
            select(AIProposalSource.proposal_id, func.count(AIProposalSource.id))
            .where(AIProposalSource.proposal_id.in_(proposal_ids))
            .group_by(AIProposalSource.proposal_id)
        )
        counts = {str(proposal_id): count for proposal_id, count in result.all()}
    return counts


def _enrich(
    proposals: list[AIProposal],
    *,
    domains: dict[str, str],
    counts: dict[str, int],
    names: dict[str, str],
) -> list[dict]:
    for p in proposals:
        p.run_domain = domains.get(str(p.run_id)) if p.run_id else None
        p.source_count = counts.get(str(p.id), 0)
    return [
        _proposal_dict(p, entity_name=names.get(p.entity_id) if p.entity_id else None)
        for p in proposals
    ]


def _queue_filter(query):
    return query.where(
        AIProposal.review_band.in_(REVIEW_BANDS_NEEDING_HUMAN),
        AIProposal.status.in_(QUEUE_STATES),
    )


async def moderation_counts(db: AsyncSession) -> dict:
    """Single source of truth for active-queue counts (dashboard + queue API)."""
    result = await db.execute(
        _queue_filter(
            select(
                AIProposal.review_band,
                AIProposal.review_reason,
                AIProposal.entity_type,
                AIProposal.status,
            )
        )
    )
    rows = result.all()

    by_band = {REVIEW_BAND_QUALITY: 0, REVIEW_BAND_POLICY: 0}
    by_reason: dict[str, int] = {}
    by_entity_type: dict[str, int] = {}
    under_review = 0
    for band, reason, entity_type, status in rows:
        if band in by_band:
            by_band[band] += 1
        if reason:
            by_reason[reason] = by_reason.get(reason, 0) + 1
        if entity_type:
            by_entity_type[entity_type] = by_entity_type.get(entity_type, 0) + 1
        if status == "under_review":
            under_review += 1

    return {
        "total": len(rows),
        "under_review": under_review,
        "by_band": by_band,
        "by_reason": by_reason,
        "by_entity_type": by_entity_type,
    }


def _base_query():
    return select(AIProposal)


async def _queueable_proposal_or_http(
    db: AsyncSession,
    proposal_id: str,
    current_user: User,
) -> AIProposal:
    try:
        parsed = UUID(str(proposal_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid proposal id")
    result = await db.execute(select(AIProposal).where(AIProposal.id == parsed))
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if proposal.review_band not in REVIEW_BANDS_NEEDING_HUMAN or proposal.status not in QUEUE_STATES:
        raise HTTPException(
            status_code=409,
            detail=f"Proposal is not pending review (band={proposal.review_band}, status={proposal.status})",
        )
    return proposal


# ============================================================
# QUEUE
# ============================================================


@router.get("/review-queue", response_model=dict)
async def list_review_queue(
    page: int = 1,
    limit: int = 20,
    band: str | None = None,
    status: str | None = None,
    entity_type: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)

    query = _queue_filter(_base_query())
    count_query = _queue_filter(select(func.count()).select_from(AIProposal))

    if band:
        valid_bands = set(REVIEW_BANDS_NEEDING_HUMAN)
        if band not in valid_bands:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown band '{band}'; expected one of {', '.join(sorted(valid_bands))}",
            )
        query = query.where(AIProposal.review_band == band)
        count_query = count_query.where(AIProposal.review_band == band)
    if status:
        if status not in QUEUE_STATES:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown queue status '{status}'; expected one of {', '.join(QUEUE_STATES)}",
            )
        query = query.where(AIProposal.status == status)
        count_query = count_query.where(AIProposal.status == status)
    if entity_type:
        query = query.where(AIProposal.entity_type == entity_type)
        count_query = count_query.where(AIProposal.entity_type == entity_type)

    total = await db.scalar(count_query) or 0
    query = query.order_by(AIProposal.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    proposals = result.scalars().all()

    domains = await _attach_run_domains(db, proposals)
    counts = await _attach_source_counts(db, proposals)
    names = await _resolve_entity_names(db, proposals)

    return {
        "data": _enrich(proposals, domains=domains, counts=counts, names=names),
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total else 0,
    }


@router.get("/review-queue/counts", response_model=dict)
async def review_queue_counts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)
    return await moderation_counts(db)


@router.get("/review-queue/{proposal_id}", response_model=dict)
async def get_review_queue_detail(
    proposal_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)

    try:
        parsed = UUID(str(proposal_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid proposal id")
    result = await db.execute(select(AIProposal).where(AIProposal.id == parsed))
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    domains = await _attach_run_domains(db, [proposal])
    counts = await _attach_source_counts(db, [proposal])
    names = await _resolve_entity_names(db, [proposal])

    sources_result = await db.execute(
        select(AIProposalSource, Source)
        .join(Source, Source.id == AIProposalSource.source_id)
        .where(AIProposalSource.proposal_id == proposal.id)
    )
    sources = [
        {
            "id": str(source.id),
            "title": source.title,
            "url": source.url,
            "source_type": source.source_type,
            "reliability_score": source.reliability_score,
            "reliability_tier": link.reliability_tier,
            "snippet": link.snippet,
        }
        for link, source in sources_result.all()
    ]

    item = _enrich([proposal], domains=domains, counts=counts, names=names)[0]
    item["sources"] = sources
    return item


# ============================================================
# ACTIONS
# ============================================================


class ReviewActionRequest(BaseModel):
    action: str = Field(description="approve | reject")
    edited_value: str | None = Field(default=None, description="Overrides suggested_value on approve")
    note: str | None = None


class BulkReviewItem(BaseModel):
    proposal_id: str
    action: str
    edited_value: str | None = None


class BulkReviewRequest(BaseModel):
    operations: list[BulkReviewItem]


async def _apply_review_action(
    db: AsyncSession,
    proposal: AIProposal,
    action: str,
    current_user: User,
    *,
    request: Request | None = None,
    endpoint: str,
    edited_value: str | None = None,
) -> dict:
    if action == "approve":
        if edited_value is not None:
            proposal.edited_value = edited_value
        proposal.status = "accepted"
        event_type = "ai_proposal_review_approve"
    elif action == "reject":
        proposal.status = "rejected"
        event_type = "ai_proposal_review_reject"
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown action '{action}'; expected one of {', '.join(REVIEW_ACTIONS)}",
        )
    proposal.reviewed_at = _utcnow()
    proposal.reviewed_by = current_user.id

    add_security_event(
        db,
        event_type=event_type,
        endpoint=endpoint,
        method="POST",
        status_code=200,
        actor_id=current_user.id,
        target_id=proposal.id,
        request=request,
        details={"field_name": proposal.field_name, "entity_type": proposal.entity_type},
    )
    await db.commit()
    return {"id": str(proposal.id), "ok": True, "action": action, "status": proposal.status}


@router.post("/review-queue/{proposal_id}/action", response_model=dict)
async def review_proposal_action(
    proposal_id: str,
    body: ReviewActionRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)
    proposal = await _queueable_proposal_or_http(db, proposal_id, current_user)
    return await _apply_review_action(
        db,
        proposal,
        body.action,
        current_user,
        request=request,
        endpoint=f"/admin/moderation/review-queue/{proposal_id}/action",
        edited_value=body.edited_value,
    )


@router.post("/review-queue/bulk-action", response_model=dict)
async def review_proposal_bulk_action(
    body: BulkReviewRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)

    results = []
    for op in body.operations:
        try:
            proposal = await _queueable_proposal_or_http(db, op.proposal_id, current_user)
            result = await _apply_review_action(
                db,
                proposal,
                op.action,
                current_user,
                request=request,
                endpoint="/admin/moderation/review-queue/bulk-action",
                edited_value=op.edited_value,
            )
            results.append(result)
        except HTTPException as exc:
            await db.rollback()
            results.append({"id": op.proposal_id, "ok": False, "action": op.action, "error": exc.detail})
        except Exception as exc:  # noqa: BLE001
            logger.warning("bulk review operation failed for %s: %s", op.proposal_id, exc)
            await db.rollback()
            results.append({"id": op.proposal_id, "ok": False, "action": op.action, "error": "failed to process proposal"})

    return {
        "results": results,
        "succeeded": sum(1 for r in results if r.get("ok")),
        "failed": sum(1 for r in results if not r.get("ok")),
    }


# ============================================================
# HISTORY
# ============================================================


def _history_filter(query):
    return query.where(
        or_(
            AIProposal.status.in_(("accepted", "rejected", "applied")),
            AIProposal.review_band.in_(("auto_approved", "auto_rejected")),
        )
    )


@router.get("/history", response_model=dict)
async def list_review_history(
    page: int = 1,
    limit: int = 20,
    band: str | None = None,
    status: str | None = None,
    entity_type: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)

    query = _history_filter(_base_query())
    count_query = _history_filter(select(func.count()).select_from(AIProposal))

    if band:
        query = query.where(AIProposal.review_band == band)
        count_query = count_query.where(AIProposal.review_band == band)
    if status:
        query = query.where(AIProposal.status == status)
        count_query = count_query.where(AIProposal.status == status)
    if entity_type:
        query = query.where(AIProposal.entity_type == entity_type)
        count_query = count_query.where(AIProposal.entity_type == entity_type)

    total = await db.scalar(count_query) or 0
    query = query.order_by(AIProposal.reviewed_at.desc().nullslast(), AIProposal.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    proposals = result.scalars().all()

    domains = await _attach_run_domains(db, proposals)
    counts = await _attach_source_counts(db, proposals)
    names = await _resolve_entity_names(db, proposals)

    return {
        "data": _enrich(proposals, domains=domains, counts=counts, names=names),
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total else 0,
    }