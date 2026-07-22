"""Graph expansion logic.

Each function operates on database objects and returns ORM instances.
Serialization is handled separately by serializer.py.
"""
from dataclasses import dataclass, field
from typing import List, Set
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.book import Book
from app.models.author import Author
from app.models.genre import Genre
from app.models.knowledge_node import KnowledgeNode
from app.models.knowledge_relation import KnowledgeRelation
from app.models.book_knowledge_relation import BookKnowledgeRelation
from app.models.book_author import book_authors
from app.models.book_genre import book_genres


@dataclass
class NeighborSet:
    """Container for all directly connected entities of a book."""
    authors: List[Author] = field(default_factory=list)
    genres: List[Genre] = field(default_factory=list)
    knowledge_relations: List[tuple[BookKnowledgeRelation, KnowledgeNode]] = field(default_factory=list)


async def get_book(db: AsyncSession, book_id: UUID) -> Book | None:
    result = await db.execute(select(Book).where(Book.id == book_id))
    return result.scalar_one_or_none()


async def get_direct_neighbors(db: AsyncSession, book_id: UUID) -> NeighborSet:
    """Return all entities directly connected to a book (depth=1)."""
    ns = NeighborSet()

    author_result = await db.execute(
        select(Author).join(book_authors).where(book_authors.c.book_id == book_id)
    )
    ns.authors = list(author_result.scalars().all())

    genre_result = await db.execute(
        select(Genre).join(book_genres).where(book_genres.c.book_id == book_id)
    )
    ns.genres = list(genre_result.scalars().all())

    bkr_result = await db.execute(
        select(BookKnowledgeRelation, KnowledgeNode)
        .join(KnowledgeNode, KnowledgeNode.id == BookKnowledgeRelation.node_id)
        .where(BookKnowledgeRelation.book_id == book_id)
        .where(BookKnowledgeRelation.status == "approved")
    )
    ns.knowledge_relations = list(bkr_result.all())

    return ns


async def get_knowledge_relations_for_nodes(
    db: AsyncSession, node_ids: Set[UUID]
) -> List[KnowledgeRelation]:
    """Return all KnowledgeRelations where either side is in node_ids."""
    if not node_ids:
        return []
    result = await db.execute(
        select(KnowledgeRelation).where(
            (KnowledgeRelation.source_node_id.in_(node_ids))
            | (KnowledgeRelation.target_node_id.in_(node_ids))
        )
    )
    return list(result.scalars().all())


async def get_knowledge_nodes_by_ids(
    db: AsyncSession, node_ids: Set[UUID]
) -> List[KnowledgeNode]:
    """Bulk-fetch KnowledgeNodes by ID."""
    if not node_ids:
        return []
    result = await db.execute(
        select(KnowledgeNode).where(KnowledgeNode.id.in_(node_ids))
    )
    return list(result.scalars().all())
