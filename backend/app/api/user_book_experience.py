from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.user_book_experience import UserBookExperience
from app.models.knowledge_node import KnowledgeNode
from app.schemas.taxonomy import (
    UserBookExperienceCreate, UserBookExperienceResponse,
)
from typing import Optional
from uuid import UUID

router = APIRouter(prefix="/user-book-experiences", tags=["user-book-experiences"])


@router.post("", response_model=UserBookExperienceResponse, status_code=status.HTTP_201_CREATED)
async def create_experience(
    data: UserBookExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(UserBookExperience).where(
            UserBookExperience.user_id == current_user.id,
            UserBookExperience.book_id == data.book_id,
            UserBookExperience.atmosphere_node_id == data.atmosphere_node_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Experience already exists for this book/atmosphere")

    exp = UserBookExperience(
        user_id=current_user.id,
        book_id=data.book_id,
        atmosphere_node_id=data.atmosphere_node_id,
        mood_node_id=data.mood_node_id,
        intensity=data.intensity,
        note=data.note,
    )
    db.add(exp)
    await db.commit()
    await db.refresh(exp)

    atmosphere_name = None
    mood_name = None
    if exp.atmosphere_node_id:
        node = await db.execute(select(KnowledgeNode).where(KnowledgeNode.id == exp.atmosphere_node_id))
        n = node.scalar_one_or_none()
        atmosphere_name = n.name if n else None
    if exp.mood_node_id:
        node = await db.execute(select(KnowledgeNode).where(KnowledgeNode.id == exp.mood_node_id))
        n = node.scalar_one_or_none()
        mood_name = n.name if n else None

    return UserBookExperienceResponse(
        id=exp.id,
        user_id=exp.user_id,
        book_id=exp.book_id,
        atmosphere_node_id=exp.atmosphere_node_id,
        mood_node_id=exp.mood_node_id,
        intensity=exp.intensity,
        note=exp.note,
        created_at=exp.created_at,
        atmosphere_name=atmosphere_name,
        mood_name=mood_name,
    )


@router.get("", response_model=dict)
async def list_experiences(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    book_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(UserBookExperience).where(UserBookExperience.user_id == current_user.id)
    count_query = select(func.count()).select_from(UserBookExperience).where(
        UserBookExperience.user_id == current_user.id
    )

    if book_id:
        query = query.where(UserBookExperience.book_id == book_id)
        count_query = count_query.where(UserBookExperience.book_id == book_id)

    total = await db.scalar(count_query) or 0
    query = query.order_by(UserBookExperience.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    exps = result.scalars().all()

    node_ids = set()
    for e in exps:
        if e.atmosphere_node_id:
            node_ids.add(e.atmosphere_node_id)
        if e.mood_node_id:
            node_ids.add(e.mood_node_id)

    nodes = {}
    if node_ids:
        node_result = await db.execute(
            select(KnowledgeNode).where(KnowledgeNode.id.in_(node_ids))
        )
        nodes = {n.id: n for n in node_result.scalars().all()}

    data = []
    for e in exps:
        atmosphere_name = nodes[e.atmosphere_node_id].name if e.atmosphere_node_id and e.atmosphere_node_id in nodes else None
        mood_name = nodes[e.mood_node_id].name if e.mood_node_id and e.mood_node_id in nodes else None
        data.append(UserBookExperienceResponse(
            id=e.id,
            user_id=e.user_id,
            book_id=e.book_id,
            atmosphere_node_id=e.atmosphere_node_id,
            mood_node_id=e.mood_node_id,
            intensity=e.intensity,
            note=e.note,
            created_at=e.created_at,
            atmosphere_name=atmosphere_name,
            mood_name=mood_name,
        ))

    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/{experience_id}", response_model=UserBookExperienceResponse)
async def get_experience(
    experience_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserBookExperience).where(
            UserBookExperience.id == experience_id,
            UserBookExperience.user_id == current_user.id,
        )
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")

    atmosphere_name = None
    mood_name = None
    if exp.atmosphere_node_id:
        node = await db.execute(select(KnowledgeNode).where(KnowledgeNode.id == exp.atmosphere_node_id))
        n = node.scalar_one_or_none()
        atmosphere_name = n.name if n else None
    if exp.mood_node_id:
        node = await db.execute(select(KnowledgeNode).where(KnowledgeNode.id == exp.mood_node_id))
        n = node.scalar_one_or_none()
        mood_name = n.name if n else None

    return UserBookExperienceResponse(
        id=exp.id,
        user_id=exp.user_id,
        book_id=exp.book_id,
        atmosphere_node_id=exp.atmosphere_node_id,
        mood_node_id=exp.mood_node_id,
        intensity=exp.intensity,
        note=exp.note,
        created_at=exp.created_at,
        atmosphere_name=atmosphere_name,
        mood_name=mood_name,
    )


@router.put("/{experience_id}", response_model=UserBookExperienceResponse)
async def update_experience(
    experience_id: UUID,
    data: UserBookExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserBookExperience).where(
            UserBookExperience.id == experience_id,
            UserBookExperience.user_id == current_user.id,
        )
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")

    exp.atmosphere_node_id = data.atmosphere_node_id
    exp.mood_node_id = data.mood_node_id
    exp.intensity = data.intensity
    exp.note = data.note
    await db.commit()
    await db.refresh(exp)

    atmosphere_name = None
    mood_name = None
    if exp.atmosphere_node_id:
        node = await db.execute(select(KnowledgeNode).where(KnowledgeNode.id == exp.atmosphere_node_id))
        n = node.scalar_one_or_none()
        atmosphere_name = n.name if n else None
    if exp.mood_node_id:
        node = await db.execute(select(KnowledgeNode).where(KnowledgeNode.id == exp.mood_node_id))
        n = node.scalar_one_or_none()
        mood_name = n.name if n else None

    return UserBookExperienceResponse(
        id=exp.id,
        user_id=exp.user_id,
        book_id=exp.book_id,
        atmosphere_node_id=exp.atmosphere_node_id,
        mood_node_id=exp.mood_node_id,
        intensity=exp.intensity,
        note=exp.note,
        created_at=exp.created_at,
        atmosphere_name=atmosphere_name,
        mood_name=mood_name,
    )


@router.delete("/{experience_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experience(
    experience_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserBookExperience).where(
            UserBookExperience.id == experience_id,
            UserBookExperience.user_id == current_user.id,
        )
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")

    await db.delete(exp)
    await db.commit()
