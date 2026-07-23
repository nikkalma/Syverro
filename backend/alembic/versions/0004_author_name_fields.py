"""Add structured name fields to Author.

Adds first_name, middle_name, last_name, native_name, and sort_name
columns to the authors table. All nullable to avoid breaking existing
records. The legacy name column is preserved.

Revision ID: 0004_author_name_fields
Revises: 0003_book_authors
Create Date: 2026-07-22
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0004_author_name_fields"
down_revision: Union[str, None] = "0003_book_authors"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("authors", sa.Column("first_name", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("middle_name", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("last_name", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("native_name", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("sort_name", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("authors", "sort_name")
    op.drop_column("authors", "native_name")
    op.drop_column("authors", "last_name")
    op.drop_column("authors", "middle_name")
    op.drop_column("authors", "first_name")
