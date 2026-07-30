"""Add quote_type to author_quotes."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0012_quote_type"
down_revision: Union[str, None] = "0011_publication_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("author_quotes", sa.Column("quote_type", sa.String(), server_default="author", nullable=False))


def downgrade() -> None:
    op.drop_column("author_quotes", "quote_type")
