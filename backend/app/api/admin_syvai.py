"""SyvAI admin endpoints for the timeline vertical slice and the 0.4B fill runs.

- POST /admin/authors/{author_id}/ai/timeline  — run one grounded research run
- POST /admin/authors/{author_id}/ai/fill      — run one grounded fill domain
- GET  /admin/authors/{author_id}/ai/runs      — list runs (telemetry/review)
- POST /admin/authors/{author_id}/proposals/{proposal_id}/apply
                                               — explicit, audited apply of an
                                                 accepted/auto-approved proposal

Public visibility is never touched here: applying a proposal only writes
canonical editorial data inside the existing Sapphire lifecycle (see
``app.syvai.apply_author`` for the single Apply boundary).
"""

import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.ai_proposal import AIProposal
from app.models.ai_proposal_source import AIProposalSource
from app.models.author import Author
from app.models.source import Source
from app.models.syvai_run import SyvaiRun
from app.models.user import User
from app.syvai.core_fill import run_domain_research
from app.syvai.bootstrap_author import run_author_bootstrap
from app.syvai.errors import ConfigurationError
from app.syvai.pipeline import run_timeline_research
from app.syvai.provider import OpenAICompatibleProvider, ProviderConfig

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/authors", tags=["admin-syvai"])


class FillRequest(BaseModel):
    domain: str = Field(
        description="One of the 0.4B fill domains: identity, biography, literary_context"
    )


async def _pending_bootstrap_proposal_ids(db: AsyncSession, author_id: str) -> set[str]:
    result = await db.execute(select(AIProposal.id).where(
        AIProposal.entity_type == "author",
        AIProposal.entity_id == author_id,
        AIProposal.source_type == "catalog_bootstrap",
        AIProposal.status == "proposed",
    ))
    return {str(proposal_id) for (proposal_id,) in result.all()}


def _json_object(raw: str | None) -> dict:
    try:
        value = json.loads(raw or "")
        return value if isinstance(value, dict) else {}
    except (TypeError, ValueError):
        return {}


def _bootstrap_item(proposal: AIProposal, *, reused: bool) -> dict:
    claim = _json_object(proposal.suggested_value)
    current = _json_object(proposal.current_value).get("value")
    source = claim.get("source") if isinstance(claim.get("source"), dict) else {}
    evidence = claim.get("evidence") if isinstance(claim.get("evidence"), dict) else {}
    verification = claim.get("verification") if isinstance(claim.get("verification"), dict) else {}
    return {
        "field": proposal.field_name,
        "proposed_value": claim.get("value"),
        "current_value": current,
        "verification_status": verification.get("verdict", "verified"),
        "reason": proposal.review_reason,
        "disposition": "reused" if reused else "created",
        "proposal_id": str(proposal.id),
        "provenance": {
            "wikidata_qid": source.get("wikidata_qid"),
            "property_id": source.get("property_id"),
            "statement_id": evidence.get("statement_id"),
        },
    }


def _bootstrap_response(outcome, *, existing_ids: set[str], preview: bool) -> dict:
    verified, conflicts = [], []
    for proposal in outcome.proposals:
        item = _bootstrap_item(proposal, reused=str(proposal.id) in existing_ids)
        (conflicts if proposal.conflict_state == "canonical_conflict" else verified).append(item)

    already_present, skipped = [], []
    for entry in outcome.fields_skipped:
        item = {
            "field": entry.get("field"), "reason": entry.get("reason"),
            "proposed_value": entry.get("proposed_value"),
            "current_value": entry.get("current_value"),
        }
        if entry.get("reason") == "already_present_in_canonical_author":
            already_present.append(item)
        else:
            skipped.append(item)

    created = sum(item["disposition"] == "created" for item in verified + conflicts)
    reused = sum(item["disposition"] == "reused" for item in verified + conflicts)
    return {
        "preview": preview,
        "run_id": None if preview else str(outcome.run.id),
        "status": outcome.run.status,
        "resolved_identity": outcome.identity.provenance() if outcome.identity else None,
        "categories": {
            "verified": verified,
            "conflicts": conflicts,
            "already_present": already_present,
            "skipped": skipped,
        },
        "counts": {
            "created": created,
            "reused": reused,
            "already_present": len(already_present),
            "skipped": len(skipped),
        },
        "proposal_ids": [item["proposal_id"] for item in verified + conflicts],
        "automatic_approval": False,
        "automatic_apply": False,
    }


