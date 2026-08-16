"""Source-discovery orchestration for SyvAI 0.2A.

The service owns the full lifecycle of a bounded discovery run:

    author + provider
      -> candidate pages (provider, bounded)
      -> normalization + dedup + source-family cap
      -> deterministic assessment (auto_usable / needs_review / rejected)
      -> persistence (source_candidates + promoted sources)

Promoted sources carry ``source_origin="syvai_discovery"`` and are linked back
from their candidate row (``source_candidates.source_id``) so the existing
trusted-source loader can collect them into the author's research corpus.
Review actions (approve/reject) are audited and feed ``human_actions_per_author``.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_proposal import AIProposal
from app.models.source import Source
from app.models.source_candidate import SourceCandidate
from app.models.syvai_run import SyvaiRun
from app.syvai.discovery.assessment import (
    ASSESSMENT_AUTO_USABLE,
    ASSESSMENT_NEEDS_REVIEW,
    assess_candidate,
)
from app.syvai.discovery.authority import authority_tier_for_url
from app.syvai.discovery.dedupe import RawCandidate, _existing_normalized, dedupe_candidates
from app.syvai.discovery.providers import SourceDiscoveryProvider
from app.syvai.discovery.urls import normalize_url
from app.syvai.errors import (
    ConfigurationError,
    DiscoveryError,
    ProviderError,
    SyvaiError,
)

logger = logging.getLogger(__name__)

DOMAIN = "source_discovery"

REVIEWABLE_REVIEW_ACTIONS = ("approved", "rejected")

# Legacy reliability_score kept consistent with the 0.1A tier mapping
# (high >= 0.9 or 5/4). Auto-approved discovery sources are top-tier.
_AUTO_RELIABILITY = {"high": "5", "medium": "4", "low": "3", "unknown": "3"}


@dataclass
class DiscoveryOutcome:
    run: SyvaiRun | None = None
    candidates: list[SourceCandidate] = field(default_factory=list)
    created_sources: list[Source] = field(default_factory=list)
    error: str | None = None
    configured: bool = True
    duplicate_skipped: int = 0
    family_skipped: int = 0
    unparseable_skipped: int = 0


def _author_query_terms(author) -> list[str]:
    terms: list[str] = []
    for name in (getattr(author, "display_name", None), getattr(author, "name", None)):
        if name and name not in terms:
            terms.append(name)
    return terms or []


def _sanitize_error(exc: BaseException) -> str:
    if isinstance(exc, (ConfigurationError, DiscoveryError)):
        return str(exc)
    if isinstance(exc, ProviderError):
        return f"discovery provider failed: {exc}"
    return "internal SyvAI discovery error"


def _promote_to_source(
    candidate: SourceCandidate,
    *,
    provider_name: str,
    review_status: str,
) -> Source:
    return Source(
        title=candidate.title or candidate.normalized_url or candidate.url,
        source_type=candidate.source_type or "website",
        url=candidate.url,
        citation=candidate.evidence,
        source_origin="syvai_discovery",
        authority_tier=candidate.authority_tier,
        review_status=review_status,
        normalized_url=candidate.normalized_url,
        discovered_by=provider_name,
        discovered_at=datetime.now(timezone.utc),
        reliability_score=_AUTO_RELIABILITY.get(candidate.authority_tier, "3"),
    )


async def run_discovery(
    db: AsyncSession,
    author,
    provider: SourceDiscoveryProvider,
    *,
    max_per_family: int | None = None,
) -> DiscoveryOutcome:
    """Execute one bounded discovery run; the run record always commits."""
    from app.config import settings

    max_per_family = max_per_family if max_per_family is not None else settings.SYVAI_DISCOVERY_MAX_PER_FAMILY
    started = time.monotonic()
    run = SyvaiRun(
        author_id=author.id,
        domain=DOMAIN,
        status="running",
        provider=getattr(provider, "name", ""),
        model=None,
    )
    db.add(run)
    await db.flush()

    try:
        terms = _author_query_terms(author)
        raw: list[RawCandidate] = await provider.discover(author, terms)

        existing_result = await db.execute(select(Source))
        existing_sources = existing_result.scalars().all()
        existing_normalized = _existing_normalized(existing_sources)

        kept, summary = dedupe_candidates(
            raw,
            existing_normalized=existing_normalized,
            max_per_family=max_per_family,
        )

        candidates: list[SourceCandidate] = []
        created_sources: list[Source] = []
        for candidate in kept:
            tier = authority_tier_for_url(candidate.url)
            assessment = assess_candidate(
                url=candidate.url,
                title=candidate.title,
                evidence=candidate.evidence,
                authority_tier=tier,
                query_terms=terms,
                existing_normalized=existing_normalized,
            )
            row = SourceCandidate(
                author_id=author.id,
                run_id=run.id,
                url=candidate.url,
                normalized_url=assessment.normalized_url or candidate.url,
                title=candidate.title,
                source_type=candidate.source_type,
                authority_tier=tier,
                quality_score=assessment.quality_score,
                assessment=assessment.assessment,
                assessment_reason=assessment.reason,
                provider=provider.name,
                origin=candidate.origin,
                evidence=candidate.evidence,
            )
            db.add(row)
            await db.flush()

            if assessment.assessment == ASSESSMENT_AUTO_USABLE:
                source = _promote_to_source(row, provider_name=provider.name, review_status="auto_approved")
                db.add(source)
                await db.flush()
                row.source_id = source.id
                row.status = "reviewed"
                row.review_action = "auto_approved"
                row.reviewed_at = datetime.now(timezone.utc)
                created_sources.append(source)

            candidates.append(row)

        run.source_count = len(candidates)
        run.calls = 1
        run.duration_ms = int((time.monotonic() - started) * 1000)
        run.finished_at = datetime.now(timezone.utc).replace(tzinfo=None)
        if any(c.assessment == ASSESSMENT_NEEDS_REVIEW for c in candidates):
            run.status = "review_needed"
        else:
            run.status = "completed"
        run.error = None

        await db.commit()
        await db.refresh(run)
        return DiscoveryOutcome(
            run=run,
            candidates=candidates,
            created_sources=created_sources,
            duplicate_skipped=summary.dropped_existing_duplicate + summary.dropped_run_duplicate,
            family_skipped=summary.dropped_family_cap,
            unparseable_skipped=summary.dropped_unparseable,
        )
    except (ConfigurationError, ProviderError, DiscoveryError, SyvaiError) as exc:
        run.status = "failed"
        run.error = _sanitize_error(exc)
        run.duration_ms = int((time.monotonic() - started) * 1000)
        run.finished_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await db.commit()
        await db.refresh(run)
        logger.warning("syvai discovery run failed: %s", run.error)
        return DiscoveryOutcome(run=run, error=run.error)
    except Exception as exc:  # noqa: BLE001 - boundary catch for telemetry
        run.status = "failed"
        run.error = _sanitize_error(exc)
        run.duration_ms = int((time.monotonic() - started) * 1000)
        run.finished_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await db.commit()
        await db.refresh(run)
        logger.exception("syvai discovery run crashed: %s", run.error)
        return DiscoveryOutcome(run=run, error=run.error)


async def _resolve_candidate_or_none(
    db: AsyncSession, author_id: str, candidate_id: str
) -> SourceCandidate | None:
    result = await db.execute(
        select(SourceCandidate).where(
            SourceCandidate.id == candidate_id,
            SourceCandidate.author_id == author_id,
        )
    )
    return result.scalar_one_or_none()


async def approve_candidate(
    db: AsyncSession,
    author_id: str,
    candidate: SourceCandidate,
    *,
    actor_id: str,
    add_security_event=None,
) -> SourceCandidate:
    """Promote a pending candidate to a curated Source row (idempotent-ish:
    an existing global Source with the same normalized URL is reused)."""
    if candidate.status != "pending":
        raise DiscoveryError("candidate is not pending review")

    existing = None
    if candidate.normalized_url:
        result = await db.execute(
            select(Source).where(Source.normalized_url == candidate.normalized_url)
        )
        existing = result.scalar_one_or_none()

    if existing is None:
        source = _promote_to_source(candidate, provider_name=candidate.provider or "manual", review_status="reviewed")
        db.add(source)
        await db.flush()
        candidate.source_id = source.id
    else:
        candidate.source_id = existing.id

    candidate.status = "reviewed"
    candidate.review_action = "approved"
    candidate.reviewed_at = datetime.now(timezone.utc)
    candidate.reviewed_by = actor_id

    if add_security_event:
        add_security_event(
            db,
            event_type="source_candidate_approve",
            endpoint=f"/admin/authors/{author_id}/discovery/candidates/{candidate.id}/approve",
            method="POST",
            status_code=200,
            actor_id=actor_id,
            target_id=candidate.id,
            details={"source_id": str(candidate.source_id), "url": candidate.url},
        )
    await db.commit()
    return candidate


async def reject_candidate(
    db: AsyncSession,
    author_id: str,
    candidate: SourceCandidate,
    *,
    actor_id: str,
    add_security_event=None,
) -> SourceCandidate:
    """Mark a pending candidate as reviewed and rejected."""
    if candidate.status != "pending":
        raise DiscoveryError("candidate is not pending review")

    candidate.status = "reviewed"
    candidate.review_action = "rejected"
    candidate.reviewed_at = datetime.now(timezone.utc)
    candidate.reviewed_by = actor_id

    if add_security_event:
        add_security_event(
            db,
            event_type="source_candidate_reject",
            endpoint=f"/admin/authors/{author_id}/discovery/candidates/{candidate.id}/reject",
            method="POST",
            status_code=200,
            actor_id=actor_id,
            target_id=candidate.id,
            details={"url": candidate.url},
        )
    await db.commit()
    return candidate


async def discovery_metrics(db: AsyncSession, author_id: str) -> dict:
    """Per-author discovery and human-action telemetry."""
    result = await db.execute(
        select(SourceCandidate).where(SourceCandidate.author_id == author_id)
    )
    candidates = result.scalars().all()

    by_assessment: dict[str, int] = {}
    by_action: dict[str, int] = {}
    for candidate in candidates:
        by_assessment[candidate.assessment] = by_assessment.get(candidate.assessment, 0) + 1
        if candidate.review_action:
            by_action[candidate.review_action] = by_action.get(candidate.review_action, 0) + 1

    human_actions = sum(by_action.get(action, 0) for action in REVIEWABLE_REVIEW_ACTIONS)

    proposals_result = await db.execute(
        select(func.count(AIProposal.id)).where(
            AIProposal.entity_id == author_id,
            AIProposal.reviewed_at.is_not(None),
        )
    )
    human_actions += proposals_result.scalar() or 0

    sources_result = await db.execute(
        select(Source).where(
            Source.source_origin == "syvai_discovery",
            Source.review_status == "auto_approved",
        )
    )
    auto_sources = sources_result.scalars().all()

    return {
        "author_id": str(author_id),
        "candidates_total": len(candidates),
        "candidates_pending": sum(1 for c in candidates if c.status == "pending"),
        "by_assessment": by_assessment,
        "by_review_action": by_action,
        "auto_approved_sources": len(auto_sources),
        "human_actions_per_author": human_actions,
        "formula": "approved + rejected candidates + reviewed AI proposals",
    }
