from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class AuthorAwardBase(BaseModel):
    name: str
    year: Optional[int] = None
    organization: Optional[str] = None
    work: Optional[str] = None


class AuthorAwardCreate(AuthorAwardBase):
    pass


class AuthorAwardResponse(AuthorAwardBase):
    id: UUID
    author_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class AuthorBase(BaseModel):
    name: str
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    native_name: Optional[str] = None
    sort_name: Optional[str] = None

    # Basic information
    pseudonyms: Optional[List[str]] = None
    nationality: Optional[str] = None
    languages: Optional[List[str]] = None
    gender: Optional[str] = "unknown"
    official_website: Optional[str] = None
    wikipedia_url: Optional[str] = None

    # Biography
    bio: Optional[str] = None
    birth_year: Optional[int] = None
    death_year: Optional[int] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    birth_place: Optional[str] = None
    death_place: Optional[str] = None

    # Career
    occupations: Optional[List[str]] = None
    literary_movements: Optional[List[str]] = None
    active_from_year: Optional[int] = None
    active_to_year: Optional[int] = None

    # Bibliography
    notable_works: Optional[List[str]] = None
    genres: Optional[List[str]] = None
    writing_languages: Optional[List[str]] = None

    # Media
    photo: Optional[str] = None
    gallery: Optional[List[str]] = None
    signature_image: Optional[str] = None
    portrait_caption: Optional[str] = None


class AuthorCreate(AuthorBase):
    pass


class AuthorUpdate(BaseModel):
    name: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    native_name: Optional[str] = None
    sort_name: Optional[str] = None

    pseudonyms: Optional[List[str]] = None
    nationality: Optional[str] = None
    languages: Optional[List[str]] = None
    gender: Optional[str] = None
    official_website: Optional[str] = None
    wikipedia_url: Optional[str] = None

    bio: Optional[str] = None
    birth_year: Optional[int] = None
    death_year: Optional[int] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    birth_place: Optional[str] = None
    death_place: Optional[str] = None

    occupations: Optional[List[str]] = None
    literary_movements: Optional[List[str]] = None
    active_from_year: Optional[int] = None
    active_to_year: Optional[int] = None

    notable_works: Optional[List[str]] = None
    genres: Optional[List[str]] = None
    writing_languages: Optional[List[str]] = None

    photo: Optional[str] = None
    gallery: Optional[List[str]] = None
    signature_image: Optional[str] = None
    portrait_caption: Optional[str] = None


class AuthorResponse(AuthorBase):
    id: UUID
    creation_type: str = "individual_author"
    awards: List[AuthorAwardResponse] = []
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


class AuthorBookBrief(BaseModel):
    id: UUID
    title: str
    cover: Optional[str] = None

    class Config:
        from_attributes = True


class AuthorMetadata(BaseModel):
    genres: List[str] = []
    themes: List[str] = []
    motifs: List[str] = []


class AuthorPublicResponse(BaseModel):
    id: UUID
    name: str
    nationality: Optional[str] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    biography: Optional[str] = None
    photo_url: Optional[str] = None
    books: List[AuthorBookBrief] = []
    metadata: AuthorMetadata = AuthorMetadata()

    class Config:
        from_attributes = True
