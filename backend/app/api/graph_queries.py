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
from app.models.book_author import book_authors
from app.graph.similarity import calculate_book_similarity
from app.core.public_visibility import public_author_clause, public_book_clause

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
    book_result = await db.execute(
        select(Book).where(Book.id == book_id, public_book_clause())
    )
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

    start_type = await _get_node_type(db, start_id)
    target_type = await _get_node_type(db, target_id)
    if start_type == "unknown" or target_type == "unknown":
        return None

    visited: set[UUID] = {start_id}
    queue: deque = deque()
    queue.append((start_id, start_type, [(start_id, start_type)]))

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
            .where(book_authors.c.book_id == node_id, public_author_clause())
        )
        for row in result.all():
            neighbors.append((row.id, "author"))

        # Taxonomy and genre records are structured metadata, not public graph
        # vertices until dedicated public entity pages exist for them.

    if node_type == "author":
        # Books by this author
        result = await db.execute(
            select(Book.id, Book.title)
            .join(book_authors, book_authors.c.book_id == Book.id)
            .where(book_authors.c.author_id == node_id, public_book_clause())
        )
        for row in result.all():
            neighbors.append((row.id, "book"))

    return neighbors


async def _get_node_type(db: AsyncSession, node_id: UUID) -> str:
    """Determine the type of a node by probing known tables."""
    result = await db.execute(select(Book.id).where(Book.id == node_id, public_book_clause()))
    if result.fetchone():
        return "book"

    result = await db.execute(select(Author.id).where(Author.id == node_id, public_author_clause()))
    if result.fetchone():
        return "author"

    return "unknown"


async def _fetch_node_info(db: AsyncSession, node_id: UUID, node_type: str) -> dict:
    """Resolve a node to {id, type, name} for path display."""
    if node_type == "book":
        result = await db.execute(select(Book.title).where(Book.id == node_id, public_book_clause()))
        row = result.fetchone()
        return {"id": str(node_id), "type": "book", "name": row[0] if row else "Unknown Book"}

    if node_type == "author":
        result = await db.execute(select(Author.name).where(Author.id == node_id, public_author_clause()))
        row = result.fetchone()
        return {"id": str(node_id), "type": "author", "name": row[0] if row else "Unknown Author"}

    return {"id": str(node_id), "type": "unknown", "name": "Unknown"}
