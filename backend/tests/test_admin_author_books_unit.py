from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from app.api.admin import get_books
from app.models.book import Book


class FakeResult:
    def __init__(self, values):
        self._values = values

    def scalars(self):
        return self

    def all(self):
        return self._values


class FakeSession:
    def __init__(self, books):
        self.books = books
        self.count_query = None
        self.books_query = None

    async def scalar(self, query):
        self.count_query = query
        return len(self.books)

    async def execute(self, query):
        self.books_query = query
        return FakeResult(self.books)


@pytest.mark.asyncio
async def test_admin_books_filters_canonical_authorship_by_book_authors():
    author_id = uuid4()
    book = Book(id=uuid4(), slug="linked-book", title="Linked Book", author="Legacy Name")
    session = FakeSession([book])
    current_user = SimpleNamespace(role="owner")

    with patch("app.api.admin._build_book_dict", new=AsyncMock(return_value={"id": str(book.id)})):
        response = await get_books(
            page=1,
            limit=50,
            search=None,
            genre=None,
            author_id=author_id,
            is_published=None,
            current_user=current_user,
            db=session,
        )

    count_sql = str(session.count_query)
    books_sql = str(session.books_query)
    assert "book_authors" in count_sql
    assert "book_authors" in books_sql
    assert author_id in session.count_query.compile().params.values()
    assert author_id in session.books_query.compile().params.values()
    assert "author_publications" not in books_sql
    assert response["data"] == [{"id": str(book.id)}]
    assert response["total"] == 1
