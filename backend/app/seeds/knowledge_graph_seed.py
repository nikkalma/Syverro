"""Knowledge Graph seed dataset for architecture validation.

This script creates a small but meaningful graph of books, authors, genres,
themes, motifs, atmospheres, and concepts connected through the existing
KnowledgeNode, KnowledgeRelation, and BookKnowledgeRelation models.

Purpose: validate that the graph model can represent meaningful literary worlds
and support traversal, similarity scoring, and future visualization.

Idempotent: safe to run multiple times. Uses find-or-create for nodes and
ON CONFLICT DO NOTHING for relations.

Usage:
    from app.seeds.knowledge_graph_seed import seed_knowledge_graph
    await seed_knowledge_graph(db)
"""
import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.models.knowledge_node import KnowledgeNode
from app.models.knowledge_relation import KnowledgeRelation
from app.models.book_knowledge_relation import BookKnowledgeRelation

logger = logging.getLogger(__name__)

# =============================================================================
# NODE DEFINITIONS
# =============================================================================
# Each node: (slug, name, node_type)

NODES = [
    # --- Themes ---
    ("power", "Power", "theme"),
    ("ecology", "Ecology", "theme"),
    ("religion", "Religion", "theme"),
    ("destiny", "Destiny", "theme"),
    ("truth", "Truth", "theme"),
    ("freedom", "Freedom", "theme"),
    ("surveillance", "Surveillance", "theme"),
    ("consciousness", "Consciousness", "theme"),
    ("communication", "Communication", "theme"),
    ("isolation", "Isolation", "theme"),
    ("identity", "Identity", "theme"),
    ("adventure", "Adventure", "theme"),
    ("courage", "Courage", "theme"),
    ("greed", "Greed", "theme"),
    ("evolution", "Evolution", "theme"),
    ("civilization", "Civilization", "theme"),
    ("culture", "Culture", "theme"),
    ("happiness", "Happiness", "theme"),
    ("good-vs-evil", "Good vs Evil", "theme"),
    ("love", "Love", "theme"),
    ("art", "Art", "theme"),
    ("guilt", "Guilt", "theme"),
    ("redemption", "Redemption", "theme"),
    ("suffering", "Suffering", "theme"),
    ("history", "History", "theme"),
    ("knowledge", "Knowledge", "theme"),

    # --- Motifs ---
    ("desert", "Desert", "motif"),
    ("spice", "Spice", "motif"),
    ("prophecy", "Prophecy", "motif"),
    ("doublethink", "Doublethink", "motif"),
    ("big-brother", "Big Brother", "motif"),
    ("thought-police", "Thought Police", "motif"),
    ("ocean", "Ocean", "motif"),
    ("memory", "Memory", "motif"),
    ("doppelganger", "Doppelganger", "motif"),
    ("journey", "Journey", "motif"),
    ("dragon", "Dragon", "motif"),
    ("ring", "Ring", "motif"),
    ("revolution", "Revolution", "motif"),
    ("narrative", "Narrative", "motif"),
    ("conditioning", "Conditioning", "motif"),
    ("soma", "Soma", "motif"),
    ("caste-system", "Caste System", "motif"),
    ("devil", "Devil", "motif"),
    ("carnival", "Carnival", "motif"),
    ("disappearance", "Disappearance", "motif"),
    ("crime", "Crime", "motif"),
    ("confession", "Confession", "motif"),
    ("dream", "Dream", "motif"),

    # --- Atmospheres ---
    ("epic", "Epic", "atmosphere"),
    ("mystical", "Mystical", "atmosphere"),
    ("dystopian", "Dystopian", "atmosphere"),
    ("oppressive", "Oppressive", "atmosphere"),
    ("melancholic", "Melancholic", "atmosphere"),
    ("philosophical", "Philosophical", "atmosphere"),
    ("whimsical", "Whimsical", "atmosphere"),
    ("intellectual", "Intellectual", "atmosphere"),
    ("expansive", "Expansive", "atmosphere"),
    ("clinical", "Clinical", "atmosphere"),
    ("unsettling", "Unsettling", "atmosphere"),
    ("surreal", "Surreal", "atmosphere"),
    ("satirical", "Satirical", "atmosphere"),
    ("psychological", "Psychological", "atmosphere"),
    ("intense", "Intense", "atmosphere"),

    # --- Concepts ---
    ("messiah-complex", "Messiah Complex", "concept"),
    ("ecological-engineering", "Ecological Engineering", "concept"),
    ("totalitarianism", "Totalitarianism", "concept"),
    ("newspeak", "Newspeak", "concept"),
    ("the-other", "The Other", "concept"),
    ("phenomenology", "Phenomenology", "concept"),
    ("hero-journey", "Hero's Journey", "concept"),
    ("transformation", "Transformation", "concept"),
    ("cognitive-revolution", "Cognitive Revolution", "concept"),
    ("collective-myth", "Collective Myth", "concept"),
    ("utopia-dystopia", "Utopia and Dystopia", "concept"),
    ("absurdism", "Absurdism", "concept"),
    ("utilitarianism", "Utilitarianism", "concept"),
    ("nihilism", "Nihilism", "concept"),
    ("morality", "Morality", "concept"),
    ("corruption", "Corruption", "concept"),
]

