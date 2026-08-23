"""SyvAI 0.2A admin endpoints for bounded source discovery.

- GET    /admin/authors/{author_id}/discovery/status        — provider status
- GET    /admin/authors/{author_id}/discovery/runs          — discovery run telemetry
- POST   /admin/authors/{author_id}/discovery/run           — trigger one bounded run
- GET    /admin/authors/{author_id}/discovery/candidates    — review surface
- POST   /admin/authors/{author_id}/discovery/candidates/{candidate_id}/approve
- POST   /admin/authors/{author_id}/discovery/candidates/{candidate_id}/reject
- GET    /admin/authors/{author_id}/discovery/metrics       — human-action telemetry

Review actions are audited via ``security_audit_logs`` and feed the
``human_actions_per_author`` metric.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.author import Author
from app.models.author_citizenship import AuthorCitizenship
from app.models.author_residence import AuthorResidence
from app.models.source import Source
from app.models.source_candidate import SourceCandidate
from app.models.syvai_run import SyvaiRun
from app.models.user import User
from app.services.security_audit import add_security_event
from app.syvai.registry import beta_routing_metrics
from app.syvai.discovery import (
    DOMAIN,
    approve_candidate,
    build_discovery_providers,
    discovery_metrics,
    discovery_provider_status,
    reject_candidate,
    run_discovery,
)
from app.syvai.discovery.service import _resolve_candidate_or_none
from app.syvai.discovery.verification import CONTENT_INSPECTOR_VERSION
from app.syvai.errors import ConfigurationError, DiscoveryError
from app.syvai.corpus import build_author_corpus, corpus_state, corpus_summary
from app.syvai.discovery.reinspection import reinspect_source_content

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/authors", tags=["admin-syvai-discovery"])


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


def _candidate_dict(candidate: SourceCandidate, source: Source | None = None) -> dict:
    return {
        "id": str(candidate.id),
        "author_id": str(candidate.author_id),
        "run_id": str(candidate.run_id) if candidate.run_id else None,
        "source_id": str(candidate.source_id) if candidate.source_id else None,
        "url": candidate.url,
        "normalized_url": candidate.normalized_url,
        "title": candidate.title,
        "source_type": candidate.source_type,
        "authority_tier": candidate.authority_tier,
        "quality_score": candidate.quality_score,
        "assessment": candidate.assessment,
        "assessment_reason": candidate.assessment_reason,
        "provider": candidate.provider,
        "origin": candidate.origin,
        "evidence": candidate.evidence,
        "corpus_state": corpus_state(candidate),
        "identity_verification": candidate.identity_verification,
        "content_capabilities": candidate.content_capabilities or [],
        "capability_evidence": candidate.capability_evidence or {},
        "provenance_chain": {
            "provider": candidate.provider,
            "origin": candidate.origin,
            "run_id": str(candidate.run_id) if candidate.run_id else None,
            "identity": candidate.identity_verification,
        },
        "status": candidate.status,
        "review_action": candidate.review_action,
        "reviewed_at": candidate.reviewed_at.isoformat() if candidate.reviewed_at else None,
        "reviewed_by": str(candidate.reviewed_by) if candidate.reviewed_by else None,
        "created_at": candidate.created_at.isoformat() if candidate.created_at else None,
        "content_inspector_version": source.content_inspector_version if source else None,
        "current_inspector_version": CONTENT_INSPECTOR_VERSION,
        "reinspection_required": bool(source and source.content_inspector_version != CONTENT_INSPECTOR_VERSION),
    }


def _run_dict(run: SyvaiRun) -> dict:
    return {
        "id": str(run.id),
        "author_id": str(run.author_id),
        "domain": run.domain,
        "status": run.status,
        "provider": run.provider,
        "model": run.model,
        "duration_ms": run.duration_ms,
        "calls": run.calls,
        "source_count": run.source_count,
        "error": run.error,
        "created_at": run.created_at.isoformat() if run.created_at else None,
        "finished_at": run.finished_at.isoformat() if run.finished_at else None,
    }


# ============================================================
# STATUS
# ============================================================


@router.get("/{author_id}/discovery/status")
async def get_discovery_status(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)
    await get_author_or_404(db, author_id)
    return discovery_provider_status()


# ============================================================
# TRIGGER RUN
# ============================================================


@router.post("/{author_id}/discovery/run")
async def trigger_discovery_run(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)

    try:
        providers = build_discovery_providers()
    except ConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    outcome = await run_discovery(db, author, providers)
    if outcome.error:
        raise HTTPException(status_code=502, detail=outcome.error)

    return {
        "run": _run_dict(outcome.run),
        "candidates": [_candidate_dict(c) for c in outcome.candidates],
        "created_sources": [str(s.id) for s in outcome.created_sources],
        "duplicate_skipped": outcome.duplicate_skipped,
        "family_skipped": outcome.family_skipped,
        "unparseable_skipped": outcome.unparseable_skipped,
        "providers_attempted": outcome.providers_attempted,
        "providers_succeeded": outcome.providers_succeeded,
        "providers_failed": outcome.providers_failed,
        "message": "Source discovery completed",
    }


# ============================================================
# RUNS
# ============================================================


@router.get("/{author_id}/discovery/runs")
async def list_discovery_runs(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)
    await get_author_or_404(db, author_id)

    result = await db.execute(
        select(SyvaiRun)
        .where(SyvaiRun.author_id == author_id, SyvaiRun.domain == DOMAIN)
        .order_by(SyvaiRun.created_at.desc())
    )
    runs = result.scalars().all()
    return {"data": [_run_dict(run) for run in runs]}


# ============================================================
# CANDIDATES
# ============================================================


@router.get("/{author_id}/discovery/candidates")
async def list_discovery_candidates(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    status: str | None = None,
    assessment: str | None = None,
):
    await check_admin(current_user)
    await get_author_or_404(db, author_id)

    query = select(SourceCandidate, Source).outerjoin(Source, Source.id == SourceCandidate.source_id).where(SourceCandidate.author_id == author_id)
    if status:
        query = query.where(SourceCandidate.status == status)
    if assessment:
        query = query.where(SourceCandidate.assessment == assessment)
    query = query.order_by(SourceCandidate.created_at.desc())

    result = await db.execute(query)
    candidates = result.all()
    return {"data": [_candidate_dict(c, s) for c, s in candidates]}


@router.post("/{author_id}/sources/{source_id}/reinspect")
async def reinspect_author_source(
    author_id: str,
    source_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)
    await get_author_or_404(db, author_id)
    linked = await db.execute(select(SourceCandidate.id).where(
        SourceCandidate.author_id == author_id,
        SourceCandidate.source_id == source_id,
        SourceCandidate.review_action.in_(("approved", "auto_approved")),
    ).limit(1))
    if linked.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Verified Author Source not found")
    try:
        result = await reinspect_source_content(db, source_id, actor_id=current_user.id)
    except DiscoveryError as exc:
        await db.rollback()
        raise HTTPException(status_code=422, detail=str(exc))
    return {
        "source_id": result.source_id,
        "previous_inspector_version": result.previous_inspector_version,
        "current_inspector_version": result.current_inspector_version,
        "capabilities_before": result.capabilities_before,
        "capabilities_after": result.capabilities_after,
        "capability_evidence": result.capability_evidence,
        "changed": result.changed,
        "status": result.status,
    }


async def _get_pending_candidate_or_404(
    db: AsyncSession, author_id: str, candidate_id: str
) -> SourceCandidate:
    candidate = await _resolve_candidate_or_none(db, author_id, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if candidate.status != "pending":
        raise HTTPException(status_code=409, detail="Candidate is already reviewed")
    return candidate


@router.post("/{author_id}/discovery/candidates/{candidate_id}/approve")
async def approve_source_candidate(
    author_id: str,
    candidate_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)
    await get_author_or_404(db, author_id)
    candidate = await _get_pending_candidate_or_404(db, author_id, candidate_id)

    try:
        approved = await approve_candidate(
            db,
            author_id,
            candidate,
            actor_id=str(current_user.id),
            add_security_event=add_security_event,
        )
    except DiscoveryError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    return {"candidate": _candidate_dict(approved), "approved": True}


@router.post("/{author_id}/discovery/candidates/{candidate_id}/reject")
async def reject_source_candidate(
    author_id: str,
    candidate_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)
    await get_author_or_404(db, author_id)
    candidate = await _get_pending_candidate_or_404(db, author_id, candidate_id)

    try:
        rejected = await reject_candidate(
            db,
            author_id,
            candidate,
            actor_id=str(current_user.id),
            add_security_event=add_security_event,
        )
    except DiscoveryError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    return {"candidate": _candidate_dict(rejected), "rejected": True}


# ============================================================
# ROUTING (0.3E Beta source registry)
# ============================================================


@router.get("/{author_id}/discovery/routing")
async def get_author_routing(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Read-only Beta routing report for ``author``.

    Returns the author's structured geographic context, the research domains
    derivable from existing Author fields, the approved source pool per domain
    (SOURCE_POOL_READY / PARTIAL / MISSING), and runtime-derived proposal
    metrics. Never triggers research and never writes.
    """
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)

    citizenships_result = await db.execute(
        select(AuthorCitizenship).where(AuthorCitizenship.author_id == author.id)
    )
    citizenships = citizenships_result.scalars().all()

    residences_result = await db.execute(
        select(AuthorResidence).where(AuthorResidence.author_id == author.id)
    )
    residences = residences_result.scalars().all()

    metrics = await beta_routing_metrics(
        db,
        author,
        citizenships=citizenships,
        residences=residences,
    )
    discovery = await discovery_metrics(db, str(author.id))
    discovery_summary = {
        key: discovery.get(key)
        for key in (
            "candidates_total",
            "candidates_pending",
            "providers_attempted",
            "providers_succeeded",
            "providers_failed",
            "human_actions_per_author",
            "distinct_family_count",
        )
    }

    return {
        "author_id": metrics["author_id"],
        "geographic_context": metrics["geographic_context"],
        "research_domains": metrics["research_domains"],
        "pools": metrics["pools"],
        "proposals": metrics["proposals"],
        "source_discovery": discovery_summary,
    }


# ============================================================
# METRICS
# ============================================================


@router.get("/{author_id}/discovery/metrics")
async def get_discovery_metrics(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)
    await get_author_or_404(db, author_id)
    return await discovery_metrics(db, author_id)


@router.get("/{author_id}/research-corpus")
async def get_research_corpus(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the Author-specific, generation-eligible curated corpus."""
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)
    return corpus_summary(await build_author_corpus(db, author.id))
