"""Link general sources directly to authors.

Revision ID: 0021_author_source_links
Revises: 0020_security_audit_logs
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0021_author_source_links"
down_revision: Union[str, None] = "0020_security_audit_logs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "author_source_links",
        sa.Column("author_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["author_id"], ["authors.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_id"], ["sources.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("author_id", "source_id"),
    )


def downgrade() -> None:
    op.drop_table("author_source_links")
