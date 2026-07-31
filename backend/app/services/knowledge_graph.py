"""Graph sync service for Author → KnowledgeNode relations.

When graph-backed author fields are saved, this service automatically
finds or creates KnowledgeNodes and upserts AuthorKnowledgeRelation rows.

This is the bridge between the legacy plain-text columns and the future
Sapphire knowledge graph infrastructure.
"""
import re
import logging
from typing import Dict, List, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.knowledge_node import KnowledgeNode
from app.models.author_knowledge_relation import AuthorKnowledgeRelation
from app.models.author import Author
from app.models.place import Place

logger = logging.getLogger(__name__)

# Inverse of GRAPH_FIELD_MAP: relation_type → Author array/scalar field.
# The KnowledgeGraph (nodes + relations) is the source of truth for taxonomy;
# the Author columns below are a denormalized cache derived from relations.
RELATION_TO_FIELD_MAP: Dict[str, str] = {
    "born_in": "birth_place",
    "died_in": "death_place",
    "belongs_to_movement": "literary_movements",
    "belongs_to_genre": "genres",
    "has_occupation": "occupations",
    "speaks": "languages",
    "writes_in": "writing_languages",
    "theme": "themes",
    "motif": "motifs",
    "concept": "concepts",
}

# Map of Author model fields → KnowledgeNode + relation config
GRAPH_FIELD_MAP: Dict[str, Dict[str, Any]] = {
    "literary_movements": {
        "node_type": "literary_direction",
        "relation_type": "belongs_to_movement",
        "confidence": 0.9,
    },
    "genres": {
        "node_type": "genre",
        "relation_type": "belongs_to_genre",
        "confidence": 0.85,
    },
    "occupations": {
        "node_type": "occupation",
        "relation_type": "has_occupation",
        "confidence": 0.85,
    },
    "languages": {
        "node_type": "language",
        "relation_type": "speaks",
        "confidence": 0.95,
    },
    "writing_languages": {
        "node_type": "language",
        "relation_type": "writes_in",
        "confidence": 0.95,
    },
    "themes": {
        "node_type": "theme",
        "relation_type": "theme",
        "confidence": 0.8,
    },
    "motifs": {
        "node_type": "motif",
        "relation_type": "motif",
        "confidence": 0.8,
    },
    "concepts": {
        "node_type": "concept",
        "relation_type": "concept",
        "confidence": 0.8,
    },
    "birth_place": {
        "node_type": "place",
        "relation_type": "born_in",
        "confidence": 1.0,
    },
    "death_place": {
        "node_type": "place",
        "relation_type": "died_in",
        "confidence": 0.9,
    },
}


def _normalize_slug(name: str) -> str:
    normalized = name.strip().lower()
    slug = re.sub(r"[^\w\s-]", "", normalized)
    slug = re.sub(r"[-\s]+", "-", slug).strip("-")
    return slug if slug else "unknown"


async def ensure_place(db: AsyncSession, name: str) -> Place:
    """Find or create a geographic Place row for a place-type knowledge node."""
    normalized_name = name.strip()
    result = await db.execute(
        select(Place).where(Place.name == normalized_name)
    )
    place = result.scalar_one_or_none()
    if place:
        return place
    place = Place(name=normalized_name)
    db.add(place)
    await db.flush()
    await db.refresh(place)
    logger.info("Created Place: %s", place.name)
    return place


async def ensure_knowledge_node(
    db: AsyncSession, name: str, node_type: str
) -> KnowledgeNode:
    normalized_name = name.strip()
    slug = _normalize_slug(normalized_name)

    result = await db.execute(
        select(KnowledgeNode).where(KnowledgeNode.slug == slug)
    )
    existing = result.scalar_one_or_none()
    if existing:
        if node_type == "place" and existing.place_id is None:
            place = await ensure_place(db, normalized_name)
            existing.place_id = place.id
        return existing

    node = KnowledgeNode(
        name=normalized_name,
        slug=slug,
        node_type=node_type,
    )
    db.add(node)
    await db.flush()
    await db.refresh(node)
    if node_type == "place":
        place = await ensure_place(db, normalized_name)
        node.place_id = place.id
    logger.info("Created KnowledgeNode: %s (%s)", node.name, node.node_type)
    return node


