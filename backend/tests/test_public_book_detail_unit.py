import uuid

import pytest
from fastapi import HTTPException

from app.api.books import get_public_book_detail
from app.models.author import Author
from app.models.author_publication import AuthorPublication
from app.models.book import Book
from app.models.book_knowledge_relation import BookKnowledgeRelation
from app.models.genre import Genre
from app.models.knowledge_node import KnowledgeNode
from app.services.book_service import compose_public_book_detail
from app.schemas.book import PublicBookDetailResponse


class FakeResult:
    def __init__(self, values):
        self.values = values

    def scalars(self):
        return self

    def all(self):
        return self.values

    def scalar_one_or_none(self):
        return self.values[0] if self.values else None


class FakeSession:
    def __init__(self, results):
        self.results = list(results)

    async def execute(self, _query):
        return self.results.pop(0)


@pytest.mark.asyncio
async def test_public_book_detail_unit_composes_existing_relations():
    author = Author(id=uuid.uuid4(), name="Author", display_name="Display Author", slug="author")
    genre = Genre(id=uuid.uuid4(), name="Novel", slug="novel", type="literary")
    publication = AuthorPublication(
        id=uuid.uuid4(), author_id=author.id, title="Canonical Publication",
        original_title="Canonical Original", publication_year=1847, publication_type="novel",
    )
    book = Book(
        id=uuid.uuid4(), slug="book", title="Book", author=author.name, publication_id=publication.id,
        subtitle="Subtitle", original_title="Original", country_of_origin="United Kingdom",
        series_name="Series", series_position=2, total_pages=None,
    )
    node = KnowledgeNode(id=uuid.uuid4(), name="Identity", slug="identity", node_type="concept")
    relation = BookKnowledgeRelation(
        book_id=book.id, node_id=node.id, relation_type="explores",
        source="curator", status="approved", confidence=0.9,
    )
    session = FakeSession([
        FakeResult([author]),
        FakeResult([genre]),
        FakeResult([publication]),
        FakeResult([(relation, node)]),
    ])

    detail = await compose_public_book_detail(session, book)
    response = PublicBookDetailResponse.model_validate(detail)

    assert response.authors[0].display_name == "Display Author"
    assert detail["genres"][0]["slug"] == "novel"
    assert detail["knowledge"][0]["node_id"] == node.id
    assert detail["publication"]["id"] == publication.id
    assert detail["publication_year"] == 1847
    assert detail["subtitle"] == "Subtitle"
    assert detail["original_title"] == "Original"
    assert detail["country_of_origin"] == "United Kingdom"
    assert detail["series_name"] == "Series"
    assert detail["total_pages"] is None


@pytest.mark.asyncio
async def test_public_book_detail_unit_returns_true_404():
    session = FakeSession([FakeResult([]), FakeResult([])])

    with pytest.raises(HTTPException) as error:
        await get_public_book_detail(str(uuid.uuid4()), session)

    assert error.value.status_code == 404


@pytest.mark.asyncio
async def test_public_book_detail_returns_404_for_malformed_identifier():
    session = FakeSession([FakeResult([])])

    with pytest.raises(HTTPException) as error:
        await get_public_book_detail("not a valid slug", session)

    assert error.value.status_code == 404


@pytest.mark.asyncio
@pytest.mark.parametrize("lookup_by_slug", [True, False])
async def test_public_book_detail_supports_slug_and_legacy_id(lookup_by_slug):
    book = Book(
        id=uuid.uuid4(),
        slug="jane-eyre",
        title="Jane Eyre",
        author="Charlotte Brontë",
        is_published=True,
        moderation_status="approved",
    )
    lookup_results = [FakeResult([book])]
    lookup_value = book.slug
    if not lookup_by_slug:
        lookup_results = [FakeResult([]), FakeResult([book])]
        lookup_value = str(book.id)
    session = FakeSession(lookup_results + [FakeResult([]), FakeResult([]), FakeResult([])])

    detail = await get_public_book_detail(lookup_value, session)

    assert detail["id"] == book.id
    assert detail["slug"] == "jane-eyre"
