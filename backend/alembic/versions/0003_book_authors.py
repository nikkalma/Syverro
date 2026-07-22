"""Add book_authors junction table for many-to-many Book-Author.

Creates the book_authors association table so that books can have
multiple authors and authors can be linked to multiple books.

This is additive only — the legacy book.author and book.author_id
columns are preserved for backward compatibility.

Revision ID: 0003_book_authors
Revises: 0002_knowledge_graph
Create Date: 2026-07-22
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0003_book_authors"
down_revision: Union[str, None] = "0002_knowledge_graph"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "book_authors",
        sa.Column("book_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("authors.id", ondelete="CASCADE"), primary_key=True),
    )
    op.create_index(op.f("ix_book_authors_book_id"), "book_authors", ["book_id"])
    op.create_index(op.f("ix_book_authors_author_id"), "book_authors", ["author_id"])


def downgrade() -> None:
    op.drop_table("book_authors")
