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

logger = logging.getLogger(__name__)

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
        return existing

    node = KnowledgeNode(
        name=normalized_name,
        slug=slug,
        node_type=node_type,
    )
    db.add(node)
    await db.flush()
    await db.refresh(node)
    logger.info("Created KnowledgeNode: %s (%s)", node.name, node.node_type)
    return node


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

    if not current_node_ids:
        return

    stale = await db.execute(
        select(AuthorKnowledgeRelation).where(
            AuthorKnowledgeRelation.author_id == author_id,
            AuthorKnowledgeRelation.relation_type == relation_type,
            AuthorKnowledgeRelation.node_id.notin_(current_node_ids),
        )
    )
    for rel in stale.scalars().all():
        await db.delete(rel)
        logger.info(
            "Removed stale relation: author %s → node %s (%s)",
            author_id, rel.node_id, relation_type,
        )


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
