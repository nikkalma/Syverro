"""Add canonical ordered authorship for AuthorPublication Works.

Revision ID: 0027_work_authorship
Revises: 0026_curated_corpus
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0027_work_authorship"
down_revision: Union[str, None] = "0026_curated_corpus"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "author_publication_authors",
        sa.Column("publication_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("credited_name", sa.String(), nullable=True),
        sa.CheckConstraint(
            "position >= 1",
            name="ck_author_publication_authors_position_positive",
        ),
        sa.ForeignKeyConstraint(
            ["publication_id"], ["author_publications.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["author_id"], ["authors.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("publication_id", "author_id"),
        sa.UniqueConstraint(
            "publication_id",
            "position",
            name="uq_author_publication_authors_position",
        ),
    )
    op.create_index(
        "ix_author_publication_authors_author_id",
        "author_publication_authors",
        ["author_id"],
    )

    op.execute(
        """
        INSERT INTO author_publication_authors
            (publication_id, author_id, position, credited_name)
        SELECT id, author_id, 1, NULLIF(BTRIM(pen_name), '')
        FROM author_publications
        ON CONFLICT (publication_id, author_id) DO NOTHING
        """
    )


def downgrade() -> None:
    op.drop_index(
        "ix_author_publication_authors_author_id",
        table_name="author_publication_authors",
    )
    op.drop_table("author_publication_authors")
