from collections.abc import Iterable
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.author import Author
from app.models.author_publication import AuthorPublication
from app.models.author_publication_author import AuthorPublicationAuthor
from app.models.book import Book
from app.models.book_author import book_authors


def _clean_credit(value: str | None) -> str | None:
    cleaned = value.strip() if value else ""
    return cleaned or None


async def create_primary_work_authorship(
    db: AsyncSession,
    publication: AuthorPublication,
    author_id: UUID,
    credited_name: str | None = None,
) -> AuthorPublicationAuthor:
    """Create the canonical position-1 credit and synchronize legacy caches."""
    row = AuthorPublicationAuthor(
        publication_id=publication.id,
        author_id=author_id,
        position=1,
        credited_name=_clean_credit(credited_name),
    )
    db.add(row)
    publication.author_id = author_id
    publication.pen_name = row.credited_name
    return row


async def replace_work_authorships(
    db: AsyncSession,
    publication: AuthorPublication,
    credits: Iterable,
) -> list[AuthorPublicationAuthor]:
    """Atomically replace canonical Work authorship in deterministic order.

    Positions must be exactly 1..N. The legacy ``author_id`` and ``pen_name``
    columns mirror the position-1 credit and are never an independent authority.
    """
    values = list(credits)
    if not values:
        raise HTTPException(status_code=422, detail="A canonical Work needs at least one author")

    positions = [item.position for item in values]
    author_ids = [item.author_id for item in values]
    if sorted(positions) != list(range(1, len(values) + 1)):
        raise HTTPException(status_code=422, detail="Authorship positions must be contiguous from 1")
    if len(set(author_ids)) != len(author_ids):
        raise HTTPException(status_code=422, detail="An Author may appear only once on a Work")

    authors = list(
        (
            await db.execute(select(Author).where(Author.id.in_(author_ids)))
        ).scalars().all()
    )
    authors_by_id = {author.id: author for author in authors}
    if set(authors_by_id) != set(author_ids):
        raise HTTPException(status_code=422, detail="One or more canonical Authors do not exist")

    linked_books = list(
        (
            await db.execute(select(Book).where(Book.publication_id == publication.id))
        ).scalars().all()
    )
    for book in linked_books:
        representation_authors = set(
            (
                await db.execute(
                    select(book_authors.c.author_id).where(book_authors.c.book_id == book.id)
                )
            ).scalars().all()
        )
        if representation_authors != set(author_ids):
            raise HTTPException(
                status_code=409,
                detail="Linked Book authorship contradicts the proposed canonical Work authorship",
            )

    await db.execute(
        delete(AuthorPublicationAuthor).where(
            AuthorPublicationAuthor.publication_id == publication.id
        )
    )
    rows = [
        AuthorPublicationAuthor(
            publication_id=publication.id,
            author_id=item.author_id,
            position=item.position,
            credited_name=_clean_credit(item.credited_name),
        )
        for item in sorted(values, key=lambda item: item.position)
    ]
    db.add_all(rows)
    publication.author_id = rows[0].author_id
    publication.pen_name = rows[0].credited_name
    primary = authors_by_id[rows[0].author_id]
    for book in linked_books:
        book.author_id = primary.id
        book.author = primary.name
    return rows


async def sync_primary_credited_name(
    db: AsyncSession,
    publication: AuthorPublication,
    credited_name: str | None,
) -> None:
    primary = await db.scalar(
        select(AuthorPublicationAuthor).where(
            AuthorPublicationAuthor.publication_id == publication.id,
            AuthorPublicationAuthor.position == 1,
        )
    )
    if primary is None:
        raise HTTPException(status_code=409, detail="Canonical Work authorship is missing")
    primary.credited_name = _clean_credit(credited_name)
    publication.pen_name = primary.credited_name


async def validate_book_work_authorship(
    db: AsyncSession,
    book_id: UUID,
    publication_id: UUID,
    representation_author_ids: set[UUID] | None = None,
) -> None:
    """Require exact Author-ID set equality between Work and representation."""
    work_author_ids = set(
        (
            await db.execute(
                select(AuthorPublicationAuthor.author_id).where(
                    AuthorPublicationAuthor.publication_id == publication_id
                )
            )
        ).scalars().all()
    )
    if not work_author_ids:
        raise HTTPException(status_code=409, detail="Canonical Work authorship is missing")

    if representation_author_ids is None:
        representation_author_ids = set(
            (
                await db.execute(
                    select(book_authors.c.author_id).where(book_authors.c.book_id == book_id)
                )
            ).scalars().all()
        )
    if representation_author_ids != work_author_ids:
        raise HTTPException(
            status_code=409,
            detail="Book authorship contradicts canonical Work authorship",
        )


async def serialize_authored_works(db: AsyncSession, author_id: UUID) -> list[dict]:
    """Canonical Author -> Work read model; never derives identity from Books."""
    publications = list(
        (
            await db.execute(
                select(AuthorPublication)
                .join(
                    AuthorPublicationAuthor,
                    AuthorPublicationAuthor.publication_id == AuthorPublication.id,
                )
                .where(AuthorPublicationAuthor.author_id == author_id)
                .order_by(AuthorPublication.publication_year, AuthorPublication.id)
            )
        ).scalars().unique().all()
    )
    if not publications:
        return []

    publication_ids = [publication.id for publication in publications]
    credit_rows = (
        await db.execute(
            select(AuthorPublicationAuthor, Author)
            .join(Author, Author.id == AuthorPublicationAuthor.author_id)
            .where(AuthorPublicationAuthor.publication_id.in_(publication_ids))
            .order_by(
                AuthorPublicationAuthor.publication_id,
                AuthorPublicationAuthor.position,
            )
        )
    ).all()
    book_rows = (
        await db.execute(
            select(Book.publication_id, Book.id, Book.title)
            .where(Book.publication_id.in_(publication_ids))
            .order_by(Book.publication_id, Book.id)
        )
    ).all()

    credits_by_publication: dict[UUID, list[dict]] = {pid: [] for pid in publication_ids}
    for credit, author in credit_rows:
        credits_by_publication[credit.publication_id].append(
            {
                "author_id": str(author.id),
                "position": credit.position,
                "credited_name": credit.credited_name,
                "canonical_name": author.display_name or author.name,
            }
        )
    books_by_publication: dict[UUID, list[dict]] = {pid: [] for pid in publication_ids}
    for publication_id, book_id, title in book_rows:
        books_by_publication[publication_id].append(
            {"id": str(book_id), "title": title}
        )

    return [
        {
            "id": str(publication.id),
            "author_id": str(publication.author_id),
            "title": publication.title,
            "original_title": publication.original_title,
            "publication_year": publication.publication_year,
            "publication_date": (
                publication.publication_date.isoformat() if publication.publication_date else None
            ),
            "publication_type": publication.publication_type,
            "description": publication.description,
            "pen_name": publication.pen_name,
            "wikipedia_url": publication.wikipedia_url,
            "source_id": str(publication.source_id) if publication.source_id else None,
            "created_at": publication.created_at.isoformat() if publication.created_at else None,
            "updated_at": publication.updated_at.isoformat() if publication.updated_at else None,
            "authors": credits_by_publication[publication.id],
            "linked_books": books_by_publication[publication.id],
            "linked_book_count": len(books_by_publication[publication.id]),
        }
        for publication in publications
    ]
