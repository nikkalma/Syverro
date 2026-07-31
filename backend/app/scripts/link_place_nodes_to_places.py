"""One-time migration: link place-type knowledge nodes to the places table.

For every KnowledgeNode with node_type='place', find or create a matching
Place row and set node.place_id. Then derive author.birth_place_id /
author.death_place_id from born_in / died_in relations (graph = truth).

Idempotent — safe to run multiple times.

Usage:
    python -m app.scripts.link_place_nodes_to_places
"""
import asyncio
import logging
import sys

from sqlalchemy import select

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("link_place_nodes_to_places")


async def run() -> None:
    from app.database import AsyncSessionLocal
    from app.models.knowledge_node import KnowledgeNode
    from app.models.author import Author
    from app.models.author_knowledge_relation import AuthorKnowledgeRelation
    from app.services.knowledge_graph import ensure_place

    async with AsyncSessionLocal() as db:
        nodes = (await db.execute(
            select(KnowledgeNode).where(KnowledgeNode.node_type == "place")
        )).scalars().all()
        linked = 0
        for node in nodes:
            if node.place_id:
                continue
            place = await ensure_place(db, node.name)
            node.place_id = place.id
            linked += 1
        await db.commit()
        print(f"[1] Linked {linked} place nodes → places")

        relations = (await db.execute(
            select(AuthorKnowledgeRelation).where(
                AuthorKnowledgeRelation.relation_type.in_(["born_in", "died_in"])
            )
        )).scalars().all()
        authors_updated = 0
        node_ids = {r.node_id for r in relations}
        nodes_map = {}
        if node_ids:
            nodes_map = {n.id: n for n in (await db.execute(
                select(KnowledgeNode).where(KnowledgeNode.id.in_(node_ids))
            )).scalars().all()}
        by_author = {}
        for rel in relations:
            node = nodes_map.get(rel.node_id)
            if not node or not node.place_id:
                continue
            if rel.relation_type == "born_in":
                by_author.setdefault(rel.author_id, {})["birth_place_id"] = node.place_id
            elif rel.relation_type == "died_in":
                by_author.setdefault(rel.author_id, {})["death_place_id"] = node.place_id

        for author_id, refs in by_author.items():
            author = await db.get(Author, author_id)
            if not author:
                continue
            for attr, pid in refs.items():
                setattr(author, attr, pid)
            authors_updated += 1
        await db.commit()
        print(f"[2] Set place refs on {authors_updated} authors")


def main() -> None:
    asyncio.run(run())


if __name__ == "__main__":
    main()
