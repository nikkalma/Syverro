from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.author import Author
from app.models.timeline_event import TimelineEvent
from app.schemas.timeline_event import (
    TimelineEventCreate, TimelineEventUpdate, TimelineEventResponse,
)
from typing import List
from uuid import UUID
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/authors/{author_id}/timeline", tags=["admin-timeline"])


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


@router.get("", response_model=List[TimelineEventResponse])
async def list_timeline_events(
    author_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_editor(current_user)
    await get_author_or_404(db, author_id)
    result = await db.execute(
        select(TimelineEvent)
        .where(TimelineEvent.author_id == author_id)
        .order_by(TimelineEvent.sort_order, TimelineEvent.date_value)
    )
    return result.scalars().all()


@router.post("", response_model=TimelineEventResponse, status_code=status.HTTP_201_CREATED)
async def create_timeline_event(
    author_id: UUID,
    data: TimelineEventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_editor(current_user)
    await get_author_or_404(db, author_id)
    event = TimelineEvent(author_id=author_id, **data.model_dump())
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.put("/{event_id}", response_model=TimelineEventResponse)
async def update_timeline_event(
    author_id: UUID,
    event_id: UUID,
    data: TimelineEventUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_editor(current_user)
    result = await db.execute(
        select(TimelineEvent).where(
            TimelineEvent.id == event_id,
            TimelineEvent.author_id == author_id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Timeline event not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)
    await db.commit()
    await db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timeline_event(
    author_id: UUID,
    event_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_editor(current_user)
    result = await db.execute(
        select(TimelineEvent).where(
            TimelineEvent.id == event_id,
            TimelineEvent.author_id == author_id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Timeline event not found")
    await db.delete(event)
    await db.commit()
