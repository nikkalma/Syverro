"""SyvAI 0.1A timeline research pipeline.

Orchestrates the vertical slice end to end:

    research input (trusted Sapphire sources)
        -> provider structured call
        -> claim parsing
        -> deterministic validation
        -> explainable confidence
        -> proposal + evidence persistence

The pipeline runs synchronously in the request process for 0.1A. No Celery,
Redis, or distributed queue is introduced; ``syvai_runs`` is the run record
and benchmark grouping anchor.
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_proposal import AIProposal
from app.models.ai_proposal_source import AIProposalSource
from app.models.author import Author
from app.models.source import Source
from app.models.syvai_run import SyvaiRun
from app.syvai.confidence import compute_confidence
from app.syvai.errors import ConfigurationError, ProviderError, StructuredOutputError
from app.syvai.provider import Provider, ProviderResult
from app.syvai.prompts.timeline_v1 import build_timeline_prompt
from app.syvai.timeline_claims import TimelineClaim, parse_timeline_claims
from app.syvai.timeline_research import (
    build_research_input,
    load_existing_events,
    load_trusted_sources,
)
from app.syvai.validators import (
    REVIEW_BAND_AUTO_REJECTED,
    REVIEW_BANDS_NEEDING_HUMAN,
    ExistingEvent,
    validate_timeline_claim,
)

logger = logging.getLogger(__name__)

DOMAIN = "timeline"


@dataclass
class RunOutcome:
    run: SyvaiRun
    proposals: list[AIProposal]
    error: str | None = None


def _normalize_token(value: str) -> str:
    return value.strip().casefold()


def _match_source(ref: dict, sources: list[dict]) -> dict | None:
    """Match a claim's source reference against the trusted source registry.

    Matches by normalized URL first, then by normalized title.
    """
    ref_url = ref.get("url")
    if ref_url:
        normalized_ref_url = _normalize_token(ref_url.rstrip("/"))
        for source in sources:
            source_url = source.get("url")
            if source_url and _normalize_token(source_url.rstrip("/")) == normalized_ref_url:
                return source
    ref_title = _normalize_token(ref.get("title") or "")
    if ref_title:
        for source in sources:
            if _normalize_token(source.get("title") or "") == ref_title:
                return source
    return None


def _claim_to_json(claim: TimelineClaim) -> str:
    return json.dumps(claim.model_dump(), ensure_ascii=False)


def _current_value_json(matched: ExistingEvent | None) -> str | None:
    if not matched:
        return None
    return json.dumps(
        {
            "id": matched.id,
            "event_type": matched.event_type,
            "date_value": matched.date_value,
            "date_precision": matched.date_precision,
            "label": matched.label,
        },
        ensure_ascii=False,
    )


def _reliability_tier(score: str | None) -> str:
    if not score:
        return "unknown"
    try:
        number = float(score)
    except (TypeError, ValueError):
        return "unknown"
    if number <= 1.0:
        return "high" if number >= 0.9 else "medium" if number >= 0.6 else "low"
    return {5: "high", 4: "high", 3: "medium", 2: "low", 1: "low"}.get(int(number), "unknown")


def _record_usage(run: SyvaiRun, usage: Any) -> None:
    run.provider = getattr(usage, "provider", run.provider)
    run.model = getattr(usage, "model", run.model)
    run.input_tokens = getattr(usage, "input_tokens", None)
    run.output_tokens = getattr(usage, "output_tokens", None)
    run.total_tokens = getattr(usage, "total_tokens", None)
    run.estimated_cost_usd = getattr(usage, "estimated_cost_usd", None)
    run.calls = getattr(usage, "calls", 1)
    run.duration_ms = getattr(usage, "duration_ms", None)


def _sanitize_error(exc: BaseException) -> str:
    """Return a client-safe error summary. Never includes provider bodies."""
    if isinstance(exc, ConfigurationError):
        return str(exc)
    if isinstance(exc, ProviderError):
        return f"provider call failed: {exc}"
    if isinstance(exc, StructuredOutputError):
        return f"provider output rejected: {exc}"
    return "internal SyvAI error"


async def _persist_proposals(
    db: AsyncSession,
    author: Author,
    run: SyvaiRun,
    claims: list[TimelineClaim],
    trusted_sources: list[dict],
    existing_events: list[ExistingEvent],
) -> list[AIProposal]:
    source_map = {source["id"]: source for source in trusted_sources}
    source_id_list = list(source_map)
    proposals: list[AIProposal] = []

    source_rows = []
    if source_id_list:
        result = await db.execute(select(Source).where(Source.id.in_(source_id_list)))
        source_rows = result.scalars().all()
    source_by_id = {str(source.id): source for source in source_rows}

    for claim in claims:
        matched_sources = []
        seen_source_ids: set[str] = set()
        for ref in claim.sources:
            matched = _match_source(ref.model_dump(), trusted_sources)
            if matched and matched["id"] not in seen_source_ids:
                matched_sources.append(matched)
                seen_source_ids.add(matched["id"])

        reliabilities = [source.get("reliability_score") for source in matched_sources]
        validation = validate_timeline_claim(
            claim,
            author_birth_date=author.birth_date,
            author_death_date=author.death_date,
            existing_events=existing_events,
            source_count=len(matched_sources),
        )
        confidence = compute_confidence(
            validation=validation,
            source_count=len(matched_sources),
            distinct_source_count=len(matched_sources),
            reliabilities=reliabilities,
        )

        proposal = AIProposal(
            entity_type="author",
            entity_id=str(author.id),
            field_name="timeline_event",
            current_value=_current_value_json(validation.matched_event),
            suggested_value=_claim_to_json(claim),
            source_type="ai",
            confidence=confidence,
            status="rejected" if validation.review_band == REVIEW_BAND_AUTO_REJECTED else "proposed",
            validation_state=validation.validation_state,
            conflict_state=validation.conflict_state,
            review_band=validation.review_band,
            review_reason=validation.review_reason,
            run_id=run.id,
        )
        db.add(proposal)
        await db.flush()

        for matched in matched_sources:
            source_id = matched["id"]
            db.add(
                AIProposalSource(
                    proposal_id=proposal.id,
                    source_id=source_id,
                    snippet=None,
                    reliability_tier=_reliability_tier(
                        source_by_id.get(source_id).reliability_score
                        if source_by_id.get(source_id) else None
                    ),
                )
            )
        proposals.append(proposal)

    return proposals


async def run_timeline_research(
    db: AsyncSession,
    author: Author,
    provider: Provider,
) -> RunOutcome:
    """Execute one grounded timeline research run for ``author``.

    The run record is committed regardless of outcome so telemetry and error
    reporting survive provider failures.
    """
    started = time.monotonic()
    run = SyvaiRun(
        author_id=author.id,
        domain=DOMAIN,
        status="running",
        provider=getattr(provider, "name", ""),
        model=getattr(provider, "model", None),
    )
    db.add(run)
    await db.flush()

    try:
        trusted_sources = await load_trusted_sources(db, author)
        run.source_count = len(trusted_sources)
        research = build_research_input(author, trusted_sources)
        system_prompt, user_prompt = build_timeline_prompt(research)

        result: ProviderResult = await provider.complete(system_prompt, user_prompt)
        claims = parse_timeline_claims(result.text)

        existing_events = await load_existing_events(db, author)
        proposals = await _persist_proposals(
            db, author, run, claims, trusted_sources, existing_events
        )

        _record_usage(run, result.usage)
        run.duration_ms = int((time.monotonic() - started) * 1000)
        run.finished_at = datetime.now(timezone.utc).replace(tzinfo=None)

        if any(p.review_band in REVIEW_BANDS_NEEDING_HUMAN for p in proposals):
            run.status = "review_needed"
        else:
            run.status = "completed"
        run.error = None

        await db.commit()
        await db.refresh(run)
        return RunOutcome(run=run, proposals=proposals)
    except (ConfigurationError, ProviderError, StructuredOutputError) as exc:
        run.status = "failed"
        run.error = _sanitize_error(exc)
        run.duration_ms = int((time.monotonic() - started) * 1000)
        run.finished_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await db.commit()
        await db.refresh(run)
        logger.warning("syvai timeline run failed: %s", run.error)
        return RunOutcome(run=run, proposals=[], error=run.error)
    except Exception as exc:  # noqa: BLE001 - boundary catch for telemetry
        run.status = "failed"
        run.error = _sanitize_error(exc)
        run.duration_ms = int((time.monotonic() - started) * 1000)
        run.finished_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await db.commit()
        await db.refresh(run)
        logger.exception("syvai timeline run crashed: %s", run.error)
        return RunOutcome(run=run, proposals=[], error=run.error)
