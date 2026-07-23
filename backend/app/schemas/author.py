from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class AuthorBase(BaseModel):
    name: str
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    native_name: Optional[str] = None
    sort_name: Optional[str] = None
    photo: Optional[str] = None
    bio: Optional[str] = None
    country: Optional[str] = None
    birth_year: Optional[int] = None
    death_year: Optional[int] = None


class AuthorCreate(AuthorBase):
    pass


class AuthorUpdate(BaseModel):
    name: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    native_name: Optional[str] = None
    sort_name: Optional[str] = None
    photo: Optional[str] = None
    bio: Optional[str] = None
    country: Optional[str] = None
    birth_year: Optional[int] = None
    death_year: Optional[int] = None


class AuthorResponse(AuthorBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AuthorBrief(BaseModel):
    id: UUID
    name: str
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    native_name: Optional[str] = None
    sort_name: Optional[str] = None
    country: Optional[str] = None

    class Config:
        from_attributes = True