async def materialize_author_taxonomy_cache(
    db: AsyncSession, author_id: Any
) -> None:
    """Recompute the Author taxonomy columns from graph relations.

    The KnowledgeGraph (KnowledgeNode + AuthorKnowledgeRelation) is the single
    source of truth; the Author's plain-text array/scalar columns are a
    denormalized cache. Called after every graph mutation.
    """
    result = await db.execute(
        select(AuthorKnowledgeRelation)
        .where(
            AuthorKnowledgeRelation.author_id == author_id,
            AuthorKnowledgeRelation.status == "verified",
        )
        .order_by(AuthorKnowledgeRelation.created_at)
    )
    relations = result.scalars().all()
    if not relations:
        return

    node_ids = list({r.node_id for r in relations})
    nodes_result = await db.execute(
        select(KnowledgeNode).where(KnowledgeNode.id.in_(node_ids))
    )
    nodes = {n.id: n for n in nodes_result.scalars().all()}

    author = await db.get(Author, author_id)
    if not author:
        return

    field_values: Dict[str, List[str]] = {}
    place_refs: Dict[str, Any] = {}
    for rel in relations:
        field = RELATION_TO_FIELD_MAP.get(rel.relation_type)
        if not field:
            continue
        node = nodes.get(rel.node_id)
        if not node:
            continue
        field_values.setdefault(field, [])
        if node.name not in field_values[field]:
            field_values[field].append(node.name)
        if rel.relation_type == "born_in":
            place_refs["birth_place_id"] = node.place_id
        elif rel.relation_type == "died_in":
            place_refs["death_place_id"] = node.place_id

    for field, values in field_values.items():
        if field in ("birth_place", "death_place"):
            setattr(author, field, values[-1] if values else None)
        else:
            setattr(author, field, values)

    for attr, place_id in place_refs.items():
        setattr(author, attr, place_id)

    logger.info("Materialized taxonomy cache for author %s", author_id)


async def sync_author_graph_field(
    db: AsyncSession,
    author_id: Any,
    values: List[str],
    node_type: str,
    relation_type: str,
    confidence: float,
) -> None:
    if not isinstance(values, list):
        if values is None:
            values = []
        else:
            values = [str(values)]

    current_node_ids: set = set()
    for val in values:
        if not val or not val.strip():
            continue
        node = await ensure_knowledge_node(db, val.strip(), node_type)
        current_node_ids.add(node.id)

        existing_rel = await db.execute(
            select(AuthorKnowledgeRelation).where(
                AuthorKnowledgeRelation.author_id == author_id,
                AuthorKnowledgeRelation.node_id == node.id,
                AuthorKnowledgeRelation.relation_type == relation_type,
            )
        )
        if existing_rel.scalar_one_or_none():
            continue

        rel = AuthorKnowledgeRelation(
            author_id=author_id,
            node_id=node.id,
            relation_type=relation_type,
            source="curator",
            status="verified",
            confidence=confidence,
        )
        db.add(rel)
        logger.info(
            "Linked author %s → node %s (%s)",
            author_id, node.name, relation_type,
        )

    stale_query = select(AuthorKnowledgeRelation).where(
        AuthorKnowledgeRelation.author_id == author_id,
        AuthorKnowledgeRelation.relation_type == relation_type,
    )
    if current_node_ids:
        stale_query = stale_query.where(
            AuthorKnowledgeRelation.node_id.notin_(current_node_ids)
        )
    stale = await db.execute(stale_query)
    for rel in stale.scalars().all():
        await db.delete(rel)
        logger.info(
            "Removed stale relation: author %s → node %s (%s)",
            author_id, rel.node_id, relation_type,
        )

    await materialize_author_taxonomy_cache(db, author_id)


async def sync_author_graph_fields(
    db: AsyncSession,
    author_id: Any,
    update_data: Dict[str, Any],
) -> None:
    for field_name, config in GRAPH_FIELD_MAP.items():
        if field_name not in update_data:
            continue
        values = update_data[field_name]
        if values is None:
            values = []
        await sync_author_graph_field(
            db,
            author_id=author_id,
            values=values,
            node_type=config["node_type"],
            relation_type=config["relation_type"],
            confidence=config["confidence"],
        )
