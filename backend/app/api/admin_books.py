from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.book import Book
from app.models.author import Author
from app.models.book_author import book_authors
from app.schemas.author import AuthorResponse
from typing import List, Optional
from uuid import UUID
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin-books"])


async def check_moderator(user: User) -> User:
    if user.role not in ["owner", "admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Moderator access required")
    return user


async def check_admin(user: User) -> User:
    if user.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ============================================================
# BOOK ↔ AUTHORS (many-to-many relationship management)
# ============================================================


@router.get("/books/{book_id}/authors", response_model=List[AuthorResponse])
async def get_book_authors(
    book_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_moderator(current_user)

    book_result = await db.execute(select(Book).where(Book.id == book_id))
    book = book_result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    result = await db.execute(
        select(Author)
        .join(book_authors, book_authors.c.author_id == Author.id)
        .where(book_authors.c.book_id == book_id)
    )
    return result.scalars().all()


@router.post("/books/{book_id}/authors", status_code=status.HTTP_201_CREATED)
async def link_author_to_book(
    book_id: UUID,
    author_id: UUID = Query(..., description="Author ID to link"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_moderator(current_user)

    book_result = await db.execute(select(Book).where(Book.id == book_id))
    book = book_result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    author_result = await db.execute(select(Author).where(Author.id == author_id))
    author = author_result.scalar_one_or_none()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")

    # Check if already linked
    existing = await db.execute(
        select(book_authors).where(
            book_authors.c.book_id == book_id,
            book_authors.c.author_id == author_id,
        )
    )
    if existing.fetchone():
        raise HTTPException(status_code=409, detail="Author already linked to this book")

    await db.execute(
        book_authors.insert().values(book_id=book_id, author_id=author_id)
    )
    await db.commit()
    logger.info(f"Book {book_id} linked to author {author_id} by {current_user.email}")
    return {"message": "Author linked to book", "author_id": str(author_id)}


@router.delete("/books/{book_id}/authors/{author_id}")
async def unlink_author_from_book(
    book_id: UUID,
    author_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_moderator(current_user)

    existing = await db.execute(
        select(book_authors).where(
            book_authors.c.book_id == book_id,
            book_authors.c.author_id == author_id,
        )
    )
    if not existing.fetchone():
        raise HTTPException(status_code=404, detail="Author not linked to this book")

    await db.execute(
        delete(book_authors).where(
            book_authors.c.book_id == book_id,
            book_authors.c.author_id == author_id,
        )
    )
    await db.commit()
    logger.info(f"Book {book_id} unlinked from author {author_id} by {current_user.email}")
    return {"message": "Author unlinked from book"}
