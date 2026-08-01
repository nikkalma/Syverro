"""Add lifecycle columns to knowledge_nodes.

Adds description, status (draft/published), is_sapphire and explorer_visible so
Genre / Literary Movement / Place / Timeline Event nodes can be managed as
first-class entities in the Studio with a minimal lifecycle. Existing data is
untouched: all existing rows default to draft, non-sapphire, hidden from Explorer.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0016_knowledge_node_lifecycle"
down_revision: Union[str, None] = "0015_knowledge_node_place_link"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("knowledge_nodes", sa.Column("description", sa.Text(), nullable=True))
    op.add_column(
        "knowledge_nodes",
        sa.Column("status", sa.String(), server_default="draft", nullable=False),
    )
    op.add_column(
        "knowledge_nodes",
        sa.Column("is_sapphire", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.add_column(
        "knowledge_nodes",
        sa.Column("explorer_visible", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("knowledge_nodes", "explorer_visible")
    op.drop_column("knowledge_nodes", "is_sapphire")
    op.drop_column("knowledge_nodes", "status")
    op.drop_column("knowledge_nodes", "description")
