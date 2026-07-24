"""Regression tests for Book domain source-of-truth refactor.

Tests verify that:
1. Book with only book_authors M:N relation returns author correctly.
2. Book with genres through book_genres reaches metadata_complete.
3. Taxonomy relations return themes/motifs.
4. Author count matches book_authors count.
"""

import os
import uuid

import pytest
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

import app.models  # noqa: F401 — populate Base.metadata
from app.database import Base
from app.models.book import Book
from app.models.author import Author
from app.models.genre import Genre
from app.models.book_author import book_authors
from app.models.book_genre import book_genres
from app.models.knowledge_node import KnowledgeNode
from app.models.book_knowledge_relation import BookKnowledgeRelation
from app.services.book_service import (
    get_primary_author, get_book_authors, get_book_author_count,
    get_author_book_count, get_book_genre_ids, get_book_genre_objects,
    get_book_taxonomy_items, link_author, sync_book_genres,
    sync_author_cache, sync_genre_cache,
)
from app.core.metadata import calculate_missing_fields, get_metadata_status
from app.services.metadata_service import recalculate_metadata_status

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://test:test@localhost:5432/syverro_test",
    ),
)


def _normalize_async_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


async def _postgres_reachable(url: str) -> bool:
    engine = create_async_engine(url)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
    finally:
        await engine.dispose()


