from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest

from app.services.author_slug import (
    audit_author_slug_records,
    author_slug_base,
    generate_author_slug,
)
from app.api.admin import create_author, update_author
from app.models.author import Author
from app.schemas.author import AuthorCreate, AuthorUpdate


class Result:
    def __init__(self, occupied): self.occupied = occupied
    def scalar_one_or_none(self): return uuid4() if self.occupied else None


class FakeDB:
    def __init__(self, occupied): self.occupied = iter(occupied)
    async def execute(self, _query): return Result(next(self.occupied))


@pytest.mark.parametrize("name,expected", [
    ("Ray Bradbury", "ray-bradbury"),
    ("Jane Austen", "jane-austen"),
    ("Фёдор Достоевский", "fiodor-dostoevskii"),
    ("한강", "hangang"),
    ("Gabriel García Márquez", "gabriel-garcia-marquez"),
    ("  O’Connor — Writer! ", "o-connor-writer"),
])
def test_slug_base_is_stable_ascii(name, expected):
    assert author_slug_base(name) == expected
    assert author_slug_base(name) == expected


@pytest.mark.asyncio
async def test_existing_slug_is_preserved_without_query():
    assert await generate_author_slug(FakeDB([]), canonical_name="Changed Name", author_id=uuid4(), existing_slug="stable-url") == "stable-url"


@pytest.mark.asyncio
async def test_collision_prefers_birth_year_then_stable_uuid():
    author_id = UUID("12345678-1234-5678-1234-567812345678")
    assert await generate_author_slug(FakeDB([True, False]), canonical_name="Ray Bradbury", author_id=author_id, birth_year=1920) == "ray-bradbury-1920"
    first = await generate_author_slug(FakeDB([True, True, False]), canonical_name="Ray Bradbury", author_id=author_id, birth_year=1920)
    second = await generate_author_slug(FakeDB([True, True, False]), canonical_name="Ray Bradbury", author_id=author_id, birth_year=1920)
    assert first == second == "ray-bradbury-12345678"


def author(name, slug=None, languages=None, writing=None, author_id=None):
    return SimpleNamespace(id=author_id or uuid4(), name=name, slug=slug, languages=languages or [], writing_languages=writing or [])


def test_read_only_audit_classifies_compatibility_and_overlap():
    rows = audit_author_slug_records([
        author("Ray Bradbury", "ray-bradbury", ["English"], ["English"]),
        author("Jane Austen"),
        author("Jane Austen", "legacy-jane"),
        author("   "),
    ])
    assert "valid_existing_slug" in rows[0].classifications
    assert rows[0].suspicious_language_overlap == ("english",)
    assert "missing_slug" in rows[1].classifications
    assert "potential_collision" in rows[1].classifications
    assert "slug_differs_from_deterministic_proposal" in rows[2].classifications
    assert "insufficient_canonical_name" in rows[3].classifications


class EmptyResult:
    def scalar_one_or_none(self): return None
    def scalars(self): return self
    def all(self): return []


class CreationDB:
    def __init__(self): self.added = []
    async def execute(self, _query): return EmptyResult()
    def add(self, value): self.added.append(value)
    async def flush(self): pass
    async def commit(self): pass
    async def refresh(self, value, _attrs=None): value.awards = []
    async def get(self, _model, _id): return None


@pytest.mark.asyncio
async def test_author_creation_uses_canonical_name_not_native_name_for_slug():
    db = CreationDB()
    result = await create_author(
        AuthorCreate(name="Ray Bradbury", native_name="Рэй Брэдбери"),
        current_user=SimpleNamespace(role="admin", id=uuid4()),
        db=db,
    )
    assert result["slug"] == "ray-bradbury"
    assert db.added[0].slug == "ray-bradbury"


class AuthorResult(EmptyResult):
    def __init__(self, author): self.author = author
    def scalar_one_or_none(self): return self.author


class UpdateDB(CreationDB):
    def __init__(self, author): super().__init__(); self.author = author
    async def execute(self, _query): return AuthorResult(self.author)


@pytest.mark.asyncio
async def test_author_name_update_does_not_regenerate_existing_slug():
    author_row = Author(id=uuid4(), name="Old Name", slug="stable-url", metadata_status="draft")
    author_row.awards = []
    db = UpdateDB(author_row)
    await update_author(
        str(author_row.id), AuthorUpdate(name="New Name"),
        current_user=SimpleNamespace(role="admin", id=uuid4()), db=db,
    )
    assert author_row.name == "New Name"
    assert author_row.slug == "stable-url"
