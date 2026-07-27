from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.author import Author
from app.models.knowledge_node import KnowledgeNode
from app.models.author_knowledge_relation import AuthorKnowledgeRelation
from app.schemas.author_knowledge_relation import (
    AuthorKnowledgeRelationCreate, AuthorKnowledgeRelationUpdate,
    AuthorKnowledgeRelationResponse,
)
from typing import List, Optional
from uuid import UUID
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/authors/{author_id}/knowledge", tags=["admin-author-knowledge"])


async def check_editor(user: User) -> User:
    if user.role not in ["owner", "admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Editor access required")
    return user


async def get_author_or_404(db: AsyncSession, author_id: UUID) -> Author:
    result = await db.execute(select(Author).where(Author.id == author_id))
    author = result.scalar_one_or_none()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    return author


def _enrich_relations(relations: list, nodes: dict) -> list:
    enriched = []
    for r in relations:
        node = nodes.get(r.node_id)
        enriched.append({
            "id": r.id,
            "author_id": r.author_id,
            "node_id": r.node_id,
            "relation_type": r.relation_type,
            "source": r.source,
            "status": r.status,
            "confidence": r.confidence,
            "source_id": r.source_id,
            "created_at": r.created_at,
            "node_name": node.name if node else None,
            "node_type": node.node_type if node else None,
        })
    return enriched


@router.get("", response_model=List[AuthorKnowledgeRelationResponse])
async def list_author_knowledge(
    author_id: UUID,
    relation_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_editor(current_user)
    await get_author_or_404(db, author_id)
    query = select(AuthorKnowledgeRelation).where(
        AuthorKnowledgeRelation.author_id == author_id
    )
    if relation_type:
        query = query.where(AuthorKnowledgeRelation.relation_type == relation_type)
    result = await db.execute(query.order_by(AuthorKnowledgeRelation.created_at))
    relations = result.scalars().all()

    node_ids = [r.node_id for r in relations]
    if node_ids:
        nodes_result = await db.execute(
            select(KnowledgeNode).where(KnowledgeNode.id.in_(node_ids))
        )
        nodes = {n.id: n for n in nodes_result.scalars().all()}
    else:
        nodes = {}

    return _enrich_relations(relations, nodes)


@router.post("", response_model=AuthorKnowledgeRelationResponse, status_code=status.HTTP_201_CREATED)
async def create_author_knowledge(
    author_id: UUID,
    data: AuthorKnowledgeRelationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_editor(current_user)
    await get_author_or_404(db, author_id)

    node_result = await db.execute(
        select(KnowledgeNode).where(KnowledgeNode.id == data.node_id)
    )
    node = node_result.scalar_one_or_none()
    if not node:
        raise HTTPException(status_code=404, detail="Knowledge node not found")

    rel = AuthorKnowledgeRelation(author_id=author_id, **data.model_dump())
    db.add(rel)
    await db.commit()
    await db.refresh(rel)
    return {
        "id": rel.id,
        "author_id": rel.author_id,
        "node_id": rel.node_id,
        "relation_type": rel.relation_type,
        "source": rel.source,
        "status": rel.status,
        "confidence": rel.confidence,
        "source_id": rel.source_id,
        "created_at": rel.created_at,
        "node_name": node.name,
        "node_type": node.node_type,
    }


@router.put("/{relation_id}", response_model=AuthorKnowledgeRelationResponse)
async def update_author_knowledge(
    author_id: UUID,
    relation_id: UUID,
    data: AuthorKnowledgeRelationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_editor(current_user)
    result = await db.execute(
        select(AuthorKnowledgeRelation).where(
            AuthorKnowledgeRelation.id == relation_id,
            AuthorKnowledgeRelation.author_id == author_id,
        )
    )
    rel = result.scalar_one_or_none()
    if not rel:
        raise HTTPException(status_code=404, detail="Relation not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rel, key, value)
    await db.commit()
    await db.refresh(rel)

    node_result = await db.execute(
        select(KnowledgeNode).where(KnowledgeNode.id == rel.node_id)
    )
    node = node_result.scalar_one_or_none()
    return {
        "id": rel.id,
        "author_id": rel.author_id,
        "node_id": rel.node_id,
        "relation_type": rel.relation_type,
        "source": rel.source,
        "status": rel.status,
        "confidence": rel.confidence,
        "source_id": rel.source_id,
        "created_at": rel.created_at,
        "node_name": node.name if node else None,
        "node_type": node.node_type if node else None,
    }


@router.delete("/{relation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_author_knowledge(
    author_id: UUID,
    relation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_editor(current_user)
    result = await db.execute(
        select(AuthorKnowledgeRelation).where(
            AuthorKnowledgeRelation.id == relation_id,
            AuthorKnowledgeRelation.author_id == author_id,
        )
    )
    rel = result.scalar_one_or_none()
    if not rel:
        raise HTTPException(status_code=404, detail="Relation not found")
    await db.delete(rel)
    await db.commit()
