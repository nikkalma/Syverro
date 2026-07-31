"""Link place-type knowledge nodes to the places table.

Adds knowledge_nodes.place_id FK to places(id). A place-type node can point to
a geographic Place row (coordinates, country, wikidata) for geo queries.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0015_knowledge_node_place_link"
down_revision: Union[str, None] = "0014_book_publication_link"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("knowledge_nodes", sa.Column("place_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index("ix_knowledge_nodes_place_id", "knowledge_nodes", ["place_id"])
    op.create_foreign_key(
        "fk_knowledge_nodes_place_id",
        "knowledge_nodes", "places",
        ["place_id"], ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_knowledge_nodes_place_id", "knowledge_nodes", type_="foreignkey")
    op.drop_index("ix_knowledge_nodes_place_id", table_name="knowledge_nodes")
    op.drop_column("knowledge_nodes", "place_id")
