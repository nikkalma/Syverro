"""Graph-based similarity scoring between books.

Uses simple overlap-based scoring — no machine learning, no AI.

Each function operates on raw database data and returns numeric scores.
Callers (API routes) convert scores into response formats.
"""
from typing import List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.book import Book
from app.models.knowledge_node import KnowledgeNode
from app.models.book_knowledge_relation import BookKnowledgeRelation
from app.models.book_author import book_authors
from app.models.book_genre import book_genres


async def get_book_node_map(db: AsyncSession, book_id: UUID) -> dict[str, set[UUID]]:
    """Return all KnowledgeNode IDs connected to a book, grouped by node_type."""
    result = await db.execute(
        select(KnowledgeNode.node_type, KnowledgeNode.id)
        .join(BookKnowledgeRelation, BookKnowledgeRelation.node_id == KnowledgeNode.id)
        .where(BookKnowledgeRelation.book_id == book_id)
        .where(BookKnowledgeRelation.status == "approved")
    )
    node_map: dict[str, set[UUID]] = {}
    for node_type, node_id in result.all():
        node_map.setdefault(node_type, set()).add(node_id)
    return node_map


def jaccard_similarity(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


TYPE_WEIGHTS = {
    "theme": 1.0,
    "motif": 0.8,
    "atmosphere": 0.7,
    "concept": 0.9,
}


def score_from_node_maps(
    map_a: dict[str, set[UUID]],
    map_b: dict[str, set[UUID]],
) -> float:
    """Weighted aggregate similarity from two pre-computed node maps."""
    all_types = set(map_a.keys()) | set(map_b.keys())
    total_weight = 0.0
    weighted_sum = 0.0
    for t in all_types:
        w = TYPE_WEIGHTS.get(t, 0.5)
        weighted_sum += jaccard_similarity(map_a.get(t, set()), map_b.get(t, set())) * w
        total_weight += w
    return weighted_sum / total_weight if total_weight > 0 else 0.0


async def calculate_book_similarity(
    db: AsyncSession,
    book_id: UUID,
    limit: int = 10,
) -> list[dict]:
    """Rank all books that share graph nodes with the given book.

    Each result entry:
        {
            "book_id": str,
            "title": str,
            "author": str,
            "score": float,
            "shared_nodes": [{"id": str, "name": str, "type": str, "relation_type": str}]
        }
    """
    my_node_map = await get_book_node_map(db, book_id)
    all_my_ids: set[UUID] = set()
    for ids in my_node_map.values():
        all_my_ids.update(ids)

    if not all_my_ids:
        return []

    shared_result = await db.execute(
        select(
            BookKnowledgeRelation.book_id,
            KnowledgeNode.id,
            KnowledgeNode.name,
            KnowledgeNode.node_type,
            BookKnowledgeRelation.relation_type,
            Book.title,
            Book.author,
        )
        .join(KnowledgeNode, KnowledgeNode.id == BookKnowledgeRelation.node_id)
        .join(Book, Book.id == BookKnowledgeRelation.book_id)
        .where(BookKnowledgeRelation.node_id.in_(all_my_ids))
        .where(BookKnowledgeRelation.book_id != book_id)
        .where(BookKnowledgeRelation.status == "approved")
    )

    # Aggregate shared nodes per candidate book
    candidates: dict[UUID, dict] = {}
    for row in shared_result.all():
        bid = row.book_id
        if bid not in candidates:
            candidates[bid] = {
                "book_id": str(bid),
                "title": row.title,
                "author": row.author,
                "shared_nodes": [],
                "shared_ids": set(),
            }
        nid = row.id
        if nid not in candidates[bid]["shared_ids"]:
            candidates[bid]["shared_ids"].add(nid)
            candidates[bid]["shared_nodes"].append({
                "id": str(nid),
                "name": row.name,
                "type": row.node_type,
                "relation_type": row.relation_type,
            })

    # Compute scores from node maps
    scored = []
    for bid, data in candidates.items():
        other_map = await get_book_node_map(db, bid)
        score = score_from_node_maps(my_node_map, other_map)
        if score > 0:
            scored.append({
                "book_id": data["book_id"],
                "title": data["title"],
                "author": data["author"],
                "score": round(score, 4),
                "shared_nodes": data["shared_nodes"],
            })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]
