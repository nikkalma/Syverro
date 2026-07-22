"""Initial baseline — represents existing schema state.

Created via Base.metadata.create_all(). All existing tables are
already present in the database. This is an empty migration that
serves as the foundation for future additive migrations.

Revision ID: 0001_baseline
Revises: None
Create Date: 2026-07-22
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
