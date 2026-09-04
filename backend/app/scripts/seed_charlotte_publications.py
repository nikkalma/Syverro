"""Seed Charlotte Brontë publications with descriptions and dates."""
import asyncio
from app.database import AsyncSessionLocal
from app.models.author_publication import AuthorPublication
from app.models.author_publication_author import AuthorPublicationAuthor
from app.models.author import Author
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import date

UPDATES = {
    "Джейн Эйр": {
        "publication_date": date(1847, 10, 16),
        "description": "Роман, принёсший Шарлотте Бронте международную известность и ставший одним из главных произведений викторианской литературы.",
    },
    "Шерли": {
        "description": "Социальный роман о положении женщин и рабочих конфликтах в Англии начала XIX века.",
    },
    "Виллетт": {
        "description": "Психологический роман о внутреннем мире женщины, одиночестве и поиске самостоятельности.",
    },
    "Учитель": {
        "description": "Первый роман Шарлотты Бронте, опубликованный посмертно.",
        "publication_type": "posthumous",
    },
}


async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Author).where(
                Author.slug == "sharlotta-bronte"
            )
        )
        author = result.scalar_one_or_none()
        if not author:
            result = await session.execute(
                select(Author).where(
                    Author.display_name.like("%Бронте%")
                )
            )
            author = result.scalar_one_or_none()
        if not author:
            result = await session.execute(
                select(Author).where(
                    Author.sort_name.like("%Бронте%")
                )
            )
            author = result.scalar_one_or_none()
        if not author:
            print("ERROR: Charlotte Brontë not found")
            return
        print(f"Found: {author.display_name} (slug={author.slug}, id={author.id})")

        result = await session.execute(
            select(AuthorPublication)
            .join(AuthorPublicationAuthor)
            .where(AuthorPublicationAuthor.author_id == author.id)
        )
        pubs = result.scalars().all()
        print(f"Found {len(pubs)} publications for {author.display_name}")

        for pub in pubs:
            update = UPDATES.get(pub.title)
            if update:
                if "publication_date" in update:
                    pub.publication_date = update["publication_date"]
                if "description" in update:
                    pub.description = update["description"]
                if "publication_type" in update:
                    pub.publication_type = update["publication_type"]
                print(f"  Updated: {pub.title}")

        await session.commit()
        print("Done. All updates committed.")


asyncio.run(main())
