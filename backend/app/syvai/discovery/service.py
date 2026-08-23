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
from app.syvai.discovery.evidence import build_structured_evidence
from app.syvai.discovery.langlinks import (
    REASON_AMBIGUOUS,
    REASON_HTTP_ERROR,
    ResolvedIdentity,
    UnresolvedIdentity,
    resolve_en_identity,
)
from app.syvai.discovery.providers import SourceDiscoveryProvider
from app.syvai.discovery.query_terms import base_search_variants, search_variants
from app.syvai.discovery.ruwiki_fallback import search_fallback_resolve
from app.syvai.discovery.urls import normalize_url, registrable_domain
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
    providers_attempted: int = 0
    providers_succeeded: int = 0
    providers_failed: int = 0


def _author_query_terms(author) -> list[str]:
    """Bounded normalized query variants (display_name first, then name)."""
    return search_variants(author)


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
    providers: SourceDiscoveryProvider | list[SourceDiscoveryProvider],
    *,
    max_per_family: int | None = None,
) -> DiscoveryOutcome:
    """Execute one bounded multi-authority discovery run; the run always commits.

    Each provider runs independently; a provider failure is isolated and never
    aborts the others. Candidates from all successful providers are merged in a
    deterministic provider order, normalized, deduplicated across providers,
    capped per source family *after* the merge, then deterministically assessed.
    Run status: ``failed`` when every provider fails, ``partial`` when some fail,
    otherwise ``review_needed``/``completed`` per the candidate assessments.
    """
    from app.config import settings

    max_per_family = max_per_family if max_per_family is not None else settings.SYVAI_DISCOVERY_MAX_PER_FAMILY
    provider_list = providers if isinstance(providers, (list, tuple)) else [providers]
    started = time.monotonic()
    run = SyvaiRun(
        author_id=author.id,
        domain=DOMAIN,
        status="running",
        provider=", ".join(getattr(p, "name", "?") for p in provider_list),
        model=None,
    )
    db.add(run)
    await db.flush()

    # --- Phase: deterministic identity bootstrap (no LLM, bounded) ---
    # Resolves the author's normalized query variants to a concrete
    # ru.wikipedia article and its EN langlink. Outputs feed providers as
    # extra search variants, assessment as exact-match titles, and the merge
    # as one direct EN-wiki candidate. Never mutates canonical data.
    resolved: ResolvedIdentity | None = None
    unresolved: UnresolvedIdentity | None = None
    if getattr(settings, "SYVAI_DISCOVERY_LANGLINKS_BOOTSTRAP", False):
        try:
            outcome = await resolve_en_identity(_author_query_terms(author))
        except Exception as exc:  # noqa: BLE001 - isolation boundary
            logger.warning("syvai discovery langlink bootstrap error: %s", _sanitize_error(exc))
            outcome = UnresolvedIdentity(reason=REASON_HTTP_ERROR, detail="bootstrap_error")
        if isinstance(outcome, ResolvedIdentity):
            resolved = outcome
            logger.info(
                "syvai discovery langlink identity author=%s variant=%r ru=%r en=%r",
                getattr(author, "id", "?"),
                resolved.source_variant,
                resolved.ru_title,
                resolved.en_title,
            )
        else:
            unresolved = outcome
            logger.info(
                "syvai discovery langlink unresolved author=%s reason=%s %s",
                getattr(author, "id", "?"),
                unresolved.reason,
                unresolved.detail,
            )
            # --- Phase-2: bounded ru.wikipedia search fallback (design FINAL).
            # Fires ONLY on explicit bootstrap non-resolution; an ambiguous
            # Phase-1 outcome means concrete conflicting articles already
            # exist, so more searching can never disambiguate deterministically.
            if (
                getattr(settings, "SYVAI_DISCOVERY_RUWIKI_SEARCH_FALLBACK", False)
                and outcome.reason != REASON_AMBIGUOUS
            ):
                try:
                    fallback = await search_fallback_resolve(
                        base_search_variants(author),
                        birth_date=getattr(author, "birth_date", None),
                        death_date=getattr(author, "death_date", None),
                    )
                except Exception as exc:  # noqa: BLE001 - isolation boundary
                    logger.warning(
                        "syvai discovery search-fallback error: %s", _sanitize_error(exc)
                    )
                    fallback = UnresolvedIdentity(reason=REASON_HTTP_ERROR, detail="fallback_error")
                if isinstance(fallback, ResolvedIdentity):
                    resolved = fallback
                    unresolved = None
                    logger.info(
                        "syvai discovery search-fallback identity author=%s variant=%r ru=%r en=%r bind=%s",
                        getattr(author, "id", "?"),
                        resolved.source_variant,
                        resolved.ru_title,
                        resolved.en_title,
                        (resolved.fallback or {}).get("corroboration"),
                    )
                else:
                    unresolved = UnresolvedIdentity(
                        reason=fallback.reason,
                        detail=(
                            f"bootstrap[{outcome.reason}]: {outcome.detail}; "
                            f"fallback: {fallback.detail}"
                        )[:500],
                    )
                    logger.info(
                        "syvai discovery search-fallback unresolved author=%s reason=%s %s",
                        getattr(author, "id", "?"),
                        unresolved.reason,
                        unresolved.detail,
                    )
    identity_terms = tuple(resolved.romanized_terms) if resolved else ()

    def _merged_query_terms() -> list[str]:
        terms = _author_query_terms(author)
        for term in identity_terms:
            if term not in terms:
                terms.append(term)
        return terms

    # --- Phase: provider fan-out with failure isolation ---
    results: list[tuple[str, list[RawCandidate] | None, str | None]] = []
    for provider in provider_list:
        provider_name = getattr(provider, "name", "?")
        try:
            terms = _merged_query_terms()
            raw = await provider.discover(author, terms)
            results.append((provider_name, raw, None))
        except Exception as exc:  # noqa: BLE001 - isolation boundary
            error = _sanitize_error(exc)
            logger.warning("syvai discovery provider %s failed: %s", provider_name, error)
            results.append((provider_name, None, error))

    succeeded = [r for r in results if r[2] is None]
    failed = [r for r in results if r[2] is not None]
    providers_attempted = len(provider_list)
    providers_succeeded = len(succeeded)
    providers_failed = len(failed)

    candidates: list[SourceCandidate] = []
    created_sources: list[Source] = []
    duplicate_skipped = 0
    family_skipped = 0
    unparseable_skipped = 0

    try:
        if succeeded:
            # Deterministic merge: bootstrap identity candidate first (it wins
            # attribution when a provider surfaces the same URL), then the
            # providers in configured order.
            ordered: list[tuple[str, RawCandidate]] = []
            if resolved is not None and resolved.en_url:
                evidence_payload = {
                    "bootstrap_variant": resolved.source_variant,
                    "ru_title": resolved.ru_title,
                    "en_langlink": resolved.en_title or "",
                }
                if resolved.method != "exact_title":
                    # Phase-2 provenance: how the identity was bound.
                    evidence_payload["identity_method"] = resolved.method
                    fallback = resolved.fallback or {}
                    evidence_payload["bind_corroboration"] = str(
                        fallback.get("corroboration") or ""
                    )
                    evidence_payload["identity_qid"] = str(fallback.get("qid") or "")
                ordered.append(
                    (
                        "wikipedia-langlinks",
                        RawCandidate(
                            url=resolved.en_url,
                            title=resolved.en_title,
                            source_type="encyclopedia",
                            origin="langlinks_bootstrap"
                            if resolved.method == "exact_title"
                            else "ruwiki_search_fallback",
                            evidence=build_structured_evidence(evidence_payload),
                        ),
                    )
                )
            for provider_name, raw, _ in succeeded:
                for candidate in raw or []:
                    ordered.append((provider_name, candidate))

            existing_result = await db.execute(select(Source))
            existing_sources = existing_result.scalars().all()
            existing_normalized = _existing_normalized(existing_sources)

            # A candidate URL is a persistent author+URL identity
            # (uq_source_candidates_author_normalized), so URLs surfaced by
            # any prior run for this author must never be re-inserted —
            # whether they are still pending review or were already
            # approved/rejected. Fold them into the dedup set so re-discovery
            # is skipped (counted as an existing duplicate) and prior review
            # decisions are left untouched.
            prior_candidates_result = await db.execute(
                select(SourceCandidate).where(SourceCandidate.author_id == author.id)
            )
            existing_normalized |= _existing_normalized(prior_candidates_result.scalars().all())

            kept, summary = dedupe_candidates(
                [candidate for _, candidate in ordered],
                existing_normalized=existing_normalized,
                max_per_family=max_per_family,
            )
            duplicate_skipped = summary.dropped_existing_duplicate + summary.dropped_run_duplicate
            family_skipped = summary.dropped_family_cap
            unparseable_skipped = summary.dropped_unparseable

            kept_urls = {normalize_url(c.url) for c in kept}
            first_by_url: dict[str, tuple[str, RawCandidate]] = {}
            # Re-attach provider attribution by normalized URL (dedupe may have
            # dropped the identical object, so object identity is not reliable).
            for provider_name, candidate in ordered:
                normalized = normalize_url(candidate.url)
                if normalized in kept_urls and normalized not in first_by_url:
                    first_by_url[normalized] = (provider_name, candidate)
            kept_with_provider = list(first_by_url.values())

            terms = _author_query_terms(author)
            for provider_name, candidate in kept_with_provider:
                tier = authority_tier_for_url(candidate.url)
                assessment = assess_candidate(
                    url=candidate.url,
                    title=candidate.title,
                    evidence=candidate.evidence,
                    authority_tier=tier,
                    query_terms=terms,
                    existing_normalized=existing_normalized,
                    metadata_fields=candidate.metadata_fields,
                    extra_exact_titles=identity_terms or None,
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
                    provider=provider_name,
                    origin=candidate.origin,
                    evidence=candidate.evidence,
                )
                db.add(row)
                await db.flush()

                if assessment.assessment == ASSESSMENT_AUTO_USABLE:
                    source = _promote_to_source(row, provider_name=provider_name, review_status="auto_approved")
                    db.add(source)
                    await db.flush()
                    row.source_id = source.id
                    row.status = "reviewed"
                    row.review_action = "auto_approved"
                    row.reviewed_at = datetime.now(timezone.utc)
                    created_sources.append(source)

                candidates.append(row)

        run.source_count = len(candidates)
        run.calls = providers_attempted
        run.duration_ms = int((time.monotonic() - started) * 1000)
        run.finished_at = datetime.now(timezone.utc).replace(tzinfo=None)
        run_error: str | None = "; ".join(error for _, _, error in failed if error) or None
        if providers_succeeded == 0:
            run.status = "failed"
        else:
            if any(c.assessment == ASSESSMENT_NEEDS_REVIEW for c in candidates):
                run.status = "review_needed"
            elif providers_failed > 0:
                run.status = "partial"
            else:
                run.status = "completed"
        run.error = run_error

        await db.commit()
        await db.refresh(run)
        return DiscoveryOutcome(
            run=run,
            candidates=candidates,
            created_sources=created_sources,
            error=run_error if providers_succeeded == 0 else None,
            duplicate_skipped=duplicate_skipped,
            family_skipped=family_skipped,
            unparseable_skipped=unparseable_skipped,
            providers_attempted=providers_attempted,
            providers_succeeded=providers_succeeded,
            providers_failed=providers_failed,
        )
    except (ConfigurationError, ProviderError, DiscoveryError, SyvaiError) as exc:
        run.status = "failed"
        run.error = _sanitize_error(exc)
        run.duration_ms = int((time.monotonic() - started) * 1000)
        run.finished_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await db.commit()
        await db.refresh(run)
        logger.warning("syvai discovery run failed: %s", run.error)
        return DiscoveryOutcome(
            run=run,
            error=run.error,
            providers_attempted=providers_attempted,
            providers_succeeded=providers_succeeded,
            providers_failed=providers_failed,
        )
    except Exception as exc:  # noqa: BLE001 - boundary catch for telemetry
        run.status = "failed"
        run.error = _sanitize_error(exc)
        run.duration_ms = int((time.monotonic() - started) * 1000)
        run.finished_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await db.commit()
        await db.refresh(run)
        logger.exception("syvai discovery run crashed: %s", run.error)
        return DiscoveryOutcome(
            run=run,
            error=run.error,
            providers_attempted=providers_attempted,
            providers_succeeded=providers_succeeded,
            providers_failed=providers_failed,
        )


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
    """Per-author discovery and human-action telemetry (0.3A multi-provider).

    Provider success/failure and distinct-family counts are derived at runtime
    from persisted rows (``SourceCandidate`` + ``SyvaiRun``); no schema change.
    """
    result = await db.execute(
        select(SourceCandidate).where(SourceCandidate.author_id == author_id)
    )
    candidates = result.scalars().all()

    by_assessment: dict[str, int] = {}
    by_action: dict[str, int] = {}
    candidates_per_provider: dict[str, int] = {}
    families: set[str] = set()
    for candidate in candidates:
        by_assessment[candidate.assessment] = by_assessment.get(candidate.assessment, 0) + 1
        if candidate.review_action:
            by_action[candidate.review_action] = by_action.get(candidate.review_action, 0) + 1
        provider = candidate.provider or "unknown"
        candidates_per_provider[provider] = candidates_per_provider.get(provider, 0) + 1
        url = candidate.normalized_url or candidate.url
        if url:
            family = registrable_domain(url)
            if family:
                families.add(family)

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

    # Provider success/failure, derived from runs + the candidates they produced.
    runs_result = await db.execute(
        select(SyvaiRun).where(
            SyvaiRun.author_id == author_id,
            SyvaiRun.domain == DOMAIN,
        )
    )
    runs = runs_result.scalars().all()
    providers_attempted = 0
    providers_failed = 0
    for run in runs:
        attempts = run.calls or 1
        providers_attempted += attempts
        run_candidates = [c for c in candidates if c.run_id is not None and c.run_id == run.id]
        present = len({c.provider for c in run_candidates if c.provider})
        providers_failed += max(0, attempts - present)

    return {
        "author_id": str(author_id),
        "candidates_total": len(candidates),
        "candidates_pending": sum(1 for c in candidates if c.status == "pending"),
        "by_assessment": by_assessment,
        "by_review_action": by_action,
        "auto_approved_sources": len(auto_sources),
        "human_actions_per_author": human_actions,
        "formula": "approved + rejected candidates + reviewed AI proposals",
        "providers": sorted(candidates_per_provider),
        "candidates_per_provider": candidates_per_provider,
        "distinct_families": sorted(families),
        "distinct_family_count": len(families),
        "providers_attempted": providers_attempted,
        "providers_succeeded": max(0, providers_attempted - providers_failed),
        "providers_failed": providers_failed,
    }
