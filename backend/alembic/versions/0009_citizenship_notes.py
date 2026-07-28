"""Add notes column to author_citizenships.

Revision ID: 0009
Revises: 0008_golden_author_model
Create Date: 2026-07-27
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "0009_citizenship_notes"
down_revision: Union[str, None] = "0008_golden_author_model"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("author_citizenships", sa.Column("notes", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("author_citizenships", "notes")
