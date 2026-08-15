"""Audit and repair the page-backed graph links for the Bronte sisters.

The default mode is read-only. Use ``--apply`` only after reviewing the plan.
The script deliberately does not promote authors to ``golden``: publication is
a separate human editorial decision.

Usage:
    python -m app.scripts.repair_bronte_links
    python -m app.scripts.repair_bronte_links --apply
"""

from __future__ import annotations

import argparse
import asyncio
import uuid
from dataclasses import dataclass

from sqlalchemy import func, select

from app.database import AsyncSessionLocal
from app.models.author import Author
from app.models.author_knowledge_relation import AuthorKnowledgeRelation
from app.models.knowledge_node import KnowledgeNode
from app.services.knowledge_graph import _normalize_slug


@dataclass(frozen=True)
class Sister:
    slug: str
    pseudonym: str


SISTERS = (
    Sister("charlotte-bronte", "Currer Bell"),
    Sister("emily-bronte", "Ellis Bell"),
    Sister("anne-bronte", "Acton Bell"),
)


def _names(author: Author) -> set[str]:
    return {
        value.strip().casefold()
        for value in (author.name, author.display_name, author.native_name)
        if value and value.strip()
    }


async def _load_authors(db) -> dict[str, Author]:
    result = await db.execute(select(Author).where(Author.slug.in_([s.slug for s in SISTERS])))
    return {author.slug: author for author in result.scalars().all()}


async def _find_person_node(db, author: Author) -> KnowledgeNode | None:
    linked = await db.scalar(
        select(KnowledgeNode).where(
            KnowledgeNode.node_type == "person",
            KnowledgeNode.author_id == author.id,
        )
    )
    if linked:
        return linked

    candidates = (await db.execute(
        select(KnowledgeNode).where(KnowledgeNode.node_type == "person")
    )).scalars().all()
    expected_names = _names(author)
    return next(
        (node for node in candidates if node.name and node.name.strip().casefold() in expected_names),
        None,
    )


async def _ensure_person_node(db, author: Author, apply: bool, changes: list[str]) -> KnowledgeNode:
    node = await _find_person_node(db, author)
    if node is None:
        node = KnowledgeNode(
            id=uuid.uuid4(),
            name=author.native_name or author.display_name or author.name,
            slug=f"person-{_normalize_slug(author.slug)}",
            node_type="person",
            author_id=author.id,
            status="published",
            explorer_visible=True,
        )
        changes.append(f"create page-backed person node -> {author.slug}")
        if apply:
            db.add(node)
            await db.flush()
        return node

    updates = []
    if node.author_id != author.id:
        updates.append("author_id")
        if apply:
            node.author_id = author.id
    if node.status != "published":
        updates.append("status=published")
        if apply:
            node.status = "published"
    if not node.explorer_visible:
        updates.append("explorer_visible=true")
        if apply:
            node.explorer_visible = True
    if updates:
        changes.append(f"link person node to {author.slug}: {', '.join(updates)}")
    return node


async def _ensure_sister_relation(
    db,
    source: Author,
    target_node: KnowledgeNode,
    apply: bool,
    changes: list[str],
) -> None:
    relations = (await db.execute(
        select(AuthorKnowledgeRelation).where(
            AuthorKnowledgeRelation.author_id == source.id,
            AuthorKnowledgeRelation.node_id == target_node.id,
        )
    )).scalars().all()
    sister_relation = next((rel for rel in relations if rel.relation_type == "sister_of"), None)
    if sister_relation:
        updates = []
        if sister_relation.status != "verified":
            updates.append("status=verified")
            if apply:
                sister_relation.status = "verified"
        if sister_relation.confidence != 1.0:
            updates.append("confidence=1.0")
            if apply:
                sister_relation.confidence = 1.0
        if updates:
            changes.append(f"verify {source.slug} -> {target_node.author_id}: {', '.join(updates)}")
        return

    legacy = next((rel for rel in relations if rel.relation_type == "relative_of"), None)
    if legacy:
        changes.append(f"specialize {source.slug} -> {target_node.author_id}: relative_of -> sister_of")
        if apply:
            legacy.relation_type = "sister_of"
            legacy.status = "verified"
            legacy.confidence = 1.0
        return

    changes.append(f"create sister_of {source.slug} -> {target_node.author_id}")
    if apply:
        db.add(AuthorKnowledgeRelation(
            id=uuid.uuid4(),
            author_id=source.id,
            node_id=target_node.id,
            relation_type="sister_of",
            source="curator",
            status="verified",
            confidence=1.0,
        ))


async def _remove_pseudonym_graph_edges(
    db,
    author: Author,
    pseudonym: str,
    apply: bool,
    changes: list[str],
) -> None:
    rows = (await db.execute(
        select(AuthorKnowledgeRelation)
        .join(KnowledgeNode, KnowledgeNode.id == AuthorKnowledgeRelation.node_id)
        .where(
            AuthorKnowledgeRelation.author_id == author.id,
            KnowledgeNode.node_type == "identity",
            func.lower(KnowledgeNode.name) == pseudonym.lower(),
        )
    )).scalars().all()
    for relation in rows:
        changes.append(f"remove pseudonym graph edge {author.slug} -> {pseudonym}")
        if apply:
            await db.delete(relation)


async def run(apply: bool = False) -> int:
    changes: list[str] = []
    warnings: list[str] = []

    async with AsyncSessionLocal() as db:
        authors = await _load_authors(db)
        missing = [s.slug for s in SISTERS if s.slug not in authors]
        if missing:
            print("BLOCKED: missing author pages: " + ", ".join(missing))
            return 1

        nodes: dict[str, KnowledgeNode] = {}
        for sister in SISTERS:
            author = authors[sister.slug]
            pseudonyms = {value.strip().casefold() for value in (author.pseudonyms or []) if value.strip()}
            if sister.pseudonym.casefold() not in pseudonyms:
                changes.append(f"add pseudonym {sister.slug}: {sister.pseudonym}")
                if apply:
                    author.pseudonyms = [*(author.pseudonyms or []), sister.pseudonym]
            await _remove_pseudonym_graph_edges(db, author, sister.pseudonym, apply, changes)
            nodes[sister.slug] = await _ensure_person_node(db, author, apply, changes)
            if author.metadata_status != "golden":
                warnings.append(f"{sister.slug}: metadata_status={author.metadata_status}; human publication review required")

        for source_spec in SISTERS:
            source = authors[source_spec.slug]
            for target_spec in SISTERS:
                if source_spec.slug == target_spec.slug:
                    continue
                await _ensure_sister_relation(db, source, nodes[target_spec.slug], apply, changes)

        print("BRONTE GRAPH REPAIR " + ("APPLY" if apply else "DRY RUN"))
        print("=" * 64)
        if changes:
            for change in changes:
                print(f"- {change}")
        else:
            print("- no data changes required")
        if warnings:
            print("\nPublication review:")
            for warning in warnings:
                print(f"- {warning}")

        if apply:
            await db.commit()
            print(f"\nApplied {len(changes)} change(s). Author publication statuses were not changed.")
        else:
            await db.rollback()
            print(f"\nWould apply {len(changes)} change(s). Re-run with --apply after review.")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Repair page-backed Bronte family graph links")
    parser.add_argument("--apply", action="store_true", help="commit the reported changes")
    args = parser.parse_args()
    raise SystemExit(asyncio.run(run(apply=args.apply)))


if __name__ == "__main__":
    main()
