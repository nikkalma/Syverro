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
from app.core.public_visibility import public_author_clause, public_book_clause


@dataclass
class NeighborSet:
    """Container for all directly connected entities of a book."""
    authors: List[Author] = field(default_factory=list)
    genres: List[Genre] = field(default_factory=list)
    knowledge_relations: List[tuple[BookKnowledgeRelation, KnowledgeNode]] = field(default_factory=list)


async def get_book(db: AsyncSession, book_id: UUID) -> Book | None:
    result = await db.execute(
        select(Book).where(Book.id == book_id, public_book_clause())
    )
    return result.scalar_one_or_none()


async def get_direct_neighbors(db: AsyncSession, book_id: UUID) -> NeighborSet:
    """Return all entities directly connected to a book (depth=1)."""
    ns = NeighborSet()

    author_result = await db.execute(
        select(Author)
        .join(book_authors)
        .where(book_authors.c.book_id == book_id, public_author_clause())
    )
    ns.authors = list(author_result.scalars().all())

    # Genres and KnowledgeNodes do not have public entity pages yet. They remain
    # structured book metadata, but are not navigable public graph vertices.
    ns.genres = []
    ns.knowledge_relations = []

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