# =============================================================================
# RELATION DEFINITIONS (KnowledgeNode → KnowledgeNode)
# =============================================================================
# Each relation: (source_slug, target_slug, relation_type)

NODE_RELATIONS = [
    ("power", "totalitarianism", "related_to"),
    ("power", "corruption", "related_to"),
    ("freedom", "surveillance", "contrasts_with"),
    ("freedom", "totalitarianism", "contrasts_with"),
    ("hero-journey", "adventure", "related_to"),
    ("hero-journey", "transformation", "part_of"),
    ("consciousness", "identity", "related_to"),
    ("consciousness", "the-other", "explores"),
    ("dystopian", "oppressive", "similar_to"),
    ("guilt", "redemption", "contrasts_with"),
    ("guilt", "suffering", "related_to"),
    ("ecological-engineering", "ecology", "belongs_to"),
    ("cognitive-revolution", "evolution", "related_to"),
    ("messiah-complex", "religion", "related_to"),
    ("destiny", "prophecy", "related_to"),
    ("utopia-dystopia", "totalitarianism", "explores"),
    ("absurdism", "satirical", "related_to"),
    ("nihilism", "absurdism", "related_to"),
    ("morality", "good-vs-evil", "related_to"),
    ("utilitarianism", "morality", "contrasts_with"),
]

# =============================================================================
# BOOK CONNECTIONS
# =============================================================================
# Each book connection: (title, author_name, genre_slugs, connections)
# connections: list of (node_slug, relation_type)

BOOKS = [
    {
        "title": "Dune",
        "author": "Frank Herbert",
        "genres": ["science-fiction", "fiction"],
        "connections": [
            ("power", "explores"),
            ("ecology", "explores"),
            ("religion", "explores"),
            ("destiny", "explores"),
            ("desert", "contains"),
            ("spice", "contains"),
            ("prophecy", "contains"),
            ("epic", "evokes"),
            ("mystical", "evokes"),
            ("messiah-complex", "classified_as"),
            ("ecological-engineering", "classified_as"),
        ],
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "genres": ["fiction", "science-fiction"],
        "connections": [
            ("power", "explores"),
            ("truth", "explores"),
            ("freedom", "explores"),
            ("surveillance", "explores"),
            ("doublethink", "contains"),
            ("big-brother", "contains"),
            ("thought-police", "contains"),
            ("dystopian", "evokes"),
            ("oppressive", "evokes"),
            ("totalitarianism", "classified_as"),
            ("newspeak", "classified_as"),
        ],
    },
    {
        "title": "Solaris",
        "author": "Stanislaw Lem",
        "genres": ["science-fiction", "fiction"],
        "connections": [
            ("consciousness", "explores"),
            ("communication", "explores"),
            ("isolation", "explores"),
            ("identity", "explores"),
            ("ocean", "contains"),
            ("memory", "contains"),
            ("doppelganger", "contains"),
            ("melancholic", "evokes"),
            ("philosophical", "evokes"),
            ("the-other", "classified_as"),
            ("phenomenology", "classified_as"),
        ],
    },
    {
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien",
        "genres": ["fantasy", "fiction"],
        "connections": [
            ("adventure", "explores"),
            ("courage", "explores"),
            ("greed", "explores"),
            ("journey", "contains"),
            ("dragon", "contains"),
            ("ring", "contains"),
            ("whimsical", "evokes"),
            ("epic", "evokes"),
            ("hero-journey", "classified_as"),
            ("transformation", "classified_as"),
        ],
    },
    {
        "title": "Sapiens: A Brief History of Humankind",
        "author": "Yuval Noah Harari",
        "genres": ["non-fiction", "history"],
        "connections": [
            ("evolution", "explores"),
            ("civilization", "explores"),
            ("culture", "explores"),
            ("history", "explores"),
            ("revolution", "contains"),
            ("narrative", "contains"),
            ("intellectual", "evokes"),
            ("expansive", "evokes"),
            ("cognitive-revolution", "classified_as"),
            ("collective-myth", "classified_as"),
        ],
    },
    {
        "title": "Brave New World",
        "author": "Aldous Huxley",
        "genres": ["fiction", "science-fiction"],
        "connections": [
            ("happiness", "explores"),
            ("freedom", "explores"),
            ("identity", "explores"),
            ("conditioning", "contains"),
            ("soma", "contains"),
            ("caste-system", "contains"),
            ("clinical", "evokes"),
            ("unsettling", "evokes"),
            ("utopia-dystopia", "classified_as"),
        ],
    },
    {
        "title": "The Master and Margarita",
        "author": "Mikhail Bulgakov",
        "genres": ["fiction", "fantasy"],
        "connections": [
            ("good-vs-evil", "explores"),
            ("love", "explores"),
            ("art", "explores"),
            ("power", "explores"),
            ("devil", "contains"),
            ("carnival", "contains"),
            ("disappearance", "contains"),
            ("surreal", "evokes"),
            ("satirical", "evokes"),
            ("absurdism", "classified_as"),
            ("redemption", "explores"),
        ],
    },
    {
        "title": "Crime and Punishment",
        "author": "Fyodor Dostoevsky",
        "genres": ["fiction", "philosophical-fiction"],
        "connections": [
            ("guilt", "explores"),
            ("redemption", "explores"),
            ("suffering", "explores"),
            ("crime", "contains"),
            ("confession", "contains"),
            ("dream", "contains"),
            ("psychological", "evokes"),
            ("intense", "evokes"),
            ("utilitarianism", "classified_as"),
            ("nihilism", "classified_as"),
            ("morality", "explores"),
        ],
    },
]


