from uuid import uuid4

import pytest

from app.api import books, graph
from app.models.book import Book
from app.services.book_slug import generate_unique_book_slug, slugify_book_title


class _Result:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class _Session:
    def __init__(self, values):
        self.values = iter(values)

    async def execute(self, _query):
        return _Result(next(self.values))


def test_slug_transliterates_and_normalizes_titles():
    assert slugify_book_title("Jane Eyre") == "jane-eyre"
    assert slugify_book_title("Преступление и наказание") == "prestuplenie-i-nakazanie"
    assert slugify_book_title("123e4567-e89b-12d3-a456-426614174000") == (
        "book-123e4567-e89b-12d3-a456-426614174000"
    )


def test_title_edits_do_not_regenerate_an_existing_slug():
    book = Book(slug="jane-eyre", title="Jane Eyre", author="Charlotte Brontë")

    book.title = "Jane Eyre: A Novel"

    assert book.slug == "jane-eyre"


@pytest.mark.asyncio
async def test_duplicate_slug_prefers_readable_year_suffix():
    slug = await generate_unique_book_slug(
        _Session([uuid4(), None]),
        "Dune",
        publication_year=1965,
        book_id=uuid4(),
    )

    assert slug == "dune-1965"


@pytest.mark.asyncio
async def test_duplicate_slug_falls_back_to_stable_short_id():
    book_id = uuid4()
    slug = await generate_unique_book_slug(
        _Session([uuid4(), None]),
        "Dune",
        book_id=book_id,
    )

    assert slug == f"dune-{str(book_id)[:8]}"


def test_static_book_routes_precede_public_dynamic_lookup():
    paths = [route.path for route in books.router.routes]
    dynamic_index = paths.index("/books/{slug_or_id}")

    assert paths.index("/books/catalog/") < dynamic_index
    assert paths.index("/books/user-books/") < dynamic_index
    assert "/books/{book_id}/status" in paths

    detail_route = books.router.routes[dynamic_index]
    graph_route = next(route for route in graph.router.routes if route.path == "/books/{book_id}/graph")
    assert detail_route.path_regex.fullmatch("/books/book-id/graph") is None
    assert graph_route.path_regex.fullmatch("/books/book-id/graph") is not None
