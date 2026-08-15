from uuid import uuid4

import pytest

from app.graph.service import get_book_graph
from app.models.author import Author
from app.models.book import Book


class _Result:
    def __init__(self, values):
        self._values = values

    def scalar_one_or_none(self):
        return self._values[0] if self._values else None

    def scalars(self):
        return self

    def all(self):
        return self._values


class _Session:
    def __init__(self, results):
        self._results = iter(results)

    async def execute(self, _query):
        return _Result(next(self._results))


@pytest.mark.asyncio
async def test_public_book_graph_contains_only_page_backed_entity_types():
    book = Book(
        id=uuid4(), slug="jane-eyre", title="Jane Eyre",
        is_published=True, moderation_status="approved",
    )
    author = Author(
        id=uuid4(), slug="charlotte-bronte", name="Charlotte Bronte",
        metadata_status="golden",
    )
    graph = await get_book_graph(_Session([[book], [author]]), book.id, depth=2)

    assert {node["type"] for node in graph["nodes"]} == {"book", "author"}
    assert graph["relations"] == [{
        "source": str(author.id),
        "target": str(book.id),
        "relation_type": "wrote",
    }]


@pytest.mark.asyncio
async def test_nonpublic_book_has_no_public_graph():
    assert await get_book_graph(_Session([[]]), uuid4(), depth=2) is None