def _slugify(name: str) -> str:
    import re
    s = name.lower().strip()
    s = re.sub(r"[^\w\s'-]", "", s)
    s = re.sub(r"[-\s]+", "-", s)
    return s.strip("-")


async def seed_knowledge_graph(db: AsyncSession) -> None:
    """Seed the knowledge graph with test data.

    Creates KnowledgeNodes, KnowledgeRelations, and BookKnowledgeRelations.
    Idempotent — safe to run on an existing dataset.
    """
    slug_to_id: dict[str, UUID] = {}

    # ---- Step 1: Create KnowledgeNodes ----
    for slug, name, node_type in NODES:
        result = await db.execute(
            select(KnowledgeNode).where(KnowledgeNode.slug == slug)
        )
        existing = result.scalar_one_or_none()
        if existing:
            slug_to_id[slug] = existing.id
            continue
        node = KnowledgeNode(name=name, slug=slug, node_type=node_type)
        db.add(node)
        await db.flush()
        slug_to_id[slug] = node.id
        logger.info(f"  Created node: {node_type} / {name}")

    await db.commit()

    # ---- Step 2: Create KnowledgeRelations ----
    for src_slug, tgt_slug, rel_type in NODE_RELATIONS:
        src_id = slug_to_id.get(src_slug)
        tgt_id = slug_to_id.get(tgt_slug)
        if not src_id or not tgt_id:
            logger.warning(f"  Skipping relation {src_slug} -> {tgt_slug}: missing node")
            continue
        result = await db.execute(
            select(KnowledgeRelation).where(
                KnowledgeRelation.source_node_id == src_id,
                KnowledgeRelation.target_node_id == tgt_id,
                KnowledgeRelation.relation_type == rel_type,
            )
        )
        if result.scalar_one_or_none():
            continue
        rel = KnowledgeRelation(
            source_node_id=src_id,
            target_node_id=tgt_id,
            relation_type=rel_type,
        )
        db.add(rel)
        await db.flush()
        logger.info(f"  Created relation: {src_slug} --{rel_type}--> {tgt_slug}")

    await db.commit()

    # ---- Step 3: Find or create books, then create BookKnowledgeRelations ----
    for book_def in BOOKS:
        title = book_def["title"]
        author_name = book_def["author"]

        result = await db.execute(
            select(text("id from books where title = :title")),
            {"title": title},
        )
        row = result.fetchone()
        if row is None:
            logger.warning(f"  Book not found: {title} — skipping (run main seed first or create manually)")
            continue
        book_id = row[0]

        for node_slug, rel_type in book_def["connections"]:
            node_id = slug_to_id.get(node_slug)
            if not node_id:
                logger.warning(f"  Skipping connection {title} --{rel_type}--> {node_slug}: node not found")
                continue

            result = await db.execute(
                select(BookKnowledgeRelation).where(
                    BookKnowledgeRelation.book_id == book_id,
                    BookKnowledgeRelation.node_id == node_id,
                    BookKnowledgeRelation.relation_type == rel_type,
                    BookKnowledgeRelation.source == "admin",
                )
            )
            if result.scalar_one_or_none():
                continue

            bkr = BookKnowledgeRelation(
                book_id=book_id,
                node_id=node_id,
                relation_type=rel_type,
                source="admin",
                status="approved",
                confidence=1.0,
            )
            db.add(bkr)
            await db.flush()
            logger.info(f"  Connected {title} --{rel_type}--> {node_slug}")

    await db.commit()
    logger.info(f"✅ Knowledge graph seed complete: {len(NODES)} nodes, {len(NODE_RELATIONS)} relations, {sum(len(b['connections']) for b in BOOKS)} book connections")
