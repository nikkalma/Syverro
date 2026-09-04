import os
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

import app.models  # noqa: F401
from app.database import Base
from app.models.author import Author
from app.models.author_publication import AuthorPublication
from app.models.author_publication_author import AuthorPublicationAuthor
from app.models.book import Book
from app.models.book_author import book_authors
from app.services.work_authorship import (
    create_primary_work_authorship,
    replace_work_authorships,
    serialize_authored_works,
    validate_book_work_authorship,
)


TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://test:test@localhost:5432/syverro_test",
    ),
)


def _async_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


@pytest.fixture
async def session():
    engine = create_async_engine(_async_url(TEST_DATABASE_URL))
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except Exception:
        await engine.dispose()
        pytest.skip("PostgreSQL is required for canonical Work-authorship tests")

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    async with AsyncSession(engine, expire_on_commit=False) as db:
        yield db
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.mark.asyncio
async def test_canonical_query_deduplicates_representations_and_preserves_order_and_credit(session):
    first = Author(name="Canonical Person", display_name="Canonical Person")
    second = Author(name="Coauthor")
    session.add_all([first, second])
    await session.flush()

    work = AuthorPublication(
        author_id=first.id,
        title="Localized Work Title",
        original_title="Original Work Title",
        publication_year=1953,
        publication_type="novel",
    )
    session.add(work)
    await session.flush()
    await create_primary_work_authorship(session, work, first.id, "A Pen Name")
    await session.flush()
    await replace_work_authorships(
        session,
        work,
        [
            SimpleNamespace(author_id=first.id, position=1, credited_name="A Pen Name"),
            SimpleNamespace(author_id=second.id, position=2, credited_name=None),
        ],
    )
    await session.flush()

    books = [
        Book(slug="original-edition", title="Original Work Title", author="ignored", publication_id=work.id),
        Book(slug="translated-edition", title="Translated Title", author="localized", publication_id=work.id),
    ]
    session.add_all(books)
    await session.flush()
    for book in books:
        await session.execute(
            book_authors.insert(),
            [
                {"book_id": book.id, "author_id": first.id},
                {"book_id": book.id, "author_id": second.id},
            ],
        )
    await session.commit()

    first_works = await serialize_authored_works(session, first.id)
    second_works = await serialize_authored_works(session, second.id)

    assert len(first_works) == len(second_works) == 1
    assert first_works[0]["id"] == second_works[0]["id"] == str(work.id)
    assert first_works[0]["original_title"] == "Original Work Title"
    assert first_works[0]["linked_book_count"] == 2
    assert [credit["position"] for credit in first_works[0]["authors"]] == [1, 2]
    assert first_works[0]["authors"][0]["credited_name"] == "A Pen Name"
    assert work.author_id == first.id
    assert work.pen_name == "A Pen Name"

    await replace_work_authorships(
        session,
        work,
        [
            SimpleNamespace(author_id=second.id, position=1, credited_name=None),
            SimpleNamespace(author_id=first.id, position=2, credited_name="A Pen Name"),
        ],
    )
    await session.flush()
    assert work.author_id == second.id
    assert work.pen_name is None
    assert all(book.author_id == second.id and book.author == second.name for book in books)


@pytest.mark.asyncio
async def test_book_link_consistency_uses_author_ids_not_display_strings(session):
    author = Author(name="Canonical Name")
    unrelated = Author(name="Unrelated")
    session.add_all([author, unrelated])
    await session.flush()
    work = AuthorPublication(
        author_id=author.id,
        title="Fahrenheit 451",
        publication_year=1953,
        publication_type="novel",
    )
    session.add(work)
    await session.flush()
    await create_primary_work_authorship(session, work, author.id)
    book = Book(slug="fahrenheit-localized", title="451 degrees", author="arbitrary display")
    session.add(book)
    await session.flush()
    await session.execute(
        book_authors.insert().values(book_id=book.id, author_id=author.id)
    )
    await session.flush()

    await validate_book_work_authorship(session, book.id, work.id)

    await session.execute(
        book_authors.delete().where(book_authors.c.book_id == book.id)
    )
    await session.execute(
        book_authors.insert().values(book_id=book.id, author_id=unrelated.id)
    )
    with pytest.raises(HTTPException, match="contradicts canonical Work authorship"):
        await validate_book_work_authorship(session, book.id, work.id)


@pytest.mark.asyncio
async def test_authorship_replacement_requires_contiguous_unique_positions(session):
    author = Author(name="One")
    session.add(author)
    await session.flush()
    work = AuthorPublication(
        author_id=author.id,
        title="Work",
        publication_year=2000,
        publication_type="novel",
    )
    session.add(work)
    await session.flush()

    with pytest.raises(HTTPException, match="contiguous"):
        await replace_work_authorships(
            session,
            work,
            [SimpleNamespace(author_id=author.id, position=2, credited_name=None)],
        )


def test_migration_backfills_primary_authorship_without_creating_works():
    migration = Path(__file__).parents[1] / "alembic" / "versions" / "0027_canonical_work_authorship.py"
    with migration.open(encoding="utf-8") as source:
        contents = source.read()
    assert "SELECT id, author_id, 1" in contents
    assert "FROM author_publications" in contents
    assert "ON CONFLICT (publication_id, author_id) DO NOTHING" in contents
    assert "INSERT INTO author_publications" not in contents
