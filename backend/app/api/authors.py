from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text as sa_text
from app.core.deps import get_db
from app.models.book import Book
from app.models.book_author import book_authors
from app.models.book_genre import book_genres
from app.models.genre import Genre
from app.models.book_knowledge_relation import BookKnowledgeRelation
from app.models.knowledge_node import KnowledgeNode
from app.schemas.author import AuthorPublicResponse, AuthorBookBrief, AuthorMetadata, AuthorListBrief
from uuid import UUID
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/authors", tags=["authors"])


@router.get("", response_model=list[AuthorListBrief])
async def list_authors(db: AsyncSession = Depends(get_db)):
    cols = ["id", "name", "first_name", "last_name", "native_name",
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
            name=row.get("name", ""),
            first_name=row.get("first_name"),
            last_name=row.get("last_name"),
            native_name=row.get("native_name"),
            biography_excerpt=excerpt,
            photo_url=row.get("photo"),
            nationality=row.get("country"),
        ))
    return out


@router.get("/{author_id}", response_model=AuthorPublicResponse)
async def get_author(
    author_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    cols = ["id", "name", "first_name", "last_name", "native_name",
            "bio", "photo", "country", "birth_year", "death_year"]
    result = await db.execute(
        sa_text("SELECT " + ", ".join(cols) + " FROM authors WHERE id = :aid"),
        {"aid": str(author_id)},
    )
    row = result.mappings().one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author not found")

    book_rows = await db.execute(
        select(Book.id, Book.title, Book.cover)
        .select_from(book_authors)
        .join(Book, book_authors.c.book_id == Book.id)
        .where(book_authors.c.author_id == author_id)
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

    name = row.get("name", "")
    raw_birth = row.get("birth_year")
    raw_death = row.get("death_year")

    return AuthorPublicResponse(
        id=author_id,
        name=name,
        first_name=row.get("first_name"),
        last_name=row.get("last_name"),
        native_name=row.get("native_name"),
        nationality=row.get("country"),
        birth_date=str(raw_birth) if raw_birth is not None else None,
        death_date=str(raw_death) if raw_death is not None else None,
        biography=row.get("bio"),
        photo_url=row.get("photo"),
        books=books,
        metadata=AuthorMetadata(genres=genres, themes=themes, motifs=motifs),
    )
