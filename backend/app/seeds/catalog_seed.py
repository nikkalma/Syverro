"""Idempotent catalog reference-data seeds."""

import logging
from uuid import uuid4

from app.services.book_slug import generate_unique_book_slug

logger = logging.getLogger(__name__)

GENRE_SEED_DATA = [
    # (name, slug, type, parent_slug_or_None)
    ("Fiction", "fiction", "literary", None),
    ("Prose", "prose", "literary", "fiction"),
    ("Poetry", "poetry", "literary", "fiction"),
    ("Drama", "drama", "literary", "fiction"),
    ("Fantasy", "fantasy", "literary", "fiction"),
    ("Science Fiction", "science-fiction", "literary", "fiction"),
    ("Detective", "detective", "literary", "fiction"),
    ("Horror", "horror", "literary", "fiction"),
    ("Historical Fiction", "historical-fiction", "literary", "fiction"),
    ("Romance", "romance", "literary", "fiction"),

    ("Non-Fiction", "non-fiction", "non_fiction", None),
    ("Science", "science", "non_fiction", "non-fiction"),
    ("Philosophy", "philosophy", "non_fiction", "non-fiction"),
    ("History", "history", "non_fiction", "non-fiction"),
    ("Biography", "biography", "non_fiction", "non-fiction"),
    ("Psychology", "psychology", "non_fiction", "non-fiction"),
    ("Economics", "economics", "non_fiction", "non-fiction"),
    ("Business", "business", "non_fiction", "non-fiction"),
    ("Management", "management", "non_fiction", "business"),
    ("Marketing", "marketing", "non_fiction", "business"),
    ("Finance", "finance", "non_fiction", "business"),
    ("Self Development", "self-development", "non_fiction", "non-fiction"),
    ("Education", "education", "non_fiction", "non-fiction"),
    ("Entrepreneurship", "entrepreneurship", "non_fiction", "business"),
    ("Leadership", "leadership", "non_fiction", "business"),
    ("Strategy", "strategy", "non_fiction", "business"),
    ("Corporate Culture", "corporate-culture", "non_fiction", "business"),

    ("Spiritual", "spiritual", "spiritual", None),
    ("Esotericism", "esotericism", "spiritual", "spiritual"),
    ("Tarot", "tarot", "spiritual", "esotericism"),
    ("Astrology", "astrology", "spiritual", "esotericism"),
    ("Occultism", "occultism", "spiritual", "esotericism"),
    ("Meditation", "meditation", "spiritual", "spiritual"),
    ("Spiritual Practices", "spiritual-practices", "spiritual", "spiritual"),
    ("Religious Texts", "religious-texts", "spiritual", "spiritual"),
    ("Theology", "theology", "spiritual", "spiritual"),

    ("Cultural", "cultural", "cultural", None),
    ("Mythology", "mythology", "cultural", "cultural"),
    ("Folklore", "folklore", "cultural", "cultural"),
    ("Epics", "epics", "cultural", "cultural"),
    ("Oral Tradition", "oral-tradition", "cultural", "cultural"),

    ("Practical", "practical", "practical", None),
    ("Cooking", "cooking", "practical", "practical"),
    ("Travel", "travel", "practical", "practical"),
    ("Art", "art", "practical", "practical"),
    ("Music", "music", "practical", "practical"),
    ("Photography", "photography", "practical", "practical"),
    ("Sport", "sport", "practical", "practical"),
    ("Crafts", "crafts", "practical", "practical"),
    ("Hobbies", "hobbies", "practical", "practical"),
]