@pytest.fixture
async def pg_engine():
    url = _normalize_async_url(TEST_DATABASE_URL)
    if not await _postgres_reachable(url):
        pytest.skip(f"Postgres not reachable at {url}")

    engine = create_async_engine(url, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def session(pg_engine):
    async with AsyncSession(pg_engine) as session:
        yield session


# ============================================================
# Test 1: Author via M:N (no legacy FK)
# ============================================================


@pytest.mark.asyncio
async def test_author_returned_from_mn_relation_only(session: AsyncSession):
    """Book linked to author only via book_authors (no author_id FK) returns author."""
    author = Author(name="Test Author", nationality="Testland")
    session.add(author)
    await session.flush()

    book = Book(
        id=uuid.uuid4(),
        title="Test Book",
        author="",
        author_id=None,
    )
    session.add(book)
    await session.flush()

    # Link via M:N only
    await session.execute(
        book_authors.insert().values(book_id=book.id, author_id=author.id)
    )
    await session.commit()

    # Verify via service
    primary = await get_primary_author(session, book)
    assert primary is not None
    assert primary.name == "Test Author"
    assert primary.nationality == "Testland"

    authors_list = await get_book_authors(session, book)
    assert len(authors_list) == 1
    assert authors_list[0].id == author.id


# ============================================================
# Test 2: Genre completeness via M:N
# ============================================================


@pytest.mark.asyncio
async def test_genre_completeness_via_mn(session: AsyncSession):
    """Book with genres only via book_genres reaches metadata_complete for genres."""
    genre = Genre(name="Fantasy", slug="fantasy")
    session.add(genre)
    await session.flush()

    book = Book(
        id=uuid.uuid4(),
        title="Test Book",
        description="A test description.",
        cover="http://example.com/cover.jpg",
        author="Test Author",
        genres=[],
    )
    session.add(book)
    await session.flush()

    # Link genre via M:N
    await sync_book_genres(session, book, [genre.id])
    await session.commit()

    # Verify
    genre_ids = await get_book_genre_ids(session, book)
    assert len(genre_ids) == 1

    genre_objects = await get_book_genre_objects(session, book)
    assert len(genre_objects) == 1
    assert genre_objects[0][1] == "Fantasy"

    # Metadata check — should not report genres as missing
    author_count = await get_book_author_count(session, book)
    genre_count = len(genre_ids)
    missing = calculate_missing_fields(book, author_count=author_count, genre_count=genre_count)
    assert "genres" not in missing, "genres should not be missing when M:N relation exists"


# ============================================================
# Test 3: Taxonomy returns themes/motifs
# ============================================================


@pytest.mark.asyncio
async def test_taxonomy_returns_themes_and_motifs(session: AsyncSession):
    """BookKnowledgeRelation with KnowledgeNode returns themes/motifs via service."""
    theme_node = KnowledgeNode(name="Redemption", slug="redemption", node_type="theme")
    motif_node = KnowledgeNode(name="Journey", slug="journey", node_type="motif")
    session.add_all([theme_node, motif_node])
    await session.flush()

    book = Book(
        id=uuid.uuid4(),
        title="Test Book",
        author="Test Author",
    )
    session.add(book)
    await session.flush()

    # Link nodes via BookKnowledgeRelation
    for node, rtype in [(theme_node, "explores"), (motif_node, "contains")]:
        rel = BookKnowledgeRelation(
            book_id=book.id,
            node_id=node.id,
            relation_type=rtype,
            source="admin",
            status="approved",
        )
        session.add(rel)
    await session.commit()

    # Verify
    themes = await get_book_taxonomy_items(session, book, node_type="theme")
    assert "Redemption" in themes

    motifs = await get_book_taxonomy_items(session, book, node_type="motif")
    assert "Journey" in motifs

    all_items = await get_book_taxonomy_items(session, book)
    assert set(all_items) == {"Redemption", "Journey"}


# ============================================================
# Test 4: Author count via M:N
# ============================================================


@pytest.mark.asyncio
async def test_author_book_count_matches_mn(session: AsyncSession):
    """get_author_book_count returns correct count matching book_authors."""
    author = Author(name="Prolific Author")
    session.add(author)
    await session.flush()

    book_ids = []
    for i in range(3):
        bid = uuid.uuid4()
        book_ids.append(bid)
        book = Book(id=bid, title=f"Book {i}", author=f"Book {i} Author")
        session.add(book)
        await session.flush()

        await session.execute(
            book_authors.insert().values(book_id=bid, author_id=author.id)
        )
    await session.commit()

    count = await get_author_book_count(session, author.id)
    assert count == 3


# ============================================================
# Test 5: Genre cache sync updates Book.genres JSON
# ============================================================


@pytest.mark.asyncio
async def test_sync_genre_cache_updates_book_genres_json(session: AsyncSession):
    """sync_book_genres (via sync_genre_cache) populates Book.genres JSON from M:N."""
    genre = Genre(name="Fantasy", slug="fantasy")
    session.add(genre)
    await session.flush()

    book = Book(
        id=uuid.uuid4(),
        title="Cache Test Book",
        author="Test Author",
        genres=[],
    )
    session.add(book)
    await session.flush()
    assert book.genres == []

    # Sync via M:N — should also update Book.genres
    await sync_book_genres(session, book, [genre.id])
    await session.commit()
    await session.refresh(book)

    assert book.genres == ["Fantasy"], f"Expected ['Fantasy'], got {book.genres}"


# ============================================================
# Test 6: Sync clears genre cache when M:N is emptied
# ============================================================


@pytest.mark.asyncio
async def test_sync_genre_cache_clears_when_empty(session: AsyncSession):
    """Clearing M:N relations empties Book.genres JSON."""
    genre = Genre(name="Fantasy", slug="fantasy")
    session.add(genre)
    await session.flush()

    book = Book(
        id=uuid.uuid4(),
        title="Clear Cache Book",
        author="Test Author",
        genres=["Fantasy", "Sci-Fi"],
    )
    session.add(book)
    await session.flush()

    # Sync with empty list — should clear M:N and Book.genres
    await sync_book_genres(session, book, [])
    await session.commit()
    await session.refresh(book)

    assert book.genres == [], f"Expected [], got {book.genres}"


# ============================================================
# Test 7: Compatibility — cache fields populated from M:N
# ============================================================


@pytest.mark.asyncio
async def test_compatibility_cache_fields_synced_from_mn(session: AsyncSession):
    """Verify sync_author_cache and sync_genre_cache populate Book compat fields."""
    author = Author(name="Compat Author", nationality="Compatland")
    session.add(author)
    genre = Genre(name="Fantasy", slug="fantasy")
    session.add(genre)
    await session.flush()

    book = Book(
        id=uuid.uuid4(),
        title="Compat Book",
        author="",
        author_id=None,
        genres=[],
    )
    session.add(book)
    await session.flush()

    # Link via M:N and sync author cache
    await link_author(session, book, author)
    assert book.author == "Compat Author", f"Expected 'Compat Author', got '{book.author}'"
    assert book.author_id == author.id, f"Expected {author.id}, got {book.author_id}"

    # Link genre via M:N and sync genre cache
    await sync_book_genres(session, book, [genre.id])
    assert book.genres == ["Fantasy"], f"Expected ['Fantasy'], got {book.genres}"

    # Direct sync_author_cache also works
    book.author = ""
    book.author_id = None
    await sync_author_cache(session, book)
    assert book.author == "Compat Author"
    assert book.author_id == author.id

    # Direct sync_genre_cache also works
    book.genres = []
    await sync_genre_cache(session, book)
    assert book.genres == ["Fantasy"]


# ============================================================
# Test 8: Public API response returns taxonomy from graph
# ============================================================


@pytest.mark.asyncio
async def test_public_book_response_returns_taxonomy_from_graph(session: AsyncSession):
    """_book_to_response_dict returns themes/motifs from BookKnowledgeRelation."""
    from app.api.books import _book_to_response_dict

    theme_node = KnowledgeNode(name="Redemption", slug="redemption", node_type="theme")
    motif_node = KnowledgeNode(name="Journey", slug="journey", node_type="motif")
    session.add_all([theme_node, motif_node])
    await session.flush()

    book = Book(
        id=uuid.uuid4(),
        title="Taxonomy Response Book",
        author="Test Author",
    )
    session.add(book)
    await session.flush()

    for node, rtype in [(theme_node, "explores"), (motif_node, "contains")]:
        rel = BookKnowledgeRelation(
            book_id=book.id,
            node_id=node.id,
            relation_type=rtype,
            source="admin",
            status="approved",
        )
        session.add(rel)
    await session.commit()

    result = await _book_to_response_dict(session, book)
    assert "themes" in result, "themes key missing from response"
    assert "motifs" in result, "motifs key missing from response"
    assert result["themes"] == ["Redemption"], f"Expected ['Redemption'], got {result['themes']}"
    assert result["motifs"] == ["Journey"], f"Expected ['Journey'], got {result['motifs']}"


# ============================================================
# Test 9: Metadata complete with M:N genres
# ============================================================


@pytest.mark.asyncio
async def test_metadata_complete_with_mn_genres(session: AsyncSession):
    """Book with all required fields + M:N genres reaches metadata_status=complete."""
    genre = Genre(name="Fantasy", slug="fantasy")
    session.add(genre)
    author = Author(name="Test Author")
    session.add(author)
    await session.flush()

    book = Book(
        id=uuid.uuid4(),
        title="Complete Test",
        author="Test Author",
        description="Has description",
        cover="http://example.com/c.jpg",
        genres=[],
    )
    session.add(book)
    await session.flush()

    await link_author(session, book, author)
    await sync_book_genres(session, book, [genre.id])
    await session.commit()

    author_count = await get_book_author_count(session, book)
    genre_count = len(await get_book_genre_ids(session, book))
    missing = calculate_missing_fields(book, author_count=author_count, genre_count=genre_count)
    status = get_metadata_status(missing)
    assert status == "complete", f"Expected 'complete', got '{status}'"
    assert missing == [], f"Expected empty missing, got {missing}"


# ============================================================
# Test 10: Metadata complete with M:N authors
# ============================================================


@pytest.mark.asyncio
async def test_metadata_complete_with_authors(session: AsyncSession):
    """Book with authors only via M:N (no author_id FK) reaches metadata complete."""
    author = Author(name="M:N Author")
    session.add(author)
    await session.flush()

    book = Book(
        id=uuid.uuid4(),
        title="MN Author Test",
        author="",
        author_id=None,
        description="Has description",
        cover="http://example.com/c.jpg",
        genres=["Fantasy"],
    )
    session.add(book)
    await session.flush()

    await link_author(session, book, author)
    await session.commit()

    # Author via M:N, genres via JSON (legacy path)
    author_count = await get_book_author_count(session, book)
    genre_count = len(await get_book_genre_ids(session, book))
    missing = calculate_missing_fields(book, author_count=author_count, genre_count=genre_count)
    assert "authors" not in missing, "authors should not be missing when linked via M:N"
    assert book.author != "", "cache field should be synced"


# ============================================================
# Test 11: Metadata ignores legacy JSON genre field
# ============================================================


@pytest.mark.asyncio
async def test_metadata_ignores_legacy_json_fields(session: AsyncSession):
    """Metadata completeness does NOT check Book.genres JSON — only M:N counts."""
    book = Book(
        id=uuid.uuid4(),
        title="JSON Genre Test",
        author="Test Author",
        description="Has description",
        cover="http://example.com/c.jpg",
        genres=["Fantasy", "Sci-Fi"],
    )
    session.add(book)
    await session.flush()

    # No M:N genre relation exists, only JSON
    author_count = await get_book_author_count(session, book)
    genre_count = len(await get_book_genre_ids(session, book))
    missing = calculate_missing_fields(book, author_count=author_count, genre_count=genre_count)
    assert "genres" in missing, "genres should be missing when no M:N relation exists despite JSON cache"
    assert genre_count == 0, "genre_count should be 0 when no M:N relation exists"


# ============================================================
# Test 12: Taxonomy does not break metadata
# ============================================================


@pytest.mark.asyncio
async def test_taxonomy_does_not_break_metadata(session: AsyncSession):
    """Themes/motifs via BookKnowledgeRelation do not affect metadata completeness."""
    theme_node = KnowledgeNode(name="Redemption", slug="redemption", node_type="theme")
    session.add(theme_node)
    genre = Genre(name="Fantasy", slug="fantasy")
    session.add(genre)
    author = Author(name="Test Author")
    session.add(author)
    await session.flush()

    book = Book(
        id=uuid.uuid4(),
        title="Taxonomy Metadata Test",
        author="Test Author",
        description="Has description",
        cover="http://example.com/c.jpg",
    )
    session.add(book)
    await session.flush()

    await link_author(session, book, author)
    await sync_book_genres(session, book, [genre.id])

    rel = BookKnowledgeRelation(
        book_id=book.id,
        node_id=theme_node.id,
        relation_type="explores",
        source="admin",
        status="approved",
    )
    session.add(rel)
    await session.commit()

    author_count = await get_book_author_count(session, book)
    genre_count = len(await get_book_genre_ids(session, book))
    missing = calculate_missing_fields(book, author_count=author_count, genre_count=genre_count)
    status = get_metadata_status(missing)
    assert status == "complete", "taxonomy should not block metadata completeness"
    assert "genres" not in missing, "M:N genres should be recognized"
    assert "authors" not in missing, "M:N authors should be recognized"

    # Verify taxonomy items are accessible independently
    themes = await get_book_taxonomy_items(session, book, node_type="theme")
    assert "Redemption" in themes


# ============================================================
# Test 13: Recalculate metadata uses M:N sources only
# ============================================================


@pytest.mark.asyncio
async def test_recalculate_metadata_uses_mn_sources(session: AsyncSession):
    """recalculate_metadata_status reads from M:N, not from JSON cache fields."""
    genre = Genre(name="Fantasy", slug="fantasy")
    session.add(genre)
    author = Author(name="Test Author")
    session.add(author)
    await session.flush()

    book = Book(
        id=uuid.uuid4(),
        title="Recalc Test",
        author="",               # empty cache — should not matter
        author_id=None,
        description="Has description",
        cover="http://example.com/c.jpg",
        genres=[],               # empty JSON — should not matter
        metadata_status="draft",
    )
    session.add(book)
    await session.flush()

    await link_author(session, book, author)
    await sync_book_genres(session, book, [genre.id])
    await session.commit()

    await recalculate_metadata_status(session, book)
    assert book.metadata_status == "complete", \
        f"Expected 'complete' from M:N sources, got '{book.metadata_status}'"


# ============================================================
# Test 14: Taxonomy mutation triggers metadata recalculation
# ============================================================


@pytest.mark.asyncio
async def test_taxonomy_mutation_triggers_metadata_recalculation(session: AsyncSession):
    """Adding a taxonomy relation does not break metadata completeness."""
    theme_node = KnowledgeNode(name="Redemption", slug="redemption", node_type="theme")
    session.add(theme_node)
    genre = Genre(name="Fantasy", slug="fantasy")
    session.add(genre)
    author = Author(name="Test Author")
    session.add(author)
    await session.flush()

    book = Book(
        id=uuid.uuid4(),
        title="Taxonomy Trigger Test",
        author="Test Author",
        description="Has description",
        cover="http://example.com/c.jpg",
        metadata_status="draft",
    )
    session.add(book)
    await session.flush()

    await link_author(session, book, author)
    await sync_book_genres(session, book, [genre.id])
    await recalculate_metadata_status(session, book)
    assert book.metadata_status == "complete", "book should be complete before taxonomy mutation"

    # Add taxonomy — should not degrade metadata
    rel = BookKnowledgeRelation(
        book_id=book.id,
        node_id=theme_node.id,
        relation_type="explores",
        source="admin",
        status="approved",
    )
    session.add(rel)
    await recalculate_metadata_status(session, book)
    assert book.metadata_status == "complete", \
        f"adding taxonomy should not break completeness, got '{book.metadata_status}'"

    # Remove all genres — should degrade
    await sync_book_genres(session, book, [])
    await recalculate_metadata_status(session, book)
    assert book.metadata_status != "complete", \
        "removing all M:N genres should degrade metadata_status"


# ============================================================
# Test 15: Approval preserves metadata completeness
# ============================================================


@pytest.mark.asyncio
async def test_approval_does_not_destroy_complete_metadata(session: AsyncSession):
    """Moderation approval does not reset metadata_status to incomplete."""
    genre = Genre(name="Fantasy", slug="fantasy")
    session.add(genre)
    author = Author(name="Test Author")
    session.add(author)
    await session.flush()

    book = Book(
        id=uuid.uuid4(),
        title="Approval Test",
        author="Test Author",
        description="Has description",
        cover="http://example.com/c.jpg",
        metadata_status="draft",
        moderation_status="pending",
        is_published=False,
    )
    session.add(book)
    await session.flush()

    await link_author(session, book, author)
    await sync_book_genres(session, book, [genre.id])
    await recalculate_metadata_status(session, book)
    assert book.metadata_status == "complete", \
        f"Expected 'complete' before approval, got '{book.metadata_status}'"

    # Simulate approval
    book.moderation_status = "approved"
    book.moderated_by = author.id
    book.is_published = True
    # Do NOT reset metadata_status

    assert book.metadata_status == "complete", \
        f"approval should not destroy metadata completeness, got '{book.metadata_status}'"
