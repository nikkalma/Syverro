from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.author import Author


async def find_or_create_author(db: AsyncSession, author_name: str) -> Author:
    """Find author by name (case-insensitive) or create new one."""
    result = await db.execute(
        select(Author).where(func.lower(Author.name) == author_name.strip().lower())
    )
    author = result.scalar_one_or_none()
    if not author:
        author = Author(name=author_name.strip())
        db.add(author)
        await db.flush()
    return author
