"""SyvAI 0.2A: bounded source discovery persistence.

Adds the discovery-metadata columns on ``sources`` (authority tier, review
status, normalized URL, discovery provenance) and the ``source_candidates``
table that records every candidate page surfaced by the bounded discovery
layer before a human or the deterministic classifier decides its fate.

The pipeline (``load_trusted_sources`` -> timeline prompt -> validators ->
proposals) is untouched; discovery only produces new ``sources`` rows that
the existing pipeline will later consume.

Revision ID: 0023_source_discovery
Revises: 0022_syvai_review_bands
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0023_source_discovery"
down_revision: Union[str, None] = "0022_syvai_review_bands"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("sources", sa.Column("authority_tier", sa.String(), nullable=True))
    op.add_column(
        "sources",
        sa.Column("review_status", sa.String(), server_default="pending", nullable=False),
    )
    op.add_column("sources", sa.Column("normalized_url", sa.String(), nullable=True))
    op.add_column("sources", sa.Column("discovered_by", sa.String(), nullable=True))
    op.add_column("sources", sa.Column("discovered_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_sources_review_status", "sources", ["review_status"])
    op.create_index("ix_sources_normalized_url", "sources", ["normalized_url"])

    op.create_table(
        "source_candidates",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "author_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("authors.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "run_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("syvai_runs.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "source_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("sources.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("normalized_url", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("source_type", sa.String(), nullable=True),
        sa.Column("authority_tier", sa.String(), nullable=False),
        sa.Column("quality_score", sa.Float(), nullable=True),
        sa.Column("assessment", sa.String(), nullable=False),
        sa.Column("assessment_reason", sa.String(), nullable=True),
        sa.Column("provider", sa.String(), nullable=True),
        sa.Column("origin", sa.String(), nullable=True),
        sa.Column("evidence", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), server_default="pending", nullable=False),
        sa.Column("review_action", sa.String(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("author_id", "normalized_url", name="uq_source_candidates_author_normalized"),
    )
    op.create_index("ix_source_candidates_author_id", "source_candidates", ["author_id"])
    op.create_index("ix_source_candidates_run_id", "source_candidates", ["run_id"])
    op.create_index("ix_source_candidates_source_id", "source_candidates", ["source_id"])
    op.create_index("ix_source_candidates_status", "source_candidates", ["status"])
    op.create_index("ix_source_candidates_assessment", "source_candidates", ["assessment"])


def downgrade() -> None:
    op.drop_index("ix_source_candidates_assessment", table_name="source_candidates")
    op.drop_index("ix_source_candidates_status", table_name="source_candidates")
    op.drop_index("ix_source_candidates_source_id", table_name="source_candidates")
    op.drop_index("ix_source_candidates_run_id", table_name="source_candidates")
    op.drop_index("ix_source_candidates_author_id", table_name="source_candidates")
    op.drop_table("source_candidates")

    op.drop_index("ix_sources_normalized_url", table_name="sources")
    op.drop_index("ix_sources_review_status", table_name="sources")
    op.drop_column("sources", "discovered_at")
    op.drop_column("sources", "discovered_by")
    op.drop_column("sources", "normalized_url")
    op.drop_column("sources", "review_status")
    op.drop_column("sources", "authority_tier")
