from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.core.deps import get_db
from app.models.knowledge_node import KnowledgeNode
from app.models.knowledge_relation import KnowledgeRelation
from app.models.book_knowledge_relation import BookKnowledgeRelation
from app.schemas.taxonomy import (
    KnowledgeNodeResponse, KnowledgeNodeTree,
    KnowledgeRelationResponse,
    BookKnowledgeRelationResponse,
    BookKnowledgeResponse,
)
from typing import Optional, List
from uuid import UUID

router = APIRouter(prefix="/taxonomy", tags=["taxonomy"])


# ============================================================
# PUBLIC: Knowledge Nodes
# ============================================================

@router.get("/nodes", response_model=List[KnowledgeNodeResponse])
async def list_nodes(
    node_type: Optional[str] = Query(None, description="Filter by node type"),
    search: Optional[str] = Query(None, description="Search by name"),
    parent_id: Optional[UUID] = Query(None, description="Filter by parent"),
    db: AsyncSession = Depends(get_db),
):
    query = select(KnowledgeNode)

    if node_type:
        query = query.where(KnowledgeNode.node_type == node_type)
    if search:
        query = query.where(KnowledgeNode.name.ilike(f"%{search}%"))
    if parent_id is not None:
        query = query.where(KnowledgeNode.parent_id == parent_id)
    elif parent_id is None and node_type and not search:
        query = query.where(KnowledgeNode.parent_id.is_(None))

    query = query.order_by(KnowledgeNode.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/nodes/{node_id}", response_model=KnowledgeNodeResponse)
async def get_node(node_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(KnowledgeNode).where(KnowledgeNode.id == node_id))
    node = result.scalar_one_or_none()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.get("/nodes/{node_id}/relations", response_model=List[KnowledgeRelationResponse])
async def get_node_relations(node_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(KnowledgeRelation).where(
            or_(
                KnowledgeRelation.source_node_id == node_id,
                KnowledgeRelation.target_node_id == node_id,
            )
        )
    )
    relations = result.scalars().all()

    # Enrich with node names
    node_ids = set()
    for r in relations:
        node_ids.add(r.source_node_id)
        node_ids.add(r.target_node_id)

    if node_ids:
        nodes_result = await db.execute(
            select(KnowledgeNode).where(KnowledgeNode.id.in_(node_ids))
        )
        nodes = {n.id: n for n in nodes_result.scalars().all()}
    else:
        nodes = {}

    response = []
    for r in relations:
        source = nodes.get(r.source_node_id)
        target = nodes.get(r.target_node_id)
        response.append(KnowledgeRelationResponse(
            id=r.id,
            source_node_id=r.source_node_id,
            target_node_id=r.target_node_id,
            relation_type=r.relation_type,
            weight=r.weight,
            metadata=r.metadata,
            created_at=r.created_at,
            source_name=source.name if source else None,
            source_type=source.node_type if source else None,
            target_name=target.name if target else None,
            target_type=target.node_type if target else None,
        ))

    return response


# ============================================================
# PUBLIC: Book Knowledge
# ============================================================

@router.get("/books/{book_id}/nodes", response_model=BookKnowledgeResponse)
async def get_book_knowledge(book_id: UUID, db: AsyncSession = Depends(get_db)):
    # Get book title
    from app.models.book import Book
    book_result = await db.execute(select(Book).where(Book.id == book_id))
    book = book_result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Get approved relations
    result = await db.execute(
        select(BookKnowledgeRelation).where(
            BookKnowledgeRelation.book_id == book_id,
            BookKnowledgeRelation.status == "approved",
        )
    )
    relations = result.scalars().all()

    # Enrich with node names
    node_ids = [r.node_id for r in relations]
    if node_ids:
        nodes_result = await db.execute(
            select(KnowledgeNode).where(KnowledgeNode.id.in_(node_ids))
        )
        nodes = {n.id: n for n in nodes_result.scalars().all()}
    else:
        nodes = {}

    response_relations = []
    for r in relations:
        node = nodes.get(r.node_id)
        response_relations.append(BookKnowledgeRelationResponse(
            id=r.id,
            book_id=r.book_id,
            node_id=r.node_id,
            relation_type=r.relation_type,
            source=r.source,
            status=r.status,
            confidence=r.confidence,
            created_at=r.created_at,
            node_name=node.name if node else None,
            node_type=node.node_type if node else None,
        ))

    return BookKnowledgeResponse(
        book_id=book_id,
        book_title=book.title,
        relations=response_relations,
    )