@router.post("/{author_id}/bootstrap/preview")
async def preview_author_catalog_evidence(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Run the authoritative Bootstrap pipeline, then roll back every write."""
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)
    existing_ids = await _pending_bootstrap_proposal_ids(db, author_id)
    savepoint = await db.begin_nested()
    outcome = None
    error = None
    try:
        outcome = await run_author_bootstrap(db, author)
        response = _bootstrap_response(outcome, existing_ids=existing_ids, preview=True)
        error = outcome.error
    finally:
        await savepoint.rollback()
    if error:
        raise HTTPException(status_code=422, detail={
            "status": "failed", "reason": error,
        })
    return response


@router.post("/{author_id}/bootstrap")
async def bootstrap_author_catalog_evidence(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Explicit B2 canonical evidence acquisition; never approves or applies."""
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)
    existing_ids = await _pending_bootstrap_proposal_ids(db, author_id)
    outcome = await run_author_bootstrap(db, author)
    await db.commit()
    if outcome.error:
        raise HTTPException(status_code=422, detail={
            "run_id": str(outcome.run.id), "status": outcome.run.status,
            "reason": outcome.error,
        })
    response = _bootstrap_response(outcome, existing_ids=existing_ids, preview=False)
    response.update({
        "run_id": str(outcome.run.id),
        "wikidata_structured_facts_acquired": len(outcome.proposals),
        "wikipedia_source": {
            "id": str(outcome.wikipedia_source.id),
            "title": outcome.wikipedia_source.title,
            "url": outcome.wikipedia_source.url,
        } if outcome.wikipedia_source else None,
        "proposals_created": response["counts"]["created"],
        "fields_skipped": outcome.fields_skipped,
    })
    return response


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
        "corroboration": getattr(proposal, "corroboration", None),
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
            "snippet": link.snippet if link.provenance_type != "unverified_model" else None,
            "verification_state": link.verification_state,
            "verification_reason": link.verification_reason,
            "provenance_type": link.provenance_type,
            "synthesis_involved": link.synthesis_involved,
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


@router.post("/{author_id}/ai/fill")
async def run_author_fill_research(
    author_id: str,
    body: FillRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Run one grounded Author core fill run (identity | biography | literary_context).

    0.4B: generation is safe-first — a skipped run (SOURCE_POOL_MISSING or
    NO_TRUSTED_SOURCE) is returned normally so Studio can see why no call ran;
    a provider/structure failure returns 502. Nothing is applied here.
    """
    from app.syvai.field_specs import FILL_DOMAINS

    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)

    if body.domain not in FILL_DOMAINS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported fill domain '{body.domain}'; expected one of {', '.join(FILL_DOMAINS)}",
        )

    try:
        provider = OpenAICompatibleProvider(ProviderConfig.from_env())
    except ConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    outcome = await run_domain_research(db, author, provider, body.domain)
    if outcome.error and outcome.run.status == "failed":
        raise HTTPException(status_code=502, detail=outcome.error)

    proposals = [
        _proposal_dict(proposal, await _proposal_sources(db, proposal.id))
        for proposal in outcome.proposals
    ]
    message = (
        f"{body.domain} research {outcome.run.status}" if outcome.error
        else f"{body.domain} research completed"
    )
    return {
        "run": _run_dict(outcome.run),
        "proposals": proposals,
        "message": message,
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
        "routing_reason": run.routing_reason,
        "corpus_manifest": run.corpus_manifest,
        "provider_called": bool((run.corpus_manifest or {}).get("provider_called")),
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
    """Explicit, audited Apply of an accepted/auto-approved proposal.

    0.6B: a single canonical Apply boundary. TIMELINE keeps its dedicated
    contract (accepted-only, primary-source selection, idempotent). Author
    field proposals (IDENTITY / BIOGRAPHY / LITERARY_CONTEXT) apply through the
    shared safe-Apply service: eligible, conflict-guarded, merge-on-lists,
    audited, idempotent.
    """
    from app.syvai.apply_author import ApplyError, apply_author_field_proposal
    from app.syvai.apply_author import apply_timeline_proposal

    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)
    proposal = await get_proposal_or_404(db, author_id, proposal_id)

    endpoint = f"/admin/authors/{author_id}/proposals/{proposal_id}/apply"
    try:
        if proposal.field_name == "timeline_event":
            result = await apply_timeline_proposal(
                db,
                proposal=proposal,
                author_id=author_id,
                actor_id=current_user.id,
                endpoint=endpoint,
                request=request,
            )
        else:
            result = await apply_author_field_proposal(
                db,
                proposal=proposal,
                author=author,
                actor_id=current_user.id,
                endpoint=endpoint,
                request=request,
            )
    except ApplyError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    await db.commit()
    return result
