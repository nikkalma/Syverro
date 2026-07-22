"""Graph query API — semantic navigation through the knowledge graph.

Endpoints:
    GET /graph/books/{book_id}/related  — find related books via shared graph nodes
    GET /graph/path                     — discover connection paths between any two nodes
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.deps import get_db
from app.models.book import Book
from app.models.author import Author
from app.models.genre import Genre
from app.models.knowledge_node import KnowledgeNode
from app.models.knowledge_relation import KnowledgeRelation
from app.models.book_knowledge_relation import BookKnowledgeRelation
from app.models.book_author import book_authors
from app.models.book_genre import book_genres
from app.graph.similarity import calculate_book_similarity

router = APIRouter(prefix="/graph", tags=["graph-queries"])


# =============================================================================
# RELATED BOOKS
# =============================================================================


@router.get("/books/{book_id}/related")
async def related_books(
    book_id: UUID,
    limit: int = Query(10, ge=1, le=50, description="Max results"),
    db: AsyncSession = Depends(get_db),
):
    """Find books related to the given book through shared graph entities.

    Books are scored by weighted Jaccard similarity across shared
    KnowledgeNodes (themes, motifs, atmospheres, concepts).

    Returns books ranked by similarity score, each with the list of
    shared nodes that explain why they are related.
    """
    book_result = await db.execute(select(Book).where(Book.id == book_id))
    book = book_result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    results = await calculate_book_similarity(db, book_id, limit=limit)
    return results


# =============================================================================
# PATH DISCOVERY
# =============================================================================


@router.get("/path")
async def find_path(
    source_node_id: UUID = Query(..., description="Starting node ID"),
    target_node_id: UUID = Query(..., description="Target node ID"),
    max_depth: int = Query(6, ge=1, le=10, description="Max path length"),
    db: AsyncSession = Depends(get_db),
):
    """Find a connection path between two nodes in the graph.

    Traverses through Books, Authors, Genres, and KnowledgeNodes
    via their relationships (book_authors, book_genres,
    book_knowledge_relations, knowledge_relations).

    Returns the shortest path as a list of node steps.
    """
    if source_node_id == target_node_id:
        return {"found": True, "path": [_resolve_node_sync(db, source_node_id)], "length": 1}

    path = await _bfs_path(db, source_node_id, target_node_id, max_depth)
    if path is None:
        return {"found": False, "path": [], "length": 0}

    # Resolve names for the path
    resolved = []
    for nid, ntype in path:
        info = await _fetch_node_info(db, nid, ntype)
        resolved.append(info)

    return {"found": True, "path": resolved, "length": len(resolved)}


async def _bfs_path(
    db: AsyncSession,
    start_id: UUID,
    target_id: UUID,
    max_depth: int,
) -> list[tuple[UUID, str]] | None:
    """BFS over the graph to find the shortest path between two nodes."""
    from collections import deque

    visited: set[UUID] = {start_id}
    queue: deque = deque()
    queue.append((start_id, "unknown", [(start_id, "unknown")]))

    while queue:
        current_id, current_type, path = queue.popleft()
        if len(path) > max_depth:
            continue

        if current_id == target_id:
            return path

        neighbors = await _get_neighbors(db, current_id, current_type)
        for nid, ntype in neighbors:
            if nid not in visited:
                visited.add(nid)
                queue.append((nid, ntype, path + [(nid, ntype)]))

    return None


async def _get_neighbors(
    db: AsyncSession,
    node_id: UUID,
    node_type: str,
) -> list[tuple[UUID, str]]:
    """Return all neighbor (id, type) pairs reachable from the given node."""
    neighbors: list[tuple[UUID, str]] = []

    if node_type in ("unknown", "book"):
        # Authors via book_authors
        result = await db.execute(
            select(Author.id, Author.name)
            .join(book_authors, book_authors.c.author_id == Author.id)
            .where(book_authors.c.book_id == node_id)
        )
        for row in result.all():
            neighbors.append((row.id, "author"))

        # Genres via book_genres
        result = await db.execute(
            select(Genre.id, Genre.name)
            .join(book_genres, book_genres.c.genre_id == Genre.id)
            .where(book_genres.c.book_id == node_id)
        )
        for row in result.all():
            neighbors.append((row.id, "genre"))

        # KnowledgeNodes via BKR
        result = await db.execute(
            select(KnowledgeNode.id, KnowledgeNode.node_type)
            .join(BookKnowledgeRelation, BookKnowledgeRelation.node_id == KnowledgeNode.id)
            .where(BookKnowledgeRelation.book_id == node_id)
            .where(BookKnowledgeRelation.status == "approved")
        )
        for row in result.all():
            neighbors.append((row.id, row.node_type))

    if node_type == "author":
        # Books by this author
        result = await db.execute(
            select(Book.id, Book.title)
            .join(book_authors, book_authors.c.book_id == Book.id)
            .where(book_authors.c.author_id == node_id)
        )
        for row in result.all():
            neighbors.append((row.id, "book"))

    if node_type == "genre":
        # Books in this genre
        result = await db.execute(
            select(Book.id, Book.title)
            .join(book_genres, book_genres.c.book_id == Book.id)
            .where(book_genres.c.genre_id == node_id)
        )
        for row in result.all():
            neighbors.append((row.id, "book"))

    if node_type not in ("unknown", "book", "author", "genre"):
        # KnowledgeNode: related nodes via KR
        result = await db.execute(
            select(
                KnowledgeRelation.source_node_id,
                KnowledgeRelation.target_node_id,
            ).where(
                (KnowledgeRelation.source_node_id == node_id)
                | (KnowledgeRelation.target_node_id == node_id)
            )
        )
        for row in result.all():
            other_id = row.target_node_id if row.source_node_id == node_id else row.source_node_id
            ntype = await _get_node_type(db, other_id)
            neighbors.append((other_id, ntype))

        # Books connected via BKR
        result = await db.execute(
            select(Book.id, Book.title)
            .join(BookKnowledgeRelation, BookKnowledgeRelation.book_id == Book.id)
            .where(BookKnowledgeRelation.node_id == node_id)
            .where(BookKnowledgeRelation.status == "approved")
        )
        for row in result.all():
            neighbors.append((row.id, "book"))

    return neighbors


async def _get_node_type(db: AsyncSession, node_id: UUID) -> str:
    """Determine the type of a node by probing known tables."""
    result = await db.execute(select(KnowledgeNode.node_type).where(KnowledgeNode.id == node_id))
    row = result.fetchone()
    if row:
        return row[0]

    result = await db.execute(select(Book.id).where(Book.id == node_id))
    if result.fetchone():
        return "book"

    result = await db.execute(select(Author.id).where(Author.id == node_id))
    if result.fetchone():
        return "author"

    result = await db.execute(select(Genre.id).where(Genre.id == node_id))
    if result.fetchone():
        return "genre"

    return "unknown"


async def _fetch_node_info(db: AsyncSession, node_id: UUID, node_type: str) -> dict:
    """Resolve a node to {id, type, name} for path display."""
    if node_type == "book":
        result = await db.execute(select(Book.title).where(Book.id == node_id))
        row = result.fetchone()
        return {"id": str(node_id), "type": "book", "name": row[0] if row else "Unknown Book"}

    if node_type == "author":
        result = await db.execute(select(Author.name).where(Author.id == node_id))
        row = result.fetchone()
        return {"id": str(node_id), "type": "author", "name": row[0] if row else "Unknown Author"}

    if node_type == "genre":
        result = await db.execute(select(Genre.name).where(Genre.id == node_id))
        row = result.fetchone()
        return {"id": str(node_id), "type": "genre", "name": row[0] if row else "Unknown Genre"}

    # KnowledgeNode (any type)
    result = await db.execute(
        select(KnowledgeNode.name, KnowledgeNode.node_type).where(KnowledgeNode.id == node_id)
    )
    row = result.fetchone()
    if row:
        return {"id": str(node_id), "type": row[1], "name": row[0]}

    return {"id": str(node_id), "type": "unknown", "name": "Unknown"}
