"""Main graph service entry point.

Orchestrates traversal and serialization to produce the standard
{ nodes: [], relations: [] } graph format.

API routes should call this service and not contain graph logic directly.
"""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.graph.traversal import (
    get_book,
    get_direct_neighbors,
    get_knowledge_relations_for_nodes,
    get_knowledge_nodes_by_ids,
)
from app.graph.serializer import (
    serialize_book,
    serialize_author,
    serialize_genre,
    serialize_knowledge_node,
    relation,
)

MAX_DEPTH = 2


async def get_book_graph(
    db: AsyncSession,
    book_id: UUID,
    depth: int = 1,
) -> dict | None:
    """Return the graph centered on a book at the specified depth.

    Args:
        db: database session
        book_id: UUID of the book
        depth: 0 = book only, 1 = direct neighbors, 2 = neighbors + their relations

    Returns:
        { "nodes": [...], "relations": [...] } or None if book not found.

    The service does not raise HTTP exceptions. Callers (API routes) handle 404.
    """
    depth = min(depth, MAX_DEPTH)

    book = await get_book(db, book_id)
    if book is None:
        return None

    nodes: dict[str, dict] = {}
    relations_list: list[dict] = []

    _add_node(nodes, serialize_book(book))

    if depth >= 1:
        neighbors = await get_direct_neighbors(db, book.id)

        for author in neighbors.authors:
            _add_node(nodes, serialize_author(author))
            relations_list.append(relation(str(author.id), str(book.id), "wrote"))

        for genre in neighbors.genres:
            _add_node(nodes, serialize_genre(genre))
            relations_list.append(relation(str(book.id), str(genre.id), "belongs_to"))

        book_node_ids = set()
        for bkr, kn in neighbors.knowledge_relations:
            _add_node(nodes, serialize_knowledge_node(kn))
            relations_list.append(relation(str(book.id), str(kn.id), bkr.relation_type))
            book_node_ids.add(kn.id)

        if depth >= 2 and book_node_ids:
            await _expand_knowledge_relations(db, nodes, relations_list, book_node_ids)

    return {
        "nodes": list(nodes.values()),
        "relations": relations_list,
    }


async def _expand_knowledge_relations(
    db: AsyncSession,
    nodes: dict[str, dict],
    relations_list: list[dict],
    book_node_ids: set[UUID],
) -> None:
    """Follow knowledge_relations edges from the book's connected nodes (depth=2)."""
    kr_rows = await get_knowledge_relations_for_nodes(db, book_node_ids)

    related_ids = set()
    for kr in kr_rows:
        related_ids.add(kr.source_node_id)
        related_ids.add(kr.target_node_id)
    new_ids = related_ids - book_node_ids

    if new_ids:
        kn_rows = await get_knowledge_nodes_by_ids(db, new_ids)
        for kn in kn_rows:
            _add_node(nodes, serialize_knowledge_node(kn))

    for kr in kr_rows:
        relations_list.append(relation(str(kr.source_node_id), str(kr.target_node_id), kr.relation_type))


def _add_node(nodes: dict[str, dict], node: dict) -> None:
    """Add a node dict keyed by id, skipping duplicates."""
    nid = node["id"]
    if nid not in nodes:
        nodes[nid] = node
