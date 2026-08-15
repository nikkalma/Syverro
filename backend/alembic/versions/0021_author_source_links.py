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
    op.execute(
        """
        UPDATE authors
        SET birth_place = places.name
        FROM places
        WHERE authors.birth_place_id = places.id
          AND authors.birth_place IS DISTINCT FROM places.name
        """
    )
    op.execute(
        """
        UPDATE authors
        SET death_place = places.name
        FROM places
        WHERE authors.death_place_id = places.id
          AND authors.death_place IS DISTINCT FROM places.name
        """
    )


def downgrade() -> None:
    op.drop_table("author_source_links")
