from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.place import Place
from app.schemas.place import PlaceCreate, PlaceUpdate, PlaceResponse, PlaceBrief
from typing import List, Optional
from uuid import UUID
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/places", tags=["admin-places"])


async def check_editor(user: User) -> User:
    if user.role not in ["owner", "admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Editor access required")
    return user


@router.get("", response_model=List[PlaceResponse])
async def list_places(
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_editor(current_user)
    query = select(Place).order_by(Place.name)
    if search:
        query = query.where(
            or_(Place.name.ilike(f"%{search}%"), Place.country.ilike(f"%{search}%"))
        )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/brief", response_model=List[PlaceBrief])
async def list_places_brief(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_editor(current_user)
    result = await db.execute(select(Place).order_by(Place.name))
    return result.scalars().all()


@router.post("", response_model=PlaceResponse, status_code=status.HTTP_201_CREATED)
async def create_place(
    data: PlaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_editor(current_user)
    place = Place(**data.model_dump())
    db.add(place)
    await db.commit()
    await db.refresh(place)
    return place


@router.put("/{place_id}", response_model=PlaceResponse)
async def update_place(
    place_id: UUID,
    data: PlaceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_editor(current_user)
    result = await db.execute(select(Place).where(Place.id == place_id))
    place = result.scalar_one_or_none()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(place, key, value)
    await db.commit()
    await db.refresh(place)
    return place


@router.delete("/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_place(
    place_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_editor(current_user)
    result = await db.execute(select(Place).where(Place.id == place_id))
    place = result.scalar_one_or_none()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    await db.delete(place)
    await db.commit()