async def seed_genres(conn):
    """Insert seed genres. Uses ON CONFLICT DO NOTHING so only missing genres are added."""
    from sqlalchemy import text

    logger.info("🌱 Ensuring genre taxonomy is seeded...")

    slug_to_id = {}
    inserted = 0
    for name, slug, genre_type, parent_slug in GENRE_SEED_DATA:
        # First, try to find existing by slug
        fetch = await conn.execute(text("SELECT id FROM genres WHERE slug = :slug"), {"slug": slug})
        row = fetch.fetchone()
        if row:
            slug_to_id[slug] = str(row[0])
            continue

        # Not found — insert it (resolve parent_id from already-seeded slugs)
        parent_id = f"'{slug_to_id[parent_slug]}'" if parent_slug else "NULL"
        insert_sql = text(
            f"""INSERT INTO genres (id, name, slug, type, parent_id)
                VALUES (gen_random_uuid(), :name, :slug, :type, {parent_id})
                ON CONFLICT (slug) DO NOTHING
                RETURNING id"""
        )
        result = await conn.execute(insert_sql, {"name": name, "slug": slug, "type": genre_type})
        new_row = result.fetchone()
        if new_row:
            slug_to_id[slug] = str(new_row[0])
            inserted += 1
        else:
            # Race condition fallback
            fetch2 = await conn.execute(text("SELECT id FROM genres WHERE slug = :slug"), {"slug": slug})
            r2 = fetch2.fetchone()
            if r2:
                slug_to_id[slug] = str(r2[0])

    logger.info(f"✅ Genre seed complete: {inserted} new genres inserted, {len(GENRE_SEED_DATA) - inserted} already existed")


async def migrate_json_genres_to_relations(conn):
    """One-time migration: copy JSON genres string[] → book_genres relations."""
    from sqlalchemy import text

    # Check if migration already ran (no books with genres JSON and no book_genres rows)
    result = await conn.execute(text("SELECT count(*) FROM book_genres"))
    bkr_count = result.scalar()
    if bkr_count and bkr_count > 0:
        return

    result = await conn.execute(text(
        "SELECT count(*) FROM books WHERE genres IS NOT NULL AND jsonb_array_length(genres::jsonb) > 0"
    ))
    book_count = result.scalar()
    if not book_count or book_count == 0:
        return

    logger.info(f"🔄 Migrating JSON genres → book_genres for {book_count} books...")

    # Get all books with genres
    result = await conn.execute(text(
        "SELECT id, genres FROM books WHERE genres IS NOT NULL AND jsonb_array_length(genres::jsonb) > 0"
    ))
    books = result.fetchall()

    migrated = 0
    for book_id, genres_json in books:
        if not genres_json:
            continue
        import json
        genre_names = json.loads(genres_json) if isinstance(genres_json, str) else genres_json
        if not isinstance(genre_names, list):
            continue

        for genre_name in genre_names:
            if not isinstance(genre_name, str) or not genre_name.strip():
                continue
            genre_name = genre_name.strip()

            # Find or create genre
            find_result = await conn.execute(
                text("SELECT id FROM genres WHERE name = :name"), {"name": genre_name}
            )
            row = find_result.fetchone()
            if row:
                genre_id = row[0]
            else:
                # Create genre with auto-slug
                import re
                slug = genre_name.lower()
                slug = re.sub(r'[^\w\s-]', '', slug)
                slug = re.sub(r'[-\s]+', '-', slug).strip('-')
                insert_result = await conn.execute(
                    text("INSERT INTO genres (id, name, slug, type) VALUES (gen_random_uuid(), :name, :slug, 'literary') RETURNING id"),
                    {"name": genre_name, "slug": slug}
                )
                genre_id = insert_result.fetchone()[0]

            # Create relation (ignore duplicates)
            await conn.execute(
                text("INSERT INTO book_genres (book_id, genre_id) VALUES (:book_id, :genre_id) ON CONFLICT DO NOTHING"),
                {"book_id": book_id, "genre_id": genre_id}
            )
            migrated += 1

    logger.info(f"✅ Migrated {migrated} book-genre relations")


