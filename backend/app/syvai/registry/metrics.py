"""SyvAI 0.3E — runtime-derived Beta routing metrics.

Deliberately schema-free: everything here is computed at report time from
persisted rows (``syvai_runs``, ``ai_proposals``, ``ai_proposal_sources``,
``sources``) plus the pure routing result. No new columns, no dashboard.

Counts

  proposals.received            — proposals produced for the author
  proposals.auto_approved       — review band ``auto_approved``
  proposals.human_review        — bands that require a human decision
  proposals.grounded            — at least one verified snippet persisted
  proposals.independently_corroborated — >=2 independent grounded families

Source/attempt telemetry is delegated to the existing
``discovery_metrics`` (candidates, providers attempted/succeeded/failed,
human actions), so one code path drives the number everywhere.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.syvai.corroboration import corroborate_sources
from app.syvai.registry.geography import geographic_context
from app.syvai.registry.routing import author_research_domains, route_source_pool


def _band_counts(proposals) -> dict[str, int]:
    counts = {"received": len(proposals), "auto_approved": 0, "human_review": 0}
    for proposal in proposals:
        band = proposal.review_band
        if band == "auto_approved":
            counts["auto_approved"] += 1
        elif band in {"quality_review", "policy_review"}:
            counts["human_review"] += 1
    return counts


def _grounding_counts(proposals, sources_by_id) -> dict[str, int]:
    grounded = 0
    corroborated = 0
    for proposal in proposals:
        links = [link for link in proposal.sources]
        grounded_links = [
            link for link in links
            if link.verification_state == "direct_grounded"
        ]
        if grounded_links:
            grounded += 1
        source_rows = [sources_by_id.get(link.source_id) for link in grounded_links]
        corroboration = corroborate_sources(source_rows, [True] * len(source_rows))
        if corroboration.independent_grounded_source_count >= 2:
            corroborated += 1
    return {"grounded": grounded, "independently_corroborated": corroborated}


async def beta_routing_metrics(
    db: AsyncSession,
    author,
    *,
    citizenships=None,
    residences=None,
) -> dict:
    """Compute the Beta routing + proposal metrics for one author (read-only).

    Models are imported lazily so importing the registry never requires a
    configured database.
    """
    from app.models.ai_proposal import AIProposal
    from app.models.source import Source

    geo = geographic_context(author, citizenships=citizenships, residences=residences)

    domains = author_research_domains(author)
    pools = {
        domain: route_source_pool(geo, domain).summary()
        for domain in domains
    }

    proposals_result = await db.execute(
        select(AIProposal).where(AIProposal.entity_id == str(author.id))
    )
    proposals = proposals_result.scalars().all()

    link_ids = {
        link.source_id
        for proposal in proposals
        for link in (proposal.sources or [])
    }
    sources_by_id = {}
    if link_ids:
        sources_result = await db.execute(
            select(Source).where(Source.id.in_(list(link_ids)))
        )
        sources_by_id = {source.id: source for source in sources_result.scalars().all()}

    bands = _band_counts(proposals)
    grounding = _grounding_counts(proposals, sources_by_id)

    return {
        "author_id": str(author.id),
        "geographic_context": list(geo),
        "research_domains": list(domains),
        "pools": pools,
        "proposals": {**bands, **grounding},
    }
