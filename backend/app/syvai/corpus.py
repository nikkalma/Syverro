"""Author-specific curated research corpus and Fill preflight semantics."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.source import Source
from app.models.source_candidate import SourceCandidate
from app.syvai.discovery.verification import CONTENT_INSPECTOR_VERSION, IDENTITY_VERIFIER_VERSION
from app.syvai.discovery.reinspection import reinspection_required

AUTO_VERIFIED = "AUTO_VERIFIED"
AUTO_VERIFIED_LEGACY = "AUTO_VERIFIED_LEGACY"
HUMAN_VERIFIED = "HUMAN_VERIFIED"
HUMAN_VERIFIED_LEGACY = "HUMAN_VERIFIED_LEGACY"
NEEDS_REVIEW = "NEEDS_REVIEW"
REJECTED = "REJECTED"

DOMAIN_CAPABILITIES = {
    "identity": ("IDENTITY",),
    "biography": ("BIOGRAPHY",),
    "literary_context": ("LITERARY_CONTEXT",),
    "timeline": ("TIMELINE",),
    "bibliography": ("BIBLIOGRAPHY",),
}


def corpus_state(candidate: SourceCandidate) -> str:
    if candidate.review_action == "rejected" or candidate.assessment == "rejected":
        return REJECTED
    if candidate.review_action == "approved" and candidate.source_id:
        return HUMAN_VERIFIED
    if candidate.review_action == "auto_approved" and candidate.source_id:
        verification = candidate.identity_verification or {}
        return AUTO_VERIFIED if verification.get("state") == "verified" else AUTO_VERIFIED_LEGACY
    return NEEDS_REVIEW


def _source_dict(source: Source, *, state: str, candidate: SourceCandidate | None = None) -> dict:
    stale = reinspection_required(source)
    return {
        "id": str(source.id), "title": source.title, "url": source.url,
        "source_type": source.source_type, "citation": source.citation,
        "language": source.language, "reliability_score": source.reliability_score,
        "trust_state": state,
        # Fail closed: obsolete capability semantics cannot authorize Fill.
        "content_capabilities": [] if stale else list(source.content_capabilities or []),
        "stored_content_capabilities": list(source.content_capabilities or []),
        "capability_evidence": source.capability_evidence or {},
        "content_inspector_version": source.content_inspector_version,
        "current_inspector_version": CONTENT_INSPECTOR_VERSION,
        "reinspection_required": stale,
        "identity_verification": candidate.identity_verification if candidate else None,
        "candidate_id": str(candidate.id) if candidate else None,
    }


@dataclass
class CorpusSnapshot:
    author_id: str
    verified_sources: list[dict]
    candidates: list[dict]
    capability_coverage: dict[str, list[str]]
    needs_review_count: int
    rejected_count: int
    legacy_auto_count: int

    def sources_for_domain(self, domain: str) -> list[dict]:
        required = set(DOMAIN_CAPABILITIES.get(domain, ()))
        return [source for source in self.verified_sources if required & set(source["content_capabilities"])]

    def unavailable_reason(self, domain: str) -> str | None:
        if not self.verified_sources:
            return "NO_VERIFIED_SOURCES"
        if not self.sources_for_domain(domain):
            return f"{domain.upper()}_UNSUPPORTED"
        return None

    def manifest(self, domain: str, selected: list[dict]) -> dict:
        reason = self.unavailable_reason(domain)
        return {
            "version": "corpus_manifest_v1",
            "author_id": self.author_id,
            "requested_domain": domain,
            "permitted_domain": domain if reason is None else None,
            "skipped_domain": domain if reason else None,
            "routing_reason": "CORPUS_DOMAIN_READY" if reason is None else f"INSUFFICIENT_CORPUS:{reason}",
            "eligible_sources": [{
                "source_id": source["id"],
                "trust_state": source["trust_state"],
                "capabilities_used": sorted(set(source["content_capabilities"]) & set(DOMAIN_CAPABILITIES.get(domain, ()))),
            } for source in selected],
            "excluded": {
                "needs_review": self.needs_review_count,
                "rejected": self.rejected_count,
                "legacy_auto_unverified": self.legacy_auto_count,
            },
            "router_version": "corpus_router_v1",
            "identity_verifier_version": IDENTITY_VERIFIER_VERSION,
            "content_inspector_version": CONTENT_INSPECTOR_VERSION,
            "provider_called": False,
        }


async def build_author_corpus(db: AsyncSession, author_id) -> CorpusSnapshot:
    result = await db.execute(
        select(SourceCandidate, Source)
        .outerjoin(Source, Source.id == SourceCandidate.source_id)
        .where(SourceCandidate.author_id == author_id)
        .order_by(SourceCandidate.created_at)
    )
    verified, candidates = [], []
    candidate_source_ids: set[str] = set()
    needs_review = rejected = legacy_auto = 0
    for candidate, source in result.all():
        state = corpus_state(candidate)
        if candidate.source_id:
            candidate_source_ids.add(str(candidate.source_id))
        candidates.append({
            "candidate_id": str(candidate.id), "source_id": str(candidate.source_id) if candidate.source_id else None,
            "corpus_state": state, "identity_verification": candidate.identity_verification,
            "content_capabilities": candidate.content_capabilities or [],
        })
        if state in (AUTO_VERIFIED, HUMAN_VERIFIED) and source is not None:
            verified.append(_source_dict(source, state=state, candidate=candidate))
        elif state == NEEDS_REVIEW:
            needs_review += 1
        elif state == REJECTED:
            rejected += 1
        elif state == AUTO_VERIFIED_LEGACY:
            legacy_auto += 1

    # Canonical-record and manual links encode a historical curator decision.
    # They are compatible human-trusted documents, but receive no capability
    # merely because they were linked; only inspected content can route Fill.
    from app.syvai.timeline_research import collect_author_source_ids
    legacy_ids = await collect_author_source_ids(db, author_id)
    legacy_ids -= candidate_source_ids
    if legacy_ids:
        legacy_result = await db.execute(select(Source).where(Source.id.in_(legacy_ids)))
        verified.extend(
            _source_dict(source, state=HUMAN_VERIFIED_LEGACY)
            for source in legacy_result.scalars().all()
        )

    coverage: dict[str, list[str]] = {}
    for source in verified:
        for capability in source["content_capabilities"]:
            coverage.setdefault(capability, []).append(source["id"])
    return CorpusSnapshot(str(author_id), verified, candidates, coverage, needs_review, rejected, legacy_auto)


def corpus_summary(snapshot: CorpusSnapshot) -> dict:
    domains = {}
    for domain in DOMAIN_CAPABILITIES:
        reason = snapshot.unavailable_reason(domain)
        domains[domain] = {"available": reason is None, "reason": reason}
    return {
        "author_id": snapshot.author_id,
        "verified_sources": snapshot.verified_sources,
        "needs_review_count": snapshot.needs_review_count,
        "rejected_count": snapshot.rejected_count,
        "legacy_auto_unverified_count": snapshot.legacy_auto_count,
        "legacy_auto_report": [
            {
                **candidate,
                "strict_re_evaluation": "UNVERIFIABLE_FROM_LEGACY_ROW"
                if not candidate.get("identity_verification") else "PROVENANCE_AVAILABLE",
            }
            for candidate in snapshot.candidates
            if candidate["corpus_state"] == AUTO_VERIFIED_LEGACY
        ],
        "capability_coverage": snapshot.capability_coverage,
        "domains": domains,
    }
