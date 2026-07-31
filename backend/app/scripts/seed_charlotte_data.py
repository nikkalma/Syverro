"""Seed Charlotte Brontë data: places, timeline events, connections, taxonomy, publications."""
import asyncio
import uuid
from datetime import date
from app.database import AsyncSessionLocal
from app.models.author import Author
from app.models.author_publication import AuthorPublication
from app.models.place import Place
from app.models.timeline_event import TimelineEvent
from app.models.knowledge_node import KnowledgeNode
from app.models.author_knowledge_relation import AuthorKnowledgeRelation
from app.models.source import Source
from app.models.author_quote import AuthorQuote
from app.services.knowledge_graph import _normalize_slug
from sqlalchemy import select, text

CHARLOTTE_SLUG = "charlotte-bronte"

PLACES = [
    {"name": "Thornton", "name_native": "Торнтон", "country": "United Kingdom", "region": "West Yorkshire", "place_type": "village"},
    {"name": "Haworth", "name_native": "Хоэрт", "country": "United Kingdom", "region": "West Yorkshire", "place_type": "village"},
    {"name": "Cowan Bridge", "name_native": "Кован-Бридж", "country": "United Kingdom", "region": "Lancashire", "place_type": "village"},
]

CONNECTIONS = [
    {"name": "Emily Brontë", "name_ru": "Эмили Бронте", "node_type": "person", "relation": "relative_of", "author_slug": "emily-bronte"},
    {"name": "Anne Brontë", "name_ru": "Энн Бронте", "node_type": "person", "relation": "relative_of", "author_slug": "anne-bronte"},
    {"name": "Patrick Brontë", "name_ru": "Патрик Бронте", "node_type": "person", "relation": "relative_of", "author_slug": "patrick-bronte"},
    {"name": "Elizabeth Gaskell", "name_ru": "Элизабет Гаскелл", "node_type": "person", "relation": "friend_of", "author_slug": "elizabeth-gaskell"},
    {"name": "Robert Southey", "name_ru": "Роберт Саути", "node_type": "person", "relation": "influenced_by"},
    {"name": "Hartley Coleridge", "name_ru": "Хартли Кольридж", "node_type": "person", "relation": "influenced_by"},
    {"name": "William Makepeace Thackeray", "name_ru": "Уильям Мейкпис Теккерей", "node_type": "person", "relation": "contemporary_of"},
    {"name": "Currer Bell", "name_ru": "Каррер Белл", "node_type": "identity", "relation": "identity"},
    {"name": "Jane Eyre", "name_ru": "Джейн Эйр", "node_type": "work", "relation": "work"},
    {"name": "Villette", "name_ru": "Виллетт", "node_type": "work", "relation": "work"},
    {"name": "Shirley", "name_ru": "Шерли", "node_type": "work", "relation": "work"},
    {"name": "The Professor", "name_ru": "Учитель", "node_type": "work", "relation": "work"},
]

TAXONOMY = {
    "genres": [
        "роман", "готический роман", "социальный роман", "психологический роман",
    ],
    "themes": [
        "женская независимость", "социальное неравенство", "образование", "поиск идентичности",
    ],
    "motifs": [
        "сиротство", "одиночество", "брак", "самопознание",
    ],
    "concepts": [
        "викторианское общество", "личная свобода", "положение женщины",
    ],
    "atmospheres": [
        "готическая", "меланхоличная", "интроспективная",
    ],
}

TAXONOMY_NODE_TYPE = {
    "genres": "genre",
    "themes": "theme",
    "motifs": "motif",
    "concepts": "concept",
    "atmospheres": "atmosphere",
}

TAXONOMY_RELATION_TYPE = {
    "genres": "belongs_to_genre",
    "themes": "theme",
    "motifs": "motif",
    "concepts": "concept",
    "atmospheres": "atmosphere",
}

