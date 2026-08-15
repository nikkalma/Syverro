"""SyvAI 0.1A foundation: runs, proposal evidence, timeline apply linkage.

Revision ID: 0021_syvai_timeline_foundation
Revises: 0020_security_audit_logs
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0021_syvai_timeline_foundation"
down_revision: Union[str, None] = "0020_security_audit_logs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "syvai_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("domain", sa.String(), server_default="timeline", nullable=False),
        sa.Column("status", sa.String(), server_default="running", nullable=False),
        sa.Column("provider", sa.String(), nullable=True),
        sa.Column("model", sa.String(), nullable=True),
        sa.Column("input_tokens", sa.Integer(), nullable=True),
        sa.Column("output_tokens", sa.Integer(), nullable=True),
        sa.Column("total_tokens", sa.Integer(), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("estimated_cost_usd", sa.Float(), nullable=True),
        sa.Column("calls", sa.Integer(), nullable=True),
        sa.Column("source_count", sa.Integer(), nullable=True),
        sa.Column("error", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["author_id"], ["authors.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_syvai_runs_author_id", "syvai_runs", ["author_id"])
    op.create_index("ix_syvai_runs_status", "syvai_runs", ["status"])

    op.add_column("ai_proposals", sa.Column("validation_state", sa.String(), nullable=True))
    op.add_column("ai_proposals", sa.Column("conflict_state", sa.String(), nullable=True))
    op.add_column("ai_proposals", sa.Column("edited_value", sa.Text(), nullable=True))
    op.add_column(
        "ai_proposals",
        sa.Column("run_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("syvai_runs.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_ai_proposals_run_id", "ai_proposals", ["run_id"])
    op.add_column("ai_proposals", sa.Column("applied_at", sa.DateTime(), nullable=True))
    op.add_column(
        "ai_proposals",
        sa.Column("timeline_event_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("timeline_events.id", ondelete="SET NULL"), nullable=True),
    )

    op.create_table(
        "ai_proposal_sources",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("proposal_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("snippet", sa.Text(), nullable=True),
        sa.Column("reliability_tier", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["proposal_id"], ["ai_proposals.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_id"], ["sources.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("proposal_id", "source_id", name="uq_ai_proposal_sources_proposal_source"),
    )
    op.create_index("ix_ai_proposal_sources_proposal_id", "ai_proposal_sources", ["proposal_id"])
    op.create_index("ix_ai_proposal_sources_source_id", "ai_proposal_sources", ["source_id"])


def downgrade() -> None:
    op.drop_index("ix_ai_proposal_sources_source_id", table_name="ai_proposal_sources")
    op.drop_index("ix_ai_proposal_sources_proposal_id", table_name="ai_proposal_sources")
    op.drop_table("ai_proposal_sources")
    op.drop_column("ai_proposals", "timeline_event_id")
    op.drop_column("ai_proposals", "applied_at")
    op.drop_index("ix_ai_proposals_run_id", table_name="ai_proposals")
    op.drop_column("ai_proposals", "run_id")
    op.drop_column("ai_proposals", "edited_value")
    op.drop_column("ai_proposals", "conflict_state")
    op.drop_column("ai_proposals", "validation_state")
    op.drop_index("ix_syvai_runs_status", table_name="syvai_runs")
    op.drop_index("ix_syvai_runs_author_id", table_name="syvai_runs")
    op.drop_table("syvai_runs")
