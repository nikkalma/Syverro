"""Add extended taxonomy fields to authors and author_id to knowledge_nodes."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0013_author_taxonomy_fields"
down_revision: Union[str, None] = "0012_quote_type"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("authors", sa.Column("themes", sa.ARRAY(sa.String()), server_default="{}", nullable=True))
    op.add_column("authors", sa.Column("motifs", sa.ARRAY(sa.String()), server_default="{}", nullable=True))
    op.add_column("authors", sa.Column("concepts", sa.ARRAY(sa.String()), server_default="{}", nullable=True))
    op.add_column("authors", sa.Column("atmospheres", sa.ARRAY(sa.String()), server_default="{}", nullable=True))
    op.add_column("knowledge_nodes", sa.Column("author_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index("ix_knowledge_nodes_author_id", "knowledge_nodes", ["author_id"])
    op.create_foreign_key(
        "fk_knowledge_nodes_author_id",
        "knowledge_nodes", "authors",
        ["author_id"], ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_knowledge_nodes_author_id", "knowledge_nodes", type_="foreignkey")
    op.drop_index("ix_knowledge_nodes_author_id", table_name="knowledge_nodes")
    op.drop_column("knowledge_nodes", "author_id")
    op.drop_column("authors", "atmospheres")
    op.drop_column("authors", "concepts")
    op.drop_column("authors", "motifs")
    op.drop_column("authors", "themes")