TIMELINE_EVENTS = [
    {"event_type": "education", "date_value": "1824", "date_precision": "year",
     "label": "Поступление в школу Кован-Бридж",
     "description": "Шарлотта Бронте поступила в школу для дочерей духовенства в Кован-Бридж, Ланкашир. Позже этот опыт лёг в основу описания школы Ловуд в романе «Джейн Эйр».",
     "place_name": "Cowan Bridge"},
    {"event_type": "correspondence", "date_value": "1837", "date_precision": "year",
     "label": "Переписка с Робертом Саути",
     "description": "Шарлотта написала письмо поэту-лауреату Роберту Саути с просьбой оценить её стихи. Саути ответил, похвалив её талант, но посоветовал не делать литературу своей профессией."},
    {"event_type": "correspondence", "date_value": "1840", "date_precision": "year",
     "label": "Письма Хартли Кольриджу",
     "description": "Шарлотта отправила свои стихи Хартли Кольриджу, сыну поэта Сэмюэла Тейлора Кольриджа, который дал ей ободряющий отзыв и советы по литературному развитию."},
    {"event_type": "personal", "date_value": "1842", "date_precision": "year",
     "label": "Смерть тёти Элизабет Брэнуэлл",
     "description": "Смерть тёти Элизабет Брэнуэлл, которая заботилась о детях Бронте после смерти их матери. Шарлотта вернулась из Брюсселя в Англию."},
    {"event_type": "career", "date_value": "1846", "date_precision": "year",
     "label": "Публикация стихов под псевдонимами",
     "description": "Сёстры Бронте опубликовали сборник стихов под мужскими псевдонимами: Каррер (Шарлотта), Эллис (Эмили) и Эктон (Энн) Белл."},
    {"event_type": "personal", "date_value": "1848-09", "date_precision": "month",
     "label": "Смерть Брэнуэлла Бронте",
     "description": "Смерть брата Брэнуэлла Бронте от туберкулёза, усугублённого алкоголизмом."},
    {"event_type": "personal", "date_value": "1848-12-19", "date_precision": "full",
     "label": "Смерть Эмили Бронте",
     "description": "Смерть сестры и близкой подруги Эмили Бронте от туберкулёза в возрасте 30 лет."},
    {"event_type": "personal", "date_value": "1849-05-28", "date_precision": "full",
     "label": "Смерть Энн Бронте",
     "description": "Смерть младшей сестры Энн Бронте от туберкулёза в Скарборо."},
    {"event_type": "publication", "date_value": "1849-10-26", "date_precision": "full",
     "label": "Публикация «Шерли»",
     "description": "Вышел в свет роман «Шерли», социальный роман о положении женщин и рабочих конфликтах в Англии начала XIX века.",
     "source_title": "Oxford Reference"},
    {"event_type": "personal", "date_value": "1854-06-29", "date_precision": "full",
     "label": "Свадьба Шарлотты Бронте",
     "description": "Шарлотта Бронте вышла замуж за Артура Белла Николлса, викария Хауорта."},
]

PUBLICATION_UPDATES = {
    "Джейн Эйр": {
        "pen_name": "Currer Bell",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Jane_Eyre",
        "source_title": "Encyclopaedia Britannica",
    },
    "Шерли": {
        "pen_name": "Currer Bell",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Shirley_(novel)",
    },
    "Виллетт": {
        "pen_name": "Currer Bell",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Villette_(novel)",
    },
    "Учитель": {
        "pen_name": "Currer Bell",
        "wikipedia_url": "https://en.wikipedia.org/wiki/The_Professor_(novel)",
    },
}


async def get_or_create_place(session, data: dict) -> Place:
    result = await session.execute(
        select(Place).where(Place.name == data["name"])
    )
    place = result.scalar_one_or_none()
    if place:
        return place
    place = Place(
        id=uuid.uuid4(),
        name=data["name"],
        name_native=data.get("name_native"),
        country=data.get("country"),
        region=data.get("region"),
        place_type=data.get("place_type"),
    )
    session.add(place)
    await session.flush()
    print(f"  Created place: {place.name}")
    return place


