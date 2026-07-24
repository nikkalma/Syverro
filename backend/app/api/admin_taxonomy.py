from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.knowledge_node import KnowledgeNode
from app.models.knowledge_relation import KnowledgeRelation
from app.models.book_knowledge_relation import BookKnowledgeRelation
from app.models.book import Book
from app.schemas.taxonomy import (
    KnowledgeNodeCreate, KnowledgeNodeUpdate, KnowledgeNodeResponse,
    KnowledgeRelationCreate, KnowledgeRelationResponse,
    BookKnowledgeRelationCreate, BookKnowledgeRelationUpdate, BookKnowledgeRelationResponse,
)
from app.services.metadata_service import recalculate_metadata_status
from typing import List
from uuid import UUID
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin-taxonomy"])


async def check_admin(user: User) -> User:
    if user.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def check_moderator(user: User) -> User:
    if user.role not in ["owner", "admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Moderator access required")
    return user


# ============================================================
# ADMIN: Knowledge Nodes CRUD
# ============================================================

@router.post("/taxonomy/nodes", response_model=KnowledgeNodeResponse, status_code=status.HTTP_201_CREATED)
async def create_node(
    data: KnowledgeNodeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)

    # Verify slug uniqueness
    existing = await db.execute(
        select(KnowledgeNode).where(KnowledgeNode.slug == data.slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Node with this slug already exists")

    # Verify parent exists if provided
    if data.parent_id:
        parent = await db.execute(select(KnowledgeNode).where(KnowledgeNode.id == data.parent_id))
        if not parent.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Parent node not found")

    node = KnowledgeNode(**data.model_dump())
    db.add(node)
    await db.commit()
    await db.refresh(node)
    logger.info(f"Knowledge node created: {node.name} ({node.node_type}) by {current_user.email}")
    return node


@router.put("/taxonomy/nodes/{node_id}", response_model=KnowledgeNodeResponse)
async def update_node(
    node_id: UUID,
    data: KnowledgeNodeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)

    result = await db.execute(select(KnowledgeNode).where(KnowledgeNode.id == node_id))
    node = result.scalar_one_or_none()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    if data.name is not None:
        node.name = data.name
    if data.slug is not None:
        existing = await db.execute(
            select(KnowledgeNode).where(KnowledgeNode.slug == data.slug, KnowledgeNode.id != node_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Node with this slug already exists")
        node.slug = data.slug
    if data.parent_id is not None:
        if data.parent_id == node.id:
            raise HTTPException(status_code=400, detail="Node cannot be its own parent")
        node.parent_id = data.parent_id
    if data.meta is not None:
        node.meta = data.meta

    await db.commit()
    await db.refresh(node)
    return node


@router.delete("/taxonomy/nodes/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_node(
    node_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_owner(current_user)

    result = await db.execute(select(KnowledgeNode).where(KnowledgeNode.id == node_id))
    node = result.scalar_one_or_none()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    # Check for children
    children = await db.execute(
        select(KnowledgeNode).where(KnowledgeNode.parent_id == node_id)
    )
    if children.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Cannot delete node with children")

    await db.delete(node)
    await db.commit()
    logger.info(f"Knowledge node deleted: {node.name} ({node.node_type}) by {current_user.email}")


async def check_owner(user: User) -> User:
    if user.role != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    return user


# ============================================================
# ADMIN: Knowledge Relations
# ============================================================

@router.post("/taxonomy/relations", response_model=KnowledgeRelationResponse, status_code=status.HTTP_201_CREATED)
async def create_relation(
    data: KnowledgeRelationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)

    # Verify both nodes exist
    source = await db.execute(select(KnowledgeNode).where(KnowledgeNode.id == data.source_node_id))
    target = await db.execute(select(KnowledgeNode).where(KnowledgeNode.id == data.target_node_id))
    if not source.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Source node not found")
    if not target.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Target node not found")

    if data.source_node_id == data.target_node_id:
        raise HTTPException(status_code=400, detail="Cannot create self-referencing relation")

    relation = KnowledgeRelation(**data.model_dump())
    db.add(relation)
    await db.commit()
    await db.refresh(relation)
    logger.info(f"Knowledge relation created: {data.source_node_id} -> {data.target_node_id} ({data.relation_type})")
    return relation


@router.delete("/taxonomy/relations/{relation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_relation(
    relation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)

    result = await db.execute(select(KnowledgeRelation).where(KnowledgeRelation.id == relation_id))
    relation = result.scalar_one_or_none()
    if not relation:
        raise HTTPException(status_code=404, detail="Relation not found")

    await db.delete(relation)
    await db.commit()


# ============================================================
# ADMIN: Book Knowledge Relations
# ============================================================

@router.post("/books/{book_id}/taxonomy", response_model=BookKnowledgeRelationResponse, status_code=status.HTTP_201_CREATED)
async def connect_book_to_node(
    book_id: UUID,
    data: BookKnowledgeRelationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_moderator(current_user)

    # Verify book exists
    book_result = await db.execute(select(Book).where(Book.id == book_id))
    book = book_result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Verify node exists
    node_result = await db.execute(select(KnowledgeNode).where(KnowledgeNode.id == data.node_id))
    node = node_result.scalar_one_or_none()
    if not node:
        raise HTTPException(status_code=404, detail="Knowledge node not found")

    # Determine source based on role
    source_map = {
        "owner": "owner",
        "admin": "admin",
        "moderator": "moderator",
    }
    effective_source = source_map.get(current_user.role, "user")

    relation = BookKnowledgeRelation(
        book_id=book_id,
        node_id=data.node_id,
        relation_type=data.relation_type,
        source=effective_source,
        status=data.status,
        confidence=data.confidence,
    )
    db.add(relation)
    await recalculate_metadata_status(db, book)
    await db.commit()
    await db.refresh(relation)

    logger.info(f"Book {book_id} connected to node {data.node_id} ({data.relation_type}) by {current_user.email}")
    return BookKnowledgeRelationResponse(
        id=relation.id,
        book_id=relation.book_id,
        node_id=relation.node_id,
        relation_type=relation.relation_type,
        source=relation.source,
        status=relation.status,
        confidence=relation.confidence,
        created_at=relation.created_at,
        node_name=node.name,
        node_type=node.node_type,
    )


@router.put("/books/{book_id}/taxonomy/{relation_id}", response_model=BookKnowledgeRelationResponse)
async def update_book_relation(
    book_id: UUID,
    relation_id: UUID,
    data: BookKnowledgeRelationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_moderator(current_user)

    result = await db.execute(
        select(BookKnowledgeRelation).where(
            BookKnowledgeRelation.id == relation_id,
            BookKnowledgeRelation.book_id == book_id,
        )
    )
    relation = result.scalar_one_or_none()
    if not relation:
        raise HTTPException(status_code=404, detail="Book relation not found")

    allowed_statuses = {"proposed", "approved", "rejected"}
    if data.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {allowed_statuses}")

    if current_user.role == "moderator" and data.status == "approved":
        moderators_can_approve = current_user.role in ["admin", "owner"]
        if not moderators_can_approve:
            # Moderators can approve (they have moderation privileges)
            pass

    relation.status = data.status
    if data.confidence is not None:
        relation.confidence = data.confidence
    await db.commit()
    await db.refresh(relation)

    node_result = await db.execute(select(KnowledgeNode).where(KnowledgeNode.id == relation.node_id))
    node = node_result.scalar_one_or_none()

    return BookKnowledgeRelationResponse(
        id=relation.id,
        book_id=relation.book_id,
        node_id=relation.node_id,
        relation_type=relation.relation_type,
        source=relation.source,
        status=relation.status,
        confidence=relation.confidence,
        created_at=relation.created_at,
        node_name=node.name if node else None,
        node_type=node.node_type if node else None,
    )


@router.get("/books/{book_id}/taxonomy", response_model=List[BookKnowledgeRelationResponse])
async def get_book_taxonomy_admin(
    book_id: UUID,
    status_filter: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_moderator(current_user)

    query = select(BookKnowledgeRelation).where(BookKnowledgeRelation.book_id == book_id)
    if status_filter:
        query = query.where(BookKnowledgeRelation.status == status_filter)
    query = query.order_by(BookKnowledgeRelation.created_at.desc())

    result = await db.execute(query)
    relations = result.scalars().all()

    node_ids = [r.node_id for r in relations]
    if node_ids:
        nodes_result = await db.execute(
            select(KnowledgeNode).where(KnowledgeNode.id.in_(node_ids))
        )
        nodes = {n.id: n for n in nodes_result.scalars().all()}
    else:
        nodes = {}

    response = []
    for r in relations:
        node = nodes.get(r.node_id)
        response.append(BookKnowledgeRelationResponse(
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

    return response


@router.delete("/books/{book_id}/taxonomy/{relation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book_relation(
    book_id: UUID,
    relation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(current_user)

    result = await db.execute(
        select(BookKnowledgeRelation).where(
            BookKnowledgeRelation.id == relation_id,
            BookKnowledgeRelation.book_id == book_id,
        )
    )
    relation = result.scalar_one_or_none()
    if not relation:
        raise HTTPException(status_code=404, detail="Book relation not found")

    await db.delete(relation)
    book_result = await db.execute(select(Book).where(Book.id == book_id))
    book = book_result.scalar_one_or_none()
    if book:
        await recalculate_metadata_status(db, book)
    await db.commit()
