"""Add pen_name and wikipedia_url to author_publications."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0011_publication_fields"
down_revision: Union[str, None] = "0010_author_publications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("author_publications", sa.Column("pen_name", sa.String(), nullable=True))
    op.add_column("author_publications", sa.Column("wikipedia_url", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("author_publications", "wikipedia_url")
    op.drop_column("author_publications", "pen_name")
