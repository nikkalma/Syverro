from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
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


class AuthorAwardPayload(BaseModel):
    name: str
    year: Optional[int] = None
    organization: Optional[str] = None
    work: Optional[str] = None


class AuthorBase(BaseModel):
    name: str
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    native_name: Optional[str] = None
    sort_name: Optional[str] = None

    # Identity
    display_name: Optional[str] = None
    display_name_mode: Optional[str] = None
    pen_names: Optional[List[str]] = None
    birth_name: Optional[str] = None
    slug: Optional[str] = None
    search_aliases: Optional[str] = None

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
    birth_date_precision: Optional[str] = "full"
    death_date: Optional[str] = None
    death_date_precision: Optional[str] = "full"
    birth_place: Optional[str] = None
    death_place: Optional[str] = None
    birth_place_id: Optional[UUID] = None
    death_place_id: Optional[UUID] = None

    # Career
    occupations: Optional[List[str]] = None
    literary_movements: Optional[List[str]] = None
    active_from_year: Optional[int] = None
    active_to_year: Optional[int] = None

    # Bibliography
    notable_works: Optional[List[str]] = None
    genres: Optional[List[str]] = None
    writing_languages: Optional[List[str]] = None

    # Taxonomy Extended
    themes: Optional[List[str]] = None
    motifs: Optional[List[str]] = None
    concepts: Optional[List[str]] = None
    atmospheres: Optional[List[str]] = None

    # About
    hero_quote: Optional[str] = None
    about_summary: Optional[str] = None

    # Identity Extended
    ethnic_origin: Optional[str] = None
    cultural_identity: Optional[str] = None

    # Media
    photo: Optional[str] = None
    gallery: Optional[List[str]] = None
    signature_image: Optional[str] = None
    portrait_caption: Optional[str] = None
    hero_background_url: Optional[str] = None
    author_intro_quote: Optional[str] = None

    # Metadata
    creation_type: Optional[str] = "individual_author"
    metadata_status: Optional[str] = "draft"


class AuthorCreate(AuthorBase):
    awards: Optional[List[AuthorAwardPayload]] = None


class AuthorUpdate(BaseModel):
    name: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    native_name: Optional[str] = None
    sort_name: Optional[str] = None

    # Identity
    display_name: Optional[str] = None
    display_name_mode: Optional[str] = None
    pen_names: Optional[List[str]] = None
    birth_name: Optional[str] = None
    slug: Optional[str] = None
    search_aliases: Optional[str] = None

    # Awards (sent in main payload, handled separately by endpoint)
    awards: Optional[List[AuthorAwardPayload]] = None

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
    birth_date_precision: Optional[str] = None
    death_date: Optional[str] = None
    death_date_precision: Optional[str] = None
    birth_place: Optional[str] = None
    death_place: Optional[str] = None
    birth_place_id: Optional[UUID] = None
    death_place_id: Optional[UUID] = None

    occupations: Optional[List[str]] = None
    literary_movements: Optional[List[str]] = None
    active_from_year: Optional[int] = None
    active_to_year: Optional[int] = None

    notable_works: Optional[List[str]] = None
    genres: Optional[List[str]] = None
    writing_languages: Optional[List[str]] = None

    # Taxonomy Extended
    themes: Optional[List[str]] = None
    motifs: Optional[List[str]] = None
    concepts: Optional[List[str]] = None
    atmospheres: Optional[List[str]] = None

    hero_quote: Optional[str] = None
    about_summary: Optional[str] = None
    ethnic_origin: Optional[str] = None
    cultural_identity: Optional[str] = None
    photo: Optional[str] = None
    gallery: Optional[List[str]] = None
    signature_image: Optional[str] = None
    portrait_caption: Optional[str] = None
    hero_background_url: Optional[str] = None
    author_intro_quote: Optional[str] = None
    metadata_status: Optional[str] = None


class AuthorResponse(AuthorBase):
    id: UUID
    creation_type: str = "individual_author"
    metadata_status: str = "draft"
    birth_date_precision: str = "full"
    death_date_precision: str = "full"
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
    concepts: List[str] = []
    atmospheres: List[str] = []


class AuthorListBrief(BaseModel):
    id: UUID
    slug: Optional[str] = None
    name: str
    display_name: Optional[str] = None
    display_name_mode: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    native_name: Optional[str] = None
    biography_excerpt: Optional[str] = None
    photo_url: Optional[str] = None
    nationality: Optional[str] = None


