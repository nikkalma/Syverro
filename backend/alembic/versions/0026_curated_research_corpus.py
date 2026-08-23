"""Add curated research corpus metadata without introducing a corpus table.

Revision ID: 0026_curated_corpus
Revises: 0025_evidence_provenance
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0026_curated_corpus"
down_revision: Union[str, None] = "0025_evidence_provenance"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("source_candidates", sa.Column("identity_verification", postgresql.JSONB(), nullable=True))
    op.add_column("source_candidates", sa.Column("content_capabilities", postgresql.JSONB(), nullable=True))
    op.add_column("source_candidates", sa.Column("capability_evidence", postgresql.JSONB(), nullable=True))

    op.add_column("sources", sa.Column("content_capabilities", postgresql.JSONB(), nullable=True))
    op.add_column("sources", sa.Column("capability_evidence", postgresql.JSONB(), nullable=True))
    op.add_column("sources", sa.Column("content_inspected_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("sources", sa.Column("content_inspector_version", sa.String(), nullable=True))

    op.add_column("syvai_runs", sa.Column("corpus_manifest", postgresql.JSONB(), nullable=True))
    op.add_column("syvai_runs", sa.Column("routing_reason", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("syvai_runs", "routing_reason")
    op.drop_column("syvai_runs", "corpus_manifest")
    op.drop_column("sources", "content_inspector_version")
    op.drop_column("sources", "content_inspected_at")
    op.drop_column("sources", "capability_evidence")
    op.drop_column("sources", "content_capabilities")
    op.drop_column("source_candidates", "capability_evidence")
    op.drop_column("source_candidates", "content_capabilities")
    op.drop_column("source_candidates", "identity_verification")
