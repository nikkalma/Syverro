"""Persist proposal-source epistemic verification state.

Revision ID: 0025_proposal_source_verification
Revises: 0024_source_discovery
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0025_proposal_source_verification"
down_revision: Union[str, None] = "0024_source_discovery"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Existing snippets have no trustworthy persisted verifier result. They
    # remain stored for audit/debugging but are conservatively unverified and
    # are never serialized as source-derived evidence.
    op.add_column(
        "ai_proposal_sources",
        sa.Column("verification_state", sa.String(), server_default="ungrounded", nullable=False),
    )
    op.add_column("ai_proposal_sources", sa.Column("verification_reason", sa.Text(), nullable=True))
    op.add_column(
        "ai_proposal_sources",
        sa.Column("provenance_type", sa.String(), server_default="unverified_model", nullable=False),
    )
    op.add_column(
        "ai_proposal_sources",
        sa.Column("synthesis_involved", sa.Boolean(), server_default=sa.false(), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("ai_proposal_sources", "synthesis_involved")
    op.drop_column("ai_proposal_sources", "provenance_type")
    op.drop_column("ai_proposal_sources", "verification_reason")
    op.drop_column("ai_proposal_sources", "verification_state")
