"""Golden Author Model: extended identity, AI proposals, quotes, citizenships, residences.

Revision ID: 0008
Revises: 0007_author_date_precision_fk
Create Date: 2026-07-27
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "0008_golden_author_model"
down_revision: Union[str, None] = "0007_author_date_precision_fk"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Author table new columns ---
    op.add_column("authors", sa.Column("hero_quote", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("about_summary", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("ethnic_origin", sa.String(), nullable=True))
    op.add_column("authors", sa.Column("cultural_identity", sa.String(), nullable=True))

    # --- TimelineEvent ---
    op.add_column("timeline_events", sa.Column("extraction_source", sa.String(), server_default="manual", nullable=False))

    # --- Source ---
    op.add_column("sources", sa.Column("language", sa.String(), nullable=True))
    op.add_column("sources", sa.Column("reliability_score", sa.String(), server_default="3", nullable=False))
    op.add_column("sources", sa.Column("source_origin", sa.String(), server_default="manual", nullable=False))

    # --- AuthorQuote ---
    op.create_table(
        "author_quotes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("author_id", sa.Uuid(), sa.ForeignKey("authors.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("speaker", sa.String(), nullable=True),
        sa.Column("source_id", sa.Uuid(), sa.ForeignKey("sources.id", ondelete="SET NULL"), nullable=True),
        sa.Column("date_value", sa.String(), nullable=True),
        sa.Column("confidence", sa.Float(), server_default="1.0", nullable=False),
        sa.Column("status", sa.String(), server_default="draft", nullable=False),
        sa.Column("sort_order", sa.String(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- AuthorCitizenship ---
    op.create_table(
        "author_citizenships",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("author_id", sa.Uuid(), sa.ForeignKey("authors.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("state_name", sa.String(), nullable=False),
        sa.Column("from_date", sa.String(), nullable=True),
        sa.Column("to_date", sa.String(), nullable=True),
        sa.Column("source_id", sa.Uuid(), sa.ForeignKey("sources.id", ondelete="SET NULL"), nullable=True),
        sa.Column("confidence", sa.Float(), server_default="1.0", nullable=False),
        sa.Column("status", sa.String(), server_default="verified", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- AuthorResidence ---
    op.create_table(
        "author_residences",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("author_id", sa.Uuid(), sa.ForeignKey("authors.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("place_id", sa.Uuid(), sa.ForeignKey("places.id", ondelete="SET NULL"), nullable=True),
        sa.Column("from_date", sa.String(), nullable=True),
        sa.Column("to_date", sa.String(), nullable=True),
        sa.Column("source_id", sa.Uuid(), sa.ForeignKey("sources.id", ondelete="SET NULL"), nullable=True),
        sa.Column("confidence", sa.Float(), server_default="1.0", nullable=False),
        sa.Column("status", sa.String(), server_default="verified", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- AIProposal ---
    op.create_table(
        "ai_proposals",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("entity_type", sa.String(), nullable=False, index=True),
        sa.Column("entity_id", sa.String(), nullable=True, index=True),
        sa.Column("field_name", sa.String(), nullable=False),
        sa.Column("current_value", sa.Text(), nullable=True),
        sa.Column("suggested_value", sa.Text(), nullable=False),
        sa.Column("source_type", sa.String(), server_default="ai", nullable=False),
        sa.Column("confidence", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("status", sa.String(), server_default="proposed", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
        sa.Column("reviewed_by", sa.Uuid(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("ai_proposals")
    op.drop_table("author_residences")
    op.drop_table("author_citizenships")
    op.drop_table("author_quotes")
    op.drop_column("sources", "source_origin")
    op.drop_column("sources", "reliability_score")
    op.drop_column("sources", "language")
    op.drop_column("timeline_events", "extraction_source")
    op.drop_column("authors", "cultural_identity")
    op.drop_column("authors", "ethnic_origin")
    op.drop_column("authors", "about_summary")
    op.drop_column("authors", "hero_quote")
