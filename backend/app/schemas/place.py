from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class PlaceBase(BaseModel):
    name: str
    name_native: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    country: Optional[str] = None
    region: Optional[str] = None
    place_type: Optional[str] = None
    wikidata_id: Optional[str] = None


class PlaceCreate(PlaceBase):
    pass


class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    name_native: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    country: Optional[str] = None
    region: Optional[str] = None
    place_type: Optional[str] = None
    wikidata_id: Optional[str] = None


class PlaceResponse(PlaceBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class PlaceBrief(BaseModel):
    id: UUID
    name: str
    country: Optional[str] = None

    class Config:
        from_attributes = True
