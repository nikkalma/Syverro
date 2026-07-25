"""Add identity fields to Author: slug, display_name, display_name_mode, pen_names, birth_name, search_aliases.

Revision ID: 0006_author_identity_fields
Revises: 0005_author_extended_fields
Create Date: 2026-07-25
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0006_author_identity_fields"
down_revision: Union[str, None] = "0005_author_extended_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("authors", sa.Column("display_name", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("display_name_mode", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("pen_names", postgresql.ARRAY(sa.String()), nullable=True, server_default="{}"))
    op.add_column("authors", sa.Column("birth_name", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("slug", sa.String(), nullable=True, unique=True))
    op.add_column("authors", sa.Column("search_aliases", sa.Text(), nullable=True))
    op.create_index(op.f("ix_authors_slug"), "authors", ["slug"])


def downgrade() -> None:
    op.drop_index(op.f("ix_authors_slug"), table_name="authors")
    op.drop_column("authors", "search_aliases")
    op.drop_column("authors", "slug")
    op.drop_column("authors", "birth_name")
    op.drop_column("authors", "pen_names")
    op.drop_column("authors", "display_name_mode")
    op.drop_column("authors", "display_name")
