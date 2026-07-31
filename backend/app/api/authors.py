from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, text as sa_text
from app.core.deps import get_db
from app.models.book import Book
from app.models.book_author import book_authors
from app.models.book_genre import book_genres
from app.models.genre import Genre
from app.models.book_knowledge_relation import BookKnowledgeRelation
from app.models.knowledge_node import KnowledgeNode
from app.models.author import Author
from app.models.author_award import AuthorAward
from app.models.timeline_event import TimelineEvent
from app.models.author_quote import AuthorQuote
from app.models.author_citizenship import AuthorCitizenship
from app.models.author_knowledge_relation import AuthorKnowledgeRelation
from app.models.source import Source
from app.models.place import Place
from app.schemas.author import (
    AuthorPublicResponse, AuthorBookBrief, AuthorMetadata, AuthorListBrief,
    GoldenAuthorResponse, TimelineEventPublic, QuotePublic,
    CitizenshipPublic, AwardPublic, SourcePublic,
    KnowledgeRelationPublic, GoldenAuthorMetadata,
)
from uuid import UUID
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/authors", tags=["authors"])


def _merge_lists(*lists: Optional[List[str]]) -> List[str]:
    result: List[str] = []
    for lst in lists:
        if not lst:
            continue
        for item in lst:
            item = (item or "").strip()
            if item and item not in result:
                result.append(item)
    return result


@router.get("", response_model=list[AuthorListBrief])
async def list_authors(db: AsyncSession = Depends(get_db)):
    cols = ["id", "slug", "name", "display_name", "display_name_mode",
            "first_name", "last_name", "native_name",
            "bio", "photo", "country"]
    result = await db.execute(
        sa_text("SELECT " + ", ".join(cols) + " FROM authors ORDER BY name"),
    )
    rows = result.mappings().all()
    out = []
    for row in rows:
        bio = row.get("bio") or ""
        excerpt = bio[:200] + "..." if len(bio) > 200 else bio if bio else None
        out.append(AuthorListBrief(
            id=row["id"],
            slug=row.get("slug"),
            name=row.get("name", ""),
            display_name=row.get("display_name"),
            display_name_mode=row.get("display_name_mode"),
            first_name=row.get("first_name"),
            last_name=row.get("last_name"),
            native_name=row.get("native_name"),
            biography_excerpt=excerpt,
            photo_url=row.get("photo"),
            nationality=row.get("country"),
        ))
    return out