async def get_or_create_source(session, title: str, url: str = None) -> Source:
    result = await session.execute(
        select(Source).where(Source.title == title)
    )
    source = result.scalar_one_or_none()
    if source:
        return source
    source = Source(
        id=uuid.uuid4(),
        title=title,
        source_type="reference",
        url=url,
        reliability_score="4",
        source_origin="curator",
    )
    session.add(source)
    await session.flush()
    print(f"  Created source: {source.title}")
    return source


async def get_or_create_knowledge_node(session, name: str, name_ru: str, node_type: str) -> KnowledgeNode:
    slug = _normalize_slug(name)
    result = await session.execute(
        select(KnowledgeNode).where(KnowledgeNode.slug == slug)
    )
    node = result.scalar_one_or_none()
    if node:
        return node
    node = KnowledgeNode(
        id=uuid.uuid4(),
        name=name,
        slug=slug,
        node_type=node_type,
        metadata={"name_ru": name_ru},
    )
    session.add(node)
    await session.flush()
    print(f"  Created node: {node.name} ({node_type})")
    return node


async def ensure_relation(session, author_id, node_id, relation_type):
    result = await session.execute(
        select(AuthorKnowledgeRelation).where(
            AuthorKnowledgeRelation.author_id == author_id,
            AuthorKnowledgeRelation.node_id == node_id,
            AuthorKnowledgeRelation.relation_type == relation_type,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return
    rel = AuthorKnowledgeRelation(
        id=uuid.uuid4(),
        author_id=author_id,
        node_id=node_id,
        relation_type=relation_type,
        source="curator",
        status="verified",
        confidence=1.0,
    )
    session.add(rel)
    await session.flush()
    print(f"  Created relation: {author_id} --{relation_type}--> {node_id}")


async def main():
    async with AsyncSessionLocal() as session:
        # Find Charlotte
        result = await session.execute(
            select(Author).where(Author.slug == CHARLOTTE_SLUG)
        )
        author = result.scalar_one_or_none()
        if not author:
            print("ERROR: Charlotte Brontë not found")
            return
        print(f"Found: {author.display_name} (id={author.id})")

        # === 1. Create Places and link to author ===
        print("\n--- Places ---")
        places = {}
        for pdata in PLACES:
            place = await get_or_create_place(session, pdata)
            places[pdata["name"]] = place

        # Link birth place
        if "Thornton" in places:
            author.birth_place_id = places["Thornton"].id
            author.birth_place = "Thornton"
            print(f"  Set birth_place to Thornton ({places['Thornton'].id})")

        if "Haworth" in places:
            author.death_place_id = places["Haworth"].id
            author.death_place = "Haworth"
            print(f"  Set death_place to Haworth ({places['Haworth'].id})")

        # === 2. Create knowledge nodes + relations ===
        print("\n--- Connections ---")
        for cdata in CONNECTIONS:
            node = await get_or_create_knowledge_node(
                session, cdata["name"], cdata["name_ru"], cdata["node_type"]
            )
            await ensure_relation(session, author.id, node.id, cdata["relation"])
            author_slug = cdata.get("author_slug")
            if author_slug:
                linked = await session.execute(
                    select(Author).where(Author.slug == author_slug)
                )
                linked_author = linked.scalar_one_or_none()
                if linked_author and node.author_id != linked_author.id:
                    node.author_id = linked_author.id
                    print(f"  Linked node {node.name} → author {linked_author.slug}")

        # === 2.1. Taxonomy (genres/themes/motifs/concepts/atmospheres) ===
        print("\n--- Taxonomy ---")
        for field, items in TAXONOMY.items():
            node_type = TAXONOMY_NODE_TYPE[field]
            relation_type = TAXONOMY_RELATION_TYPE[field]

            if field == "genres":
                stale = await session.execute(
                    select(AuthorKnowledgeRelation).where(
                        AuthorKnowledgeRelation.author_id == author.id,
                        AuthorKnowledgeRelation.relation_type == relation_type,
                    )
                )
                for rel in stale.scalars().all():
                    await session.delete(rel)
                    print(f"  Removed stale genre relation: {rel.node_id}")

            linked_node_ids = set()
            for item in items:
                node = await get_or_create_knowledge_node(session, item, item, node_type)
                linked_node_ids.add(node.id)
                await ensure_relation(session, author.id, node.id, relation_type)

            print(f"  {field}: {len(linked_node_ids)} relations")

        author.genres = list(TAXONOMY["genres"])
        author.themes = list(TAXONOMY["themes"])
        author.motifs = list(TAXONOMY["motifs"])
        author.concepts = list(TAXONOMY["concepts"])
        author.atmospheres = list(TAXONOMY["atmospheres"])
        print("  Updated author taxonomy columns (genres/themes/motifs/concepts/atmospheres)")

        # === 3. Add timeline events ===
        print("\n--- Timeline Events ---")
        existing_events = await session.execute(
            select(TimelineEvent).where(TimelineEvent.author_id == author.id)
        )
        existing_labels = {ev.label for ev in existing_events.scalars().all()}

        for evdata in TIMELINE_EVENTS:
            label = evdata["label"]
            if label in existing_labels:
                print(f"  Skipped (exists): {label}")
                continue

            place_id = None
            if "place_name" in evdata and evdata["place_name"] in places:
                place_id = places[evdata["place_name"]].id

            source_id = None
            if "source_title" in evdata:
                src = await get_or_create_source(session, evdata["source_title"])
                source_id = src.id

            event = TimelineEvent(
                id=uuid.uuid4(),
                author_id=author.id,
                event_type=evdata["event_type"],
                date_value=evdata["date_value"],
                date_precision=evdata["date_precision"],
                label=evdata["label"],
                description=evdata.get("description"),
                place_id=place_id,
                source_id=source_id,
                extraction_source="manual",
                confidence=1.0,
                status="verified",
            )
            session.add(event)
            print(f"  Added event: {label}")

        # === 4. Update publications with pen_name, wikipedia_url, source ===
        print("\n--- Publications ---")
        pubs_result = await session.execute(
            select(AuthorPublication).where(AuthorPublication.author_id == author.id)
        )
        for pub in pubs_result.scalars().all():
            update = PUBLICATION_UPDATES.get(pub.title)
            if update:
                pub.pen_name = update.get("pen_name")
                pub.wikipedia_url = update.get("wikipedia_url")
                if "source_title" in update:
                    src = await get_or_create_source(session, update["source_title"])
                    pub.source_id = src.id
                print(f"  Updated: {pub.title} (pen_name={pub.pen_name}, wiki={pub.wikipedia_url})")

        await session.commit()
        print("\n✅ All data seeded successfully!")

        # === Verify ===
        print("\n--- Verification ---")
        print(f"  Birth place: {author.birth_place} (id={author.birth_place_id})")
        print(f"  Death place: {author.death_place} (id={author.death_place_id})")

        ev_count = await session.execute(
            select(TimelineEvent).where(TimelineEvent.author_id == author.id)
        )
        print(f"  Timeline events: {len(ev_count.scalars().all())}")

        rel_count = await session.execute(
            select(AuthorKnowledgeRelation).where(AuthorKnowledgeRelation.author_id == author.id)
        )
        print(f"  Knowledge relations: {len(rel_count.scalars().all())}")

        tax_counts = {}
        for field, relation_type in TAXONOMY_RELATION_TYPE.items():
            n = await session.execute(
                select(AuthorKnowledgeRelation).where(
                    AuthorKnowledgeRelation.author_id == author.id,
                    AuthorKnowledgeRelation.relation_type == relation_type,
                )
            )
            tax_counts[field] = len(n.scalars().all())
        print(f"  Taxonomy relations: {tax_counts}")

        pub_count = await session.execute(
            select(AuthorPublication).where(AuthorPublication.author_id == author.id)
        )
        pubs = pub_count.scalars().all()
        print(f"  Publications: {len(pubs)}")
        for p in pubs:
            print(f"    [{p.publication_type}] {p.title}: pen_name={p.pen_name}, wiki={p.wikipedia_url}")


asyncio.run(main())
