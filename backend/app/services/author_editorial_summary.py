"""Read-only, page-level editorial projection for the Studio Author list."""

from __future__ import annotations

from collections import defaultdict

from sqlalchemy import case, func, select, union_all

from app.models.ai_proposal import AIProposal
from app.models.author import Author
from app.models.author_citizenship import AuthorCitizenship
from app.models.author_knowledge_relation import AuthorKnowledgeRelation
from app.models.author_publication import AuthorPublication
from app.models.author_publication_author import AuthorPublicationAuthor
from app.models.author_quote import AuthorQuote
from app.models.author_residence import AuthorResidence
from app.models.book_author import book_authors
from app.models.source import Source
from app.models.source_candidate import SourceCandidate
from app.models.syvai_run import SyvaiRun
from app.models.timeline_event import TimelineEvent
from app.services.author_publication import author_golden_readiness
from app.syvai.corpus import AUTO_VERIFIED, HUMAN_VERIFIED, NEEDS_REVIEW, REJECTED, corpus_state
from app.syvai.discovery.reinspection import reinspection_required
from app.syvai.validators import REVIEW_BANDS_NEEDING_HUMAN


BLOCKED_RUN_PREFIXES = (
    "INSUFFICIENT_CORPUS",
    "NO_TRUSTED_SOURCE",
    "SOURCE_POOL_MISSING",
)


def _known_run_reason(run) -> str | None:
    for value in (run.routing_reason, run.error):
        if value and value.startswith(BLOCKED_RUN_PREFIXES):
            return value
    return None


