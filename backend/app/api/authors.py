from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.deps import get_db
from app.models.author import Author
from app.models.book import Book
from app.models.book_author import book_authors
from app.models.book_genre import book_genres
from app.models.genre import Genre
from app.models.book_knowledge_relation import BookKnowledgeRelation
from app.models.knowledge_node import KnowledgeNode
from app.schemas.author import AuthorPublicResponse, AuthorBookBrief, AuthorMetadata
from uuid import UUID
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/authors", tags=["authors"])


@router.get("/{author_id}", response_model=AuthorPublicResponse)
async def get_author(
    author_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Author).where(Author.id == author_id)
    )
    author = result.scalar_one_or_none()
    if not author:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author not found")

    book_rows = await db.execute(
        select(Book.id, Book.title, Book.cover)
        .select_from(book_authors)
        .join(Book, book_authors.c.book_id == Book.id)
        .where(book_authors.c.author_id == author_id)
        .where(Book.is_published == True)
        .order_by(Book.title)
    )
    books = [AuthorBookBrief(id=row[0], title=row[1], cover=row[2]) for row in book_rows]

    book_ids = [b.id for b in books]

    genre_rows = await db.execute(
        select(func.distinct(Genre.name))
        .select_from(book_genres)
        .join(Genre, book_genres.c.genre_id == Genre.id)
        .where(book_genres.c.book_id.in_(book_ids))
        .order_by(Genre.name)
    )
    genres = [row[0] for row in genre_rows]

    theme_rows = await db.execute(
        select(func.distinct(KnowledgeNode.name))
        .select_from(BookKnowledgeRelation)
        .join(KnowledgeNode, BookKnowledgeRelation.node_id == KnowledgeNode.id)
        .where(BookKnowledgeRelation.book_id.in_(book_ids))
        .where(BookKnowledgeRelation.status == "approved")
        .where(KnowledgeNode.node_type == "theme")
        .order_by(KnowledgeNode.name)
    )
    themes = [row[0] for row in theme_rows]

    motif_rows = await db.execute(
        select(func.distinct(KnowledgeNode.name))
        .select_from(BookKnowledgeRelation)
        .join(KnowledgeNode, BookKnowledgeRelation.node_id == KnowledgeNode.id)
        .where(BookKnowledgeRelation.book_id.in_(book_ids))
        .where(BookKnowledgeRelation.status == "approved")
        .where(KnowledgeNode.node_type == "motif")
        .order_by(KnowledgeNode.name)
    )
    motifs = [row[0] for row in motif_rows]

    return AuthorPublicResponse(
        id=author.id,
        name=author.name,
        nationality=author.nationality,
        birth_date=author.birth_date,
        death_date=author.death_date,
        biography=author.bio,
        photo_url=author.photo,
        books=books,
        metadata=AuthorMetadata(genres=genres, themes=themes, motifs=motifs),
    )