@router.get("/{slug_or_id}", response_model=GoldenAuthorResponse)
async def get_author(
    slug_or_id: str,
    db: AsyncSession = Depends(get_db),
):
    # Try slug first, then UUID
    author = await db.scalar(
        select(Author).where(Author.slug == slug_or_id)
    )
    if not author:
        try:
            uuid_val = UUID(slug_or_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author not found")
        author = await db.scalar(
            select(Author).where(Author.id == uuid_val)
        )
        if not author:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author not found")

    aid = author.id

    # --- Place details for birth/death locations ---
    birth_place_region = None
    birth_place_country = None
    death_place_region = None
    death_place_country = None
    if author.birth_place_id or author.death_place_id:
        place_ids = {author.birth_place_id, author.death_place_id}
        place_ids.discard(None)
        if place_ids:
            places_db = await db.execute(select(Place).where(Place.id.in_(list(place_ids))))
            for p in places_db.scalars().all():
                if p.id == author.birth_place_id:
                    birth_place_region = p.region
                    birth_place_country = p.country
                if p.id == author.death_place_id:
                    death_place_region = p.region
                    death_place_country = p.country

    # --- Books ---
    book_rows = await db.execute(
        select(Book.id, Book.title, Book.cover)
        .select_from(book_authors)
        .join(Book, book_authors.c.book_id == Book.id)
        .where(book_authors.c.author_id == aid)
        .where(Book.is_published == True)
        .order_by(Book.title)
    )
    books = [AuthorBookBrief(id=r[0], title=r[1], cover=r[2]) for r in book_rows]
    book_ids = [b.id for b in books]

    genres = []
    themes = []
    motifs = []

    if book_ids:
        genre_rows = await db.execute(
            select(func.distinct(Genre.name))
            .select_from(book_genres)
            .join(Genre, book_genres.c.genre_id == Genre.id)
            .where(book_genres.c.book_id.in_(book_ids))
            .order_by(Genre.name)
        )
        genres = [r[0] for r in genre_rows]

        theme_rows = await db.execute(
            select(func.distinct(KnowledgeNode.name))
            .select_from(BookKnowledgeRelation)
            .join(KnowledgeNode, BookKnowledgeRelation.node_id == KnowledgeNode.id)
            .where(BookKnowledgeRelation.book_id.in_(book_ids))
            .where(BookKnowledgeRelation.status == "approved")
            .where(KnowledgeNode.node_type == "theme")
            .order_by(KnowledgeNode.name)
        )
        themes = [r[0] for r in theme_rows]

        motif_rows = await db.execute(
            select(func.distinct(KnowledgeNode.name))
            .select_from(BookKnowledgeRelation)
            .join(KnowledgeNode, BookKnowledgeRelation.node_id == KnowledgeNode.id)
            .where(BookKnowledgeRelation.book_id.in_(book_ids))
            .where(BookKnowledgeRelation.status == "approved")
            .where(KnowledgeNode.node_type == "motif")
            .order_by(KnowledgeNode.name)
        )
        motifs = [r[0] for r in motif_rows]

    # --- Awards ---
    award_rows = await db.execute(
        select(AuthorAward).where(AuthorAward.author_id == aid).order_by(AuthorAward.year)
    )
    awards = [AwardPublic(
        id=a.id, name=a.name, year=a.year,
        organization=a.organization, work=a.work,
    ) for a in award_rows.scalars().all()]

    # --- Timeline events (with place names) ---
    tl_rows = await db.execute(
        select(TimelineEvent).where(TimelineEvent.author_id == aid).order_by(TimelineEvent.sort_order, TimelineEvent.date_value)
    )
    timeline_events_raw = tl_rows.scalars().all()

    # Collect place_ids and source_ids for name resolution
    place_ids = {e.place_id for e in timeline_events_raw if e.place_id}
    source_ids_tl = {e.source_id for e in timeline_events_raw if e.source_id}

    place_map = {}
    if place_ids:
        places = await db.execute(select(Place).where(Place.id.in_(list(place_ids))))
        place_map = {p.id: p.name for p in places.scalars().all()}

    source_map = {}
    all_source_ids = set(source_ids_tl)
    if all_source_ids:
        sources_db = await db.execute(select(Source).where(Source.id.in_(list(all_source_ids))))
        source_map = {s.id: s.title for s in sources_db.scalars().all()}

    timeline_events = [TimelineEventPublic(
        id=e.id, event_type=e.event_type, date_value=e.date_value,
        date_precision=e.date_precision, label=e.label,
        description=e.description,
        place_name=place_map.get(e.place_id) if e.place_id else None,
        source_title=source_map.get(e.source_id) if e.source_id else None,
        extraction_source=e.extraction_source,
        confidence=e.confidence, status=e.status, sort_order=e.sort_order,
    ) for e in timeline_events_raw]

    # --- Quotes (with source titles) ---
    q_rows = await db.execute(
        select(AuthorQuote).where(AuthorQuote.author_id == aid).order_by(AuthorQuote.created_at)
    )
    quotes_raw = q_rows.scalars().all()
    source_ids_q = {q.source_id for q in quotes_raw if q.source_id}
    for sid in source_ids_q:
        all_source_ids.add(sid)
    if source_ids_q - set(source_map.keys()):
        extra_src = await db.execute(select(Source).where(Source.id.in_(list(source_ids_q - set(source_map.keys())))))
        for s in extra_src.scalars().all():
            source_map[s.id] = s.title

    quotes = [QuotePublic(
        id=q.id, text=q.text, speaker=q.speaker, quote_type=q.quote_type or "author",
        source_title=source_map.get(q.source_id) if q.source_id else None,
        date_value=q.date_value, confidence=q.confidence, status=q.status,
    ) for q in quotes_raw]

    # --- Citizenships ---
    cit_rows = await db.execute(
        select(AuthorCitizenship).where(AuthorCitizenship.author_id == aid).order_by(AuthorCitizenship.from_date)
    )
    citizenships = [CitizenshipPublic(
        id=c.id, state_name=c.state_name, from_date=c.from_date,
        to_date=c.to_date, notes=c.notes, confidence=c.confidence, status=c.status,
    ) for c in cit_rows.scalars().all()]

    # --- Sources (all sources referenced by this author's entities) ---
    source_list = []
    if all_source_ids:
        src_db = await db.execute(select(Source).where(Source.id.in_(list(all_source_ids))).order_by(Source.title))
        source_list = [SourcePublic(
            id=s.id, title=s.title, source_type=s.source_type,
            url=s.url, citation=s.citation, language=s.language,
            reliability_score=s.reliability_score, source_origin=s.source_origin,
        ) for s in src_db.scalars().all()]

    # --- Knowledge relations (with node names + linked author slugs) ---
    kr_rows = await db.execute(
        select(AuthorKnowledgeRelation).where(AuthorKnowledgeRelation.author_id == aid)
    )
    krs = kr_rows.scalars().all()
    node_ids = {kr.node_id for kr in krs}
    node_map = {}
    if node_ids:
        nodes_db = await db.execute(select(KnowledgeNode).where(KnowledgeNode.id.in_(list(node_ids))))
        node_map = {n.id: n for n in nodes_db.scalars().all()}

    # --- Author-level taxonomy from relations + plain-text columns ---
    TAXONOMY_RELATION_TYPES = {
        "belongs_to_genre": "genres",
        "belongs_to_movement": "literary_movements",
        "theme": "themes",
        "motif": "motifs",
        "concept": "concepts",
        "atmosphere": "atmospheres",
    }
    relation_taxonomy = {key: [] for key in TAXONOMY_RELATION_TYPES.values()}
    author_slug_by_node = {}
    linked_author_ids = {n.author_id for n in node_map.values() if n.author_id}
    if linked_author_ids:
        linked = await db.execute(
            select(Author.id, Author.slug).where(Author.id.in_(list(linked_author_ids)))
        )
        linked_slugs = {row_id: slug for row_id, slug in linked.all()}
        author_slug_by_node = {
            nid: linked_slugs[n.author_id]
            for nid, n in node_map.items()
            if n.author_id and n.author_id in linked_slugs
        }

    for kr in krs:
        meta_key = TAXONOMY_RELATION_TYPES.get(kr.relation_type)
        node = node_map.get(kr.node_id)
        if meta_key and node and node.name and node.name not in relation_taxonomy[meta_key]:
            relation_taxonomy[meta_key].append(node.name)

    knowledge_relations = [KnowledgeRelationPublic(
        id=kr.id,
        node_name=node_map[kr.node_id].name if kr.node_id in node_map else None,
        node_type=node_map[kr.node_id].node_type if kr.node_id in node_map else None,
        relation_type=kr.relation_type, source=kr.source,
        status=kr.status, confidence=kr.confidence,
        author_slug=author_slug_by_node.get(kr.node_id),
    ) for kr in krs]

    return GoldenAuthorResponse(
        id=author.id,
        slug=author.slug,
        name=author.name or "",
        display_name=author.display_name,
        display_name_mode=author.display_name_mode,
        first_name=author.first_name,
        last_name=author.last_name,
        native_name=author.native_name,
        sort_name=author.sort_name,
        nationality=author.nationality or author.country,
        ethnic_origin=author.ethnic_origin,
        cultural_identity=author.cultural_identity,
        birth_name=author.birth_name,
        pen_names=author.pen_names,
        pseudonyms=author.pseudonyms,
        birth_date=author.birth_date or (str(author.birth_year) if author.birth_year is not None else None),
        death_date=author.death_date or (str(author.death_year) if author.death_year is not None else None),
        birth_place=author.birth_place,
        birth_place_region=birth_place_region,
        birth_place_country=birth_place_country,
        death_place=author.death_place,
        death_place_region=death_place_region,
        death_place_country=death_place_country,
        biography=author.bio,
        hero_quote=author.hero_quote,
        about_summary=author.about_summary,
        occupations=author.occupations,
        photo_url=author.photo,
        hero_background_url=author.hero_background_url,
        author_intro_quote=author.author_intro_quote,
        books=books,
        awards=awards,
        timeline_events=timeline_events,
        quotes=quotes,
        citizenships=citizenships,
        sources=source_list,
        knowledge_relations=knowledge_relations,
        metadata=GoldenAuthorMetadata(
            genres=_merge_lists(relation_taxonomy["genres"], author.genres, genres),
            themes=_merge_lists(relation_taxonomy["themes"], author.themes, themes),
            motifs=_merge_lists(relation_taxonomy["motifs"], author.motifs, motifs),
            concepts=_merge_lists(relation_taxonomy["concepts"], author.concepts),
            atmospheres=_merge_lists(relation_taxonomy["atmospheres"], author.atmospheres),
            literary_movements=_merge_lists(relation_taxonomy["literary_movements"], author.literary_movements),
            languages=author.languages or [],
        ),
    )
