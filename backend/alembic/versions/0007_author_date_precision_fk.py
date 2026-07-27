"""Add birth/death date precision columns and place FKs to authors.

Revision ID: 0007
Revises: 0006_author_identity_fields
Create Date: 2026-07-27
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0007_author_date_precision_fk"
down_revision: Union[str, None] = "0006_author_identity_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("authors", sa.Column("birth_date_precision", sa.String(), server_default="full", nullable=True))
    op.add_column("authors", sa.Column("death_date_precision", sa.String(), server_default="full", nullable=True))
    op.add_column("authors", sa.Column("birth_place_id", sa.Uuid(), nullable=True))
    op.add_column("authors", sa.Column("death_place_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_authors_birth_place_id",
        "authors", "places",
        ["birth_place_id"], ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_authors_death_place_id",
        "authors", "places",
        ["death_place_id"], ["id"],
        ondelete="SET NULL",
    )
    op.add_column("authors", sa.Column("metadata_status", sa.String(), server_default="draft", nullable=False))


def downgrade() -> None:
    op.drop_column("authors", "metadata_status")
    op.drop_constraint("fk_authors_death_place_id", "authors", type_="foreignkey")
    op.drop_constraint("fk_authors_birth_place_id", "authors", type_="foreignkey")
    op.drop_column("authors", "death_place_id")
    op.drop_column("authors", "birth_place_id")
    op.drop_column("authors", "death_date_precision")
    op.drop_column("authors", "birth_date_precision")
