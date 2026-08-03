from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.api import admin_taxonomy
from app.models.book import Book
from app.models.book_knowledge_relation import BookKnowledgeRelation
from app.models.knowledge_node import KnowledgeNode
from app.schemas.taxonomy import BookKnowledgeRelationCreate


class _ScalarResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class _FakeSession:
    def __init__(self, book: Book, node: KnowledgeNode):
        self.results = iter([_ScalarResult(book), _ScalarResult(node)])
        self.added = None
        self.committed = False

    async def execute(self, _query):
        return next(self.results)

    def add(self, value):
        self.added = value

    async def commit(self):
        self.committed = True

    async def refresh(self, value):
        value.id = uuid4()
        value.created_at = datetime.now(timezone.utc)


def test_studio_payload_validates_without_server_owned_fields():
    payload = BookKnowledgeRelationCreate.model_validate({
        "node_id": str(uuid4()),
        "relation_type": "theme",
        "status": "approved",
    })

    assert payload.relation_type == "theme"
    assert payload.status == "approved"
    assert payload.confidence == 0.5


@pytest.mark.asyncio
async def test_admin_relation_creation_derives_book_and_source(monkeypatch):
    book = Book(id=uuid4(), slug="jane-eyre", title="Jane Eyre", author="Charlotte Bronte")
    node = KnowledgeNode(id=uuid4(), name="Love", slug="love", node_type="theme")
    session = _FakeSession(book, node)

    async def _skip_recalculation(_db, _book):
        return None

    monkeypatch.setattr(admin_taxonomy, "recalculate_metadata_status", _skip_recalculation)

    response = await admin_taxonomy.connect_book_to_node(
        book_id=book.id,
        data=BookKnowledgeRelationCreate(
            node_id=node.id,
            relation_type="theme",
            status="approved",
        ),
        current_user=SimpleNamespace(role="admin", email="editor@example.com"),
        db=session,
    )

    assert isinstance(session.added, BookKnowledgeRelation)
    assert session.added.book_id == book.id
    assert session.added.source == "admin"
    assert session.added.status == "approved"
    assert session.committed is True
    assert response.node_name == "Love"