async def author_editorial_summaries(db, authors: list[Author]) -> dict[str, dict]:
    """Build summaries with five bounded queries, independent of page size.

    Corpus eligibility deliberately reuses ``corpus_state`` and
    ``reinspection_required`` rather than weakening Curated Corpus semantics
    into a raw Source-row count.
    """
    if not authors:
        return {}

    author_ids = [author.id for author in authors]
    author_keys = {str(author.id) for author in authors}

    book_counts = (
        select(book_authors.c.author_id.label("author_id"), func.count().label("count"))
        .where(book_authors.c.author_id.in_(author_ids))
        .group_by(book_authors.c.author_id)
        .subquery()
    )
    publication_counts = (
        select(AuthorPublicationAuthor.author_id.label("author_id"), func.count().label("count"))
        .where(AuthorPublicationAuthor.author_id.in_(author_ids))
        .group_by(AuthorPublicationAuthor.author_id)
        .subquery()
    )
    count_rows = await db.execute(
        select(
            Author.id,
            func.coalesce(book_counts.c.count, 0),
            func.coalesce(publication_counts.c.count, 0),
        )
        .outerjoin(book_counts, book_counts.c.author_id == Author.id)
        .outerjoin(publication_counts, publication_counts.c.author_id == Author.id)
        .where(Author.id.in_(author_ids))
    )
    counts = {str(author_id): (int(book_count), int(publication_count)) for author_id, book_count, publication_count in count_rows.all()}

    source_rows = await db.execute(
        select(SourceCandidate, Source)
        .outerjoin(Source, Source.id == SourceCandidate.source_id)
        .where(SourceCandidate.author_id.in_(author_ids))
    )
    source_stats = defaultdict(lambda: {"verified": 0, "pending": 0, "rejected": 0})
    candidate_source_ids: dict[str, set[str]] = defaultdict(set)
    for candidate, source in source_rows.all():
        stats = source_stats[str(candidate.author_id)]
        if candidate.source_id:
            candidate_source_ids[str(candidate.author_id)].add(str(candidate.source_id))
        state = corpus_state(candidate)
        if state == NEEDS_REVIEW:
            stats["pending"] += 1
        elif state == REJECTED:
            stats["rejected"] += 1
        elif (
            state in (AUTO_VERIFIED, HUMAN_VERIFIED)
            and source is not None
            and not reinspection_required(source)
            and bool(source.content_capabilities)
        ):
            stats["verified"] += 1

    legacy_refs = union_all(
        select(TimelineEvent.author_id.label("author_id"), TimelineEvent.source_id.label("source_id")),
        select(AuthorQuote.author_id, AuthorQuote.source_id),
        select(AuthorCitizenship.author_id, AuthorCitizenship.source_id),
        select(AuthorResidence.author_id, AuthorResidence.source_id),
        select(AuthorKnowledgeRelation.author_id, AuthorKnowledgeRelation.source_id),
        select(AuthorPublicationAuthor.author_id, AuthorPublication.source_id)
        .join(
            AuthorPublication,
            AuthorPublication.id == AuthorPublicationAuthor.publication_id,
        ),
    ).subquery()
    legacy_rows = await db.execute(
        select(legacy_refs.c.author_id, Source)
        .join(Source, Source.id == legacy_refs.c.source_id)
        .where(legacy_refs.c.author_id.in_(author_ids))
        .distinct(legacy_refs.c.author_id, Source.id)
    )
    for author_id, source in legacy_rows.all():
        key = str(author_id)
        if str(source.id) in candidate_source_ids[key]:
            continue
        if not reinspection_required(source) and bool(source.content_capabilities):
            source_stats[key]["verified"] += 1

    pending_human = case(
        (
            AIProposal.review_band.in_(REVIEW_BANDS_NEEDING_HUMAN)
            & AIProposal.status.in_(("proposed", "under_review")),
            1,
        ),
        else_=0,
    )
    accepted_unapplied = case(
        (AIProposal.status == "accepted", case((AIProposal.applied_at.is_(None), 1), else_=0)),
        else_=0,
    )
    applied = case((AIProposal.applied_at.is_not(None), 1), else_=0)
    proposal_rows = await db.execute(
        select(
            AIProposal.entity_id,
            func.sum(pending_human),
            func.sum(accepted_unapplied),
            func.sum(applied),
        )
        .where(AIProposal.entity_type == "author", AIProposal.entity_id.in_(author_keys))
        .group_by(AIProposal.entity_id)
    )
    proposal_stats = {
        entity_id: (int(pending or 0), int(unapplied or 0), int(applied_count or 0))
        for entity_id, pending, unapplied, applied_count in proposal_rows.all()
    }

    ranked_runs = (
        select(
            SyvaiRun.id,
            SyvaiRun.author_id,
            SyvaiRun.status,
            SyvaiRun.domain,
            SyvaiRun.routing_reason,
            SyvaiRun.error,
            SyvaiRun.created_at,
            SyvaiRun.finished_at,
            func.row_number().over(
                partition_by=SyvaiRun.author_id,
                order_by=(SyvaiRun.created_at.desc(), SyvaiRun.id.desc()),
            ).label("rank"),
        )
        .where(SyvaiRun.author_id.in_(author_ids))
        .subquery()
    )
    run_rows = await db.execute(select(ranked_runs).where(ranked_runs.c.rank == 1))
    runs = {str(row.author_id): row for row in run_rows.all()}

    summaries: dict[str, dict] = {}
    for author in authors:
        key = str(author.id)
        book_count, publications_count = counts.get(key, (0, 0))
        source = source_stats[key]
        pending, unapplied, applied_count = proposal_stats.get(key, (0, 0, 0))
        run = runs.get(key)
        readiness = author_golden_readiness(author, publications_count=publications_count)
        summaries[key] = {
            "book_count": book_count,
            "publications_count": publications_count,
            "metadata_status": author.metadata_status or "draft",
            "verified_source_count": source["verified"],
            "pending_source_candidate_count": source["pending"],
            "rejected_source_candidate_count": source["rejected"],
            "corpus_ready": source["verified"] > 0,
            "pending_proposal_count": pending,
            "accepted_unapplied_proposal_count": unapplied,
            "applied_proposal_count": applied_count,
            "last_syvai_run_at": (run.finished_at or run.created_at) if run else None,
            "last_syvai_run_status": run.status if run else None,
            "last_syvai_run_domain": run.domain if run else None,
            "last_syvai_run_reason": _known_run_reason(run) if run else None,
            "publication_ready": readiness["ready"],
            "missing_required_fields": readiness["missing_required_fields"],
        }
    return summaries
