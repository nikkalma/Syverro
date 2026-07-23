"""Add extended fields to Author and create AuthorAwards table.

Adds fields: pseudonyms, nationality, languages, gender, official_website,
wikipedia_url, birth_date, death_date, birth_place, death_place, occupations,
literary_movements, active_from_year, active_to_year, notable_works, genres,
writing_languages, gallery, signature_image, portrait_caption.
Creates author_awards table.

Revision ID: 0005_author_extended_fields
Revises: 0004_author_name_fields
Create Date: 2026-07-23
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0005_author_extended_fields"
down_revision: Union[str, None] = "0004_author_name_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to authors table
    op.add_column("authors", sa.Column("pseudonyms", postgresql.ARRAY(sa.String()), nullable=True, server_default="{}"))
    op.add_column("authors", sa.Column("nationality", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("languages", postgresql.ARRAY(sa.String()), nullable=True, server_default="{}"))
    op.add_column("authors", sa.Column("gender", sa.String(), nullable=True, server_default="unknown"))
    op.add_column("authors", sa.Column("official_website", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("wikipedia_url", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("birth_date", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("death_date", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("birth_place", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("death_place", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("occupations", postgresql.ARRAY(sa.String()), nullable=True, server_default="{}"))
    op.add_column("authors", sa.Column("literary_movements", postgresql.ARRAY(sa.String()), nullable=True, server_default="{}"))
    op.add_column("authors", sa.Column("active_from_year", sa.Integer(), nullable=True))
    op.add_column("authors", sa.Column("active_to_year", sa.Integer(), nullable=True))
    op.add_column("authors", sa.Column("notable_works", postgresql.ARRAY(sa.String()), nullable=True, server_default="{}"))
    op.add_column("authors", sa.Column("genres", postgresql.ARRAY(sa.String()), nullable=True, server_default="{}"))
    op.add_column("authors", sa.Column("writing_languages", postgresql.ARRAY(sa.String()), nullable=True, server_default="{}"))
    op.add_column("authors", sa.Column("gallery", postgresql.ARRAY(sa.String()), nullable=True, server_default="{}"))
    op.add_column("authors", sa.Column("signature_image", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("portrait_caption", sa.String(), nullable=True))

    # Create author_awards table
    op.create_table(
        "author_awards",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("authors.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("organization", sa.String(), nullable=True),
        sa.Column("work", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("author_awards")
    op.drop_column("authors", "portrait_caption")
    op.drop_column("authors", "signature_image")
    op.drop_column("authors", "gallery")
    op.drop_column("authors", "writing_languages")
    op.drop_column("authors", "genres")
    op.drop_column("authors", "notable_works")
    op.drop_column("authors", "active_to_year")
    op.drop_column("authors", "active_from_year")
    op.drop_column("authors", "literary_movements")
    op.drop_column("authors", "occupations")
    op.drop_column("authors", "death_place")
    op.drop_column("authors", "birth_place")
    op.drop_column("authors", "death_date")
    op.drop_column("authors", "birth_date")
    op.drop_column("authors", "wikipedia_url")
    op.drop_column("authors", "official_website")
    op.drop_column("authors", "gender")
    op.drop_column("authors", "languages")
    op.drop_column("authors", "nationality")
    op.drop_column("authors", "pseudonyms")
