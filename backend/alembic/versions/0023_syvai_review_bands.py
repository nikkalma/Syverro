"""SyvAI 0.1B: persist review band and reason on proposals.

Adds the deterministic review classification (quality_review vs policy_review
vs auto_approved vs auto_rejected) so the review queue can be filtered by why
a claim needs attention and the benchmark can measure human intervention from
persisted state.

Revision ID: 0023_syvai_review_bands
Revises: 0022_syvai_timeline_foundation
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0023_syvai_review_bands"
down_revision: Union[str, None] = "0022_syvai_timeline_foundation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("ai_proposals", sa.Column("review_band", sa.String(), nullable=True))
    op.add_column("ai_proposals", sa.Column("review_reason", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("ai_proposals", "review_reason")
    op.drop_column("ai_proposals", "review_band")