SEED_BOOKS = [
    {
        "title": "Dune",
        "author": "Frank Herbert",
        "author_country": "United States",
        "description": "Set in the distant future, Dune tells the story of Paul Atreides on the desert planet Arrakis, the only source of the spice melange, the most important substance in the universe.",
        "genres": ["science-fiction", "fiction"],
        "themes": ["Power", "Ecology", "Religion"],
        "cover": "https://covers.openlibrary.org/b/id/11153269-L.jpg",
        "total_pages": 688,
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "author_country": "United Kingdom",
        "description": "A dystopian novel set in a totalitarian society ruled by Big Brother, exploring themes of surveillance, truth manipulation, and individual freedom.",
        "genres": ["fiction", "science-fiction"],
        "themes": ["Totalitarianism", "Freedom", "Truth"],
        "cover": "https://covers.openlibrary.org/b/id/12648523-L.jpg",
        "total_pages": 328,
    },
    {
        "title": "The Name of the Wind",
        "author": "Patrick Rothfuss",
        "author_country": "United States",
        "description": "The story of Kvothe, a legendary figure who recounts his life from childhood to becoming the most famous wizard of his age.",
        "genres": ["fantasy", "fiction"],
        "themes": ["Knowledge", "Identity", "Storytelling"],
        "cover": "https://covers.openlibrary.org/b/id/14628241-L.jpg",
        "total_pages": 662,
    },
    {
        "title": "Sapiens: A Brief History of Humankind",
        "author": "Yuval Noah Harari",
        "author_country": "Israel",
        "description": "A sweeping history of humanity from the Stone Age to the present, exploring how Homo sapiens came to dominate the planet.",
        "genres": ["non-fiction", "history"],
        "themes": ["Evolution", "Civilization", "Culture"],
        "cover": "https://covers.openlibrary.org/b/id/14632832-L.jpg",
        "total_pages": 443,
    },
    {
        "title": "Roadside Picnic",
        "author": "Arkady and Boris Strugatsky",
        "author_country": "Russia",
        "description": "After an extraterrestrial visitation leaves mysterious Zones on Earth, stalkers risk their lives to venture into these dangerous areas and retrieve alien artifacts.",
        "genres": ["science-fiction", "fiction"],
        "themes": ["Unknown", "Human Nature", "Sacrifice"],
        "cover": "https://covers.openlibrary.org/b/id/10837554-L.jpg",
        "total_pages": 224,
    },
]


async def seed_books(conn):
    """Seed development books if the books table is empty."""
    from sqlalchemy import text
    import json

    result = await conn.execute(text("SELECT count(*) FROM books"))
    count = result.scalar()
    if count and count > 0:
        logger.info(f"📚 Books table has {count} books — skipping seed")
        return

    logger.info("🌱 Seeding development books...")
    slug_to_id = {}
    for slug in set(g for book in SEED_BOOKS for g in book["genres"]):
        fetch = await conn.execute(text("SELECT id FROM genres WHERE slug = :slug"), {"slug": slug})
        row = fetch.fetchone()
        if row:
            slug_to_id[slug] = row[0]

    inserted = 0
    for book_data in SEED_BOOKS:
        author_name = book_data["author"]

        author_result = await conn.execute(
            text("SELECT id FROM authors WHERE name = :name"),
            {"name": author_name},
        )
        author_row = author_result.fetchone()
        if author_row:
            author_id = author_row[0]
        else:
            author_result = await conn.execute(
                text(
                    "INSERT INTO authors (id, name, country) "
                    "VALUES (gen_random_uuid(), :name, :country) RETURNING id"
                ),
                {"name": author_name, "country": book_data.get("author_country")},
            )
            author_id = author_result.fetchone()[0]

        book_id = uuid4()
        book_slug = await generate_unique_book_slug(
            conn,
            book_data["title"],
            publication_year=book_data.get("original_publication_year"),
            book_id=book_id,
        )
        book_result = await conn.execute(
            text(
                "INSERT INTO books (id, slug, title, author, author_id, description, cover, "
                "total_pages, genres, themes, version, is_published, publication_type, "
                "metadata_status, moderation_status) "
                "VALUES (:id, :slug, :title, :author, :author_id, :description, :cover, "
                ":total_pages, :genres, :themes, 1, true, 'official', "
                "'incomplete', 'approved') RETURNING id"
            ),
            {
                "id": book_id,
                "title": book_data["title"],
                "slug": book_slug,
                "author": author_name,
                "author_id": author_id,
                "description": book_data["description"],
                "cover": book_data.get("cover"),
                "total_pages": book_data.get("total_pages"),
                "genres": json.dumps(book_data["genres"]),
                "themes": json.dumps(book_data.get("themes", [])),
            },
        )
        book_id = book_result.fetchone()[0]

        for genre_slug in book_data["genres"]:
            genre_id = slug_to_id.get(genre_slug)
            if genre_id:
                await conn.execute(
                    text(
                        "INSERT INTO book_genres (book_id, genre_id) "
                        "VALUES (:book_id, :genre_id) ON CONFLICT DO NOTHING"
                    ),
                    {"book_id": book_id, "genre_id": genre_id},
                )

        inserted += 1

    logger.info(f"✅ Seeded {inserted} development books")
