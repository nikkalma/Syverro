"""Grounded research input for the timeline domain.

The LLM is never treated as the factual source. For 0.1A the research input is
the author's existing trusted Sapphire ``Source`` records plus controlled
author identity data. There is no arbitrary open-web crawling in this slice;
``timeline_research`` is the single replaceable retrieval boundary.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.author import Author
from app.models.author_citizenship import AuthorCitizenship
from app.models.author_knowledge_relation import AuthorKnowledgeRelation
from app.models.author_quote import AuthorQuote
from app.models.author_residence import AuthorResidence
from app.models.source import Source
from app.models.timeline_event import TimelineEvent
from app.syvai.validators import ExistingEvent


def _to_research_source(source: Source) -> dict:
    return {
        "id": str(source.id),
        "title": source.title,
        "source_type": source.source_type,
        "url": source.url,
        "citation": source.citation,
        "language": source.language,
        "reliability_score": source.reliability_score,
        "source_origin": source.source_origin,
    }


async def collect_author_source_ids(db: AsyncSession, author_id: str) -> set[str]:
    """Collect every Source id referenced by the author's editorial records.

    Mirrors the Studio ``GET /admin/authors/{id}/sources`` aggregation.
    """
    source_ids: set[str] = set()
    queries = [
        select(TimelineEvent.source_id).where(TimelineEvent.author_id == author_id),
        select(AuthorQuote.source_id).where(AuthorQuote.author_id == author_id),
        select(AuthorCitizenship.source_id).where(AuthorCitizenship.author_id == author_id),
        select(AuthorResidence.source_id).where(AuthorResidence.author_id == author_id),
        select(AuthorKnowledgeRelation.source_id).where(AuthorKnowledgeRelation.author_id == author_id),
    ]
    for query in queries:
        result = await db.execute(query)
        source_ids.update(str(row[0]) for row in result if row[0])
    return source_ids


async def load_trusted_sources(db: AsyncSession, author: Author) -> list[dict]:
    """Load the author's trusted sources as research input records."""
    source_ids = await collect_author_source_ids(db, author.id)
    if not source_ids:
        return []
    result = await db.execute(
        select(Source).where(Source.id.in_(list(source_ids))).order_by(Source.title)
    )
    return [_to_research_source(source) for source in result.scalars().all()]


async def load_existing_events(db: AsyncSession, author: Author) -> list[ExistingEvent]:
    """Load the author's curated timeline as comparison data for validation."""
    result = await db.execute(
        select(TimelineEvent)
        .where(TimelineEvent.author_id == author.id)
        .order_by(TimelineEvent.sort_order, TimelineEvent.date_value)
    )
    return [
        ExistingEvent(
            id=str(event.id),
            event_type=event.event_type,
            date_value=event.date_value,
            date_precision=event.date_precision,
            label=event.label,
        )
        for event in result.scalars().all()
    ]


def build_research_input(author: Author, sources: list[dict]) -> dict:
    """Build the controlled research input dict passed to the prompt."""
    return {
        "author": {
            "id": str(author.id),
            "name": author.display_name or author.name,
            "birth_date": author.birth_date,
            "birth_date_precision": author.birth_date_precision,
            "death_date": author.death_date,
            "death_date_precision": author.death_date_precision,
            "birth_place": author.birth_place,
            "death_place": author.death_place,
        },
        "sources": sources,
    }