class AuthorPublicResponse(BaseModel):
    id: UUID
    slug: Optional[str] = None
    name: str
    display_name: Optional[str] = None
    display_name_mode: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    native_name: Optional[str] = None
    nationality: Optional[str] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    biography: Optional[str] = None
    photo_url: Optional[str] = None
    hero_background_url: Optional[str] = None
    author_intro_quote: Optional[str] = None
    birth_place: Optional[str] = None
    death_place: Optional[str] = None
    occupations: Optional[List[str]] = None
    books: List[AuthorBookBrief] = []
    metadata: AuthorMetadata = AuthorMetadata()

    class Config:
        from_attributes = True


# ============================================================
# GOLDEN AUTHOR — public sub-schemas
# ============================================================


class TimelineEventPublic(BaseModel):
    id: UUID
    event_type: str
    date_value: str
    date_precision: str = "full"
    label: str
    description: Optional[str] = None
    place_name: Optional[str] = None
    source_title: Optional[str] = None
    extraction_source: str = "manual"
    confidence: float = 1.0
    status: str = "verified"
    sort_order: int = 0

    class Config:
        from_attributes = True


class QuotePublic(BaseModel):
    id: UUID
    text: str
    speaker: Optional[str] = None
    quote_type: str = "author"
    source_title: Optional[str] = None
    date_value: Optional[str] = None
    confidence: float = 1.0
    status: str = "draft"

    class Config:
        from_attributes = True


class CitizenshipPublic(BaseModel):
    id: UUID
    state_name: str
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    notes: Optional[str] = None
    confidence: float = 1.0
    status: str = "verified"

    class Config:
        from_attributes = True


class AwardPublic(BaseModel):
    id: UUID
    name: str
    year: Optional[int] = None
    organization: Optional[str] = None
    work: Optional[str] = None

    class Config:
        from_attributes = True


class SourcePublic(BaseModel):
    id: UUID
    title: str
    source_type: str
    url: Optional[str] = None
    citation: Optional[str] = None
    language: Optional[str] = None
    reliability_score: Optional[str] = "3"
    source_origin: Optional[str] = "manual"

    class Config:
        from_attributes = True


class AuthorPublicationPublic(BaseModel):
    id: UUID
    title: str
    original_title: Optional[str] = None
    publication_year: int
    publication_date: Optional[date] = None
    publication_type: str
    description: Optional[str] = None
    pen_name: Optional[str] = None
    wikipedia_url: Optional[str] = None

    class Config:
        from_attributes = True


class KnowledgeRelationPublic(BaseModel):
    id: UUID
    node_name: Optional[str] = None
    node_type: Optional[str] = None
    relation_type: str
    source: Optional[str] = None
    status: str = "proposed"
    confidence: float = 0.0
    author_slug: Optional[str] = None

    class Config:
        from_attributes = True


class GoldenAuthorMetadata(BaseModel):
    genres: List[str] = []
    themes: List[str] = []
    motifs: List[str] = []
    concepts: List[str] = []
    atmospheres: List[str] = []
    literary_movements: List[str] = []
    languages: List[str] = []


class GoldenAuthorResponse(BaseModel):
    id: UUID
    slug: Optional[str] = None
    name: str
    display_name: Optional[str] = None
    display_name_mode: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    native_name: Optional[str] = None
    sort_name: Optional[str] = None

    nationality: Optional[str] = None
    ethnic_origin: Optional[str] = None
    cultural_identity: Optional[str] = None
    birth_name: Optional[str] = None
    pen_names: Optional[List[str]] = None
    pseudonyms: Optional[List[str]] = None

    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    birth_place: Optional[str] = None
    birth_place_region: Optional[str] = None
    birth_place_country: Optional[str] = None
    death_place: Optional[str] = None
    death_place_region: Optional[str] = None
    death_place_country: Optional[str] = None
    biography: Optional[str] = None
    hero_quote: Optional[str] = None
    about_summary: Optional[str] = None

    occupations: Optional[List[str]] = None

    photo_url: Optional[str] = None
    hero_background_url: Optional[str] = None
    author_intro_quote: Optional[str] = None

    books: List[AuthorBookBrief] = []
    awards: List[AwardPublic] = []
    timeline_events: List[TimelineEventPublic] = []
    quotes: List[QuotePublic] = []
    citizenships: List[CitizenshipPublic] = []
    sources: List[SourcePublic] = []
    knowledge_relations: List[KnowledgeRelationPublic] = []
    publications: List[AuthorPublicationPublic] = []
    metadata: GoldenAuthorMetadata = GoldenAuthorMetadata()

    class Config:
        from_attributes = True
