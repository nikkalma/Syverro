"""Architecture checkpoint: knowledge entities are first-class and independent.

Validates that every supported entity type (genre, literary_direction, place,
timeline_event) stored as a KnowledgeNode:
  1. can be created independently — no parent, author, place, or relations
  2. can be edited independently
  3. can be deleted independently — leaving other entities untouched
  4. can exist with zero relationships
  5. is localization-ready — UTF-8 name/description, JSONB meta for future locales
  6. supports Sapphire and Explorer flags
  7. remains fully functional (listable/filterable) when nothing references it
"""

import os

import pytest
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

import app.models  # noqa: F401 — populate Base.metadata
from app.database import Base
from app.models.knowledge_node import KnowledgeNode

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://test:test@localhost:5432/syverro_test",
    ),
)

ENTITY_TYPES = ["genre", "literary_direction", "place", "timeline_event"]


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
    async with AsyncSession(pg_engine, expire_on_commit=False) as session:
        yield session


def _standalone_node(node_type: str) -> KnowledgeNode:
    """A fully standalone entity: no parent, no author, no place, no relations."""
    return KnowledgeNode(
        name=f"Standalone {node_type}",
        slug=f"standalone-{node_type}",
        node_type=node_type,
        parent_id=None,
        author_id=None,
        place_id=None,
        description=f"An independent {node_type}",
        status="draft",
        is_sapphire=False,
        explorer_visible=False,
    )


# ============================================================
# 1. Created independently, with zero relationships
# ============================================================


@pytest.mark.asyncio
async def test_all_entity_types_created_independently(session: AsyncSession):
    """Each entity type persists standalone with no dependencies."""
    nodes = [_standalone_node(t) for t in ENTITY_TYPES]
    session.add_all(nodes)
    await session.commit()

    for node in nodes:
        await session.refresh(node)
        assert node.id is not None
        assert node.parent_id is None
        assert node.author_id is None
        assert node.place_id is None

    # All four exist side by side — none depends on another's existence.
    result = await session.execute(select(KnowledgeNode).order_by(KnowledgeNode.name))
    persisted = list(result.scalars().all())
    assert {n.node_type for n in persisted} == set(ENTITY_TYPES)


# ============================================================
# 2. Edited independently
# ============================================================


@pytest.mark.asyncio
async def test_entity_edited_independently(session: AsyncSession):
    """Editing one entity does not affect others."""
    nodes = [_standalone_node(t) for t in ENTITY_TYPES]
    session.add_all(nodes)
    await session.commit()
    for node in nodes:
        await session.refresh(node)

    genre = next(n for n in nodes if n.node_type == "genre")
    genre.name = "Gothic"
    genre.slug = "gothic"
    genre.description = "Edited description"
    await session.commit()
    await session.refresh(genre)

    assert genre.name == "Gothic"
    assert genre.slug == "gothic"
    assert genre.description == "Edited description"

    # The other types were not touched.
    for node in nodes:
        await session.refresh(node)
        if node.id == genre.id:
            continue
        assert node.name == f"Standalone {node.node_type}"


# ============================================================
# 3. Deleted independently
# ============================================================


@pytest.mark.asyncio
async def test_entity_deleted_independently(session: AsyncSession):
    """Deleting one entity leaves the rest intact."""
    nodes = [_standalone_node(t) for t in ENTITY_TYPES]
    session.add_all(nodes)
    await session.commit()
    for node in nodes:
        await session.refresh(node)

    target = next(n for n in nodes if n.node_type == "timeline_event")
    await session.delete(target)
    await session.commit()

    remaining = list(
        (await session.execute(select(KnowledgeNode))).scalars().all()
    )
    assert len(remaining) == len(ENTITY_TYPES) - 1
    assert {n.node_type for n in remaining} == set(ENTITY_TYPES) - {"timeline_event"}

    # Deleted node is gone entirely.
    gone = await session.execute(
        select(KnowledgeNode).where(KnowledgeNode.node_type == "timeline_event")
    )
    assert gone.scalar_one_or_none() is None


# ============================================================
# 4. Exists without any relationships
# ============================================================


@pytest.mark.asyncio
async def test_entity_exists_without_relationships(session: AsyncSession):
    """A standalone node remains queryable and valid with zero relations."""
    node = _standalone_node("place")
    session.add(node)
    await session.commit()
    await session.refresh(node)

    fetched = await session.execute(
        select(KnowledgeNode).where(KnowledgeNode.id == node.id)
    )
    fetched_node = fetched.scalar_one()
    assert fetched_node.node_type == "place"
    assert fetched_node.slug == "standalone-place"
    assert fetched_node.status == "draft"


# ============================================================
# 5. Localization-ready
# ============================================================


@pytest.mark.asyncio
async def test_entity_localization_ready(session: AsyncSession):
    """UTF-8 text fields and JSONB meta round-trip (future localized payloads)."""
    node = KnowledgeNode(
        name="Джейн Эйр",
        slug="dzhayn-eyr",
        node_type="genre",
        description="Готический роман",
        meta={"name_ru": "Джейн Эйр", "name_en": "Jane Eyre"},
    )
    session.add(node)
    await session.commit()
    await session.refresh(node)

    assert node.name == "Джейн Эйр"
    assert node.description == "Готический роман"
    assert node.meta["name_en"] == "Jane Eyre"
    assert node.meta["name_ru"] == "Джейн Эйр"


# ============================================================
# 6. Sapphire and Explorer flags
# ============================================================


@pytest.mark.asyncio
async def test_entity_sapphire_and_explorer_flags(session: AsyncSession):
    """is_sapphire / explorer_visible persist and filter independently."""
    sapphire = KnowledgeNode(
        name="Jane Eyre", slug="jane-eyre", node_type="genre",
        status="published", is_sapphire=True, explorer_visible=True,
    )
    hidden = _standalone_node("genre")
    session.add_all([sapphire, hidden])
    await session.commit()

    sapphire_result = await session.execute(
        select(KnowledgeNode).where(KnowledgeNode.is_sapphire.is_(True))
    )
    assert [n.name for n in sapphire_result.scalars().all()] == ["Jane Eyre"]

    visible_result = await session.execute(
        select(KnowledgeNode).where(KnowledgeNode.explorer_visible.is_(True))
    )
    assert [n.name for n in visible_result.scalars().all()] == ["Jane Eyre"]

    # Flags are independent: turning one off leaves the other on.
    sapphire.explorer_visible = False
    await session.commit()
    await session.refresh(sapphire)
    assert sapphire.is_sapphire is True
    assert sapphire.explorer_visible is False


# ============================================================
# 7. Functional with nothing referencing it
# ============================================================


@pytest.mark.asyncio
async def test_entity_type_listed_without_references(session: AsyncSession):
    """Entities are listable/filterable by type even with zero relations."""
    for t in ENTITY_TYPES:
        session.add(_standalone_node(t))
    await session.commit()

    # The exact query used by GET /admin/entities?entity_type=...
    for t in ENTITY_TYPES:
        result = await session.execute(
            select(KnowledgeNode)
            .where(KnowledgeNode.node_type == t)
            .order_by(KnowledgeNode.updated_at.desc())
        )
        listed = list(result.scalars().all())
        assert len(listed) == 1
        assert listed[0].node_type == t
