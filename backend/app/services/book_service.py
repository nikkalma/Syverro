from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete

from app.models.book import Book
from app.models.author import Author
from app.models.genre import Genre
from app.models.book_author import book_authors
from app.models.book_genre import book_genres
from app.models.book_knowledge_relation import BookKnowledgeRelation
from app.models.knowledge_node import KnowledgeNode


async def get_primary_author(db: AsyncSession, book: Book) -> Optional[Author]:
    """Return the first linked author from the M:N relation."""
    result = await db.execute(
        select(Author)
        .join(book_authors, book_authors.c.author_id == Author.id)
        .where(book_authors.c.book_id == book.id)
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_book_authors(db: AsyncSession, book: Book) -> List[Author]:
    """Return all authors linked via M:N."""
    result = await db.execute(
        select(Author)
        .join(book_authors, book_authors.c.author_id == Author.id)
        .where(book_authors.c.book_id == book.id)
    )
    return list(result.scalars().all())


async def sync_author_cache(db: AsyncSession, book: Book) -> None:
    """Sync Book.author and Book.author_id from the M:N book_authors table.

    This is the single source of truth for the denormalized cache fields.
    Call after any change to book_authors for the given book.
    """
    primary = await get_primary_author(db, book)
    if primary:
        book.author = primary.name
        book.author_id = primary.id
    else:
        book.author = ""
        book.author_id = None


async def link_author(db: AsyncSession, book: Book, author: Author) -> None:
    """Add an author to the book via M:N and sync the cache fields."""
    existing = await db.execute(
        select(book_authors).where(
            book_authors.c.book_id == book.id,
            book_authors.c.author_id == author.id,
        )
    )
    if not existing.fetchone():
        await db.execute(
            book_authors.insert().values(book_id=book.id, author_id=author.id)
        )
    await sync_author_cache(db, book)


async def unlink_author(db: AsyncSession, book: Book, author_id: UUID) -> None:
    """Remove an author from the book via M:N and sync the cache fields."""
    await db.execute(
        delete(book_authors).where(
            book_authors.c.book_id == book.id,
            book_authors.c.author_id == author_id,
        )
    )
    await sync_author_cache(db, book)


async def sync_genre_cache(db: AsyncSession, book: Book) -> None:
    """Sync Book.genres JSON cache from the M:N book_genres table."""
    rows = await get_book_genre_objects(db, book)
    book.genres = [row[1] for row in rows]


async def sync_book_genres(db: AsyncSession, book: Book, genre_ids: List[UUID]) -> None:
    """Replace book's genre M:N relations with the given list of genre UUIDs.
    Also syncs the Book.genres JSON cache.
    """
    await db.execute(
        delete(book_genres).where(book_genres.c.book_id == book.id)
    )
    for gid in genre_ids:
        await db.execute(
            book_genres.insert().values(book_id=book.id, genre_id=gid)
        )
    await sync_genre_cache(db, book)


async def get_book_genre_objects(db: AsyncSession, book: Book) -> list:
    """Return genre rows (id, name, slug) from the M:N relation."""
    result = await db.execute(
        select(Genre.id, Genre.name, Genre.slug)
        .join(book_genres, book_genres.c.genre_id == Genre.id)
        .where(book_genres.c.book_id == book.id)
    )
    return result.all()


async def get_book_genre_ids(db: AsyncSession, book: Book) -> List[str]:
    """Return genre UUIDs as strings from the M:N relation."""
    rows = await get_book_genre_objects(db, book)
    return [str(g[0]) for g in rows]


async def get_book_authors_data(db: AsyncSession, book: Book) -> list:
    """Return author dicts (id, name, country, structured names) from M:N."""
    result = await db.execute(
        select(
            Author.id, Author.name, Author.nationality,
            Author.first_name, Author.middle_name, Author.last_name,
            Author.native_name, Author.sort_name,
        )
        .join(book_authors, book_authors.c.author_id == Author.id)
        .where(book_authors.c.book_id == book.id)
    )
    return [{
        "id": str(a[0]),
        "name": a[1],
        "country": a[2],
        "first_name": a[3],
        "middle_name": a[4],
        "last_name": a[5],
        "native_name": a[6],
        "sort_name": a[7],
    } for a in result.all()]


async def get_book_author_count(db: AsyncSession, book: Book) -> int:
    """Return the number of authors linked via M:N."""
    result = await db.execute(
        select(func.count()).select_from(book_authors).where(book_authors.c.book_id == book.id)
    )
    return result.scalar() or 0


async def get_author_book_count(db: AsyncSession, author_id: UUID) -> int:
    """Return the number of books linked to an author via M:N."""
    result = await db.execute(
        select(func.count()).select_from(book_authors).where(book_authors.c.author_id == author_id)
    )
    return result.scalar() or 0


async def get_book_taxonomy_items(
    db: AsyncSession, book: Book, node_type: Optional[str] = None
) -> List[str]:
    """Return taxonomy node names connected to a book, optionally filtered by node_type."""
    query = (
        select(KnowledgeNode.name)
        .join(BookKnowledgeRelation, BookKnowledgeRelation.node_id == KnowledgeNode.id)
        .where(BookKnowledgeRelation.book_id == book.id)
        .where(BookKnowledgeRelation.status == "approved")
    )
    if node_type:
        query = query.where(KnowledgeNode.node_type == node_type)
    result = await db.execute(query)
    return [row[0] for row in result.all()]
