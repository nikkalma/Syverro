"""Add knowledge graph tables.

Creates the Knowledge Graph foundation:

- knowledge_nodes: Universal taxonomy node (genres, themes, motifs, etc.)
- knowledge_relations: Typed, weighted connections between nodes
- book_knowledge_relations: Connects books to knowledge nodes with source attribution
- user_book_experiences: Personal reader experience layer

Revision ID: 0002_knowledge_graph
Revises: 0001_baseline
Create Date: 2026-07-22
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0002_knowledge_graph"
down_revision: Union[str, None] = "0001_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- knowledge_nodes ---
    op.create_table(
        "knowledge_nodes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("node_type", sa.String(), nullable=False),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_nodes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("metadata", postgresql.JSONB(), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("slug", name="uq_knowledge_nodes_slug"),
    )
    op.create_index(op.f("ix_knowledge_nodes_node_type"), "knowledge_nodes", ["node_type"])
    op.create_index(op.f("ix_knowledge_nodes_parent_id"), "knowledge_nodes", ["parent_id"])

    # --- knowledge_relations ---
    op.create_table(
        "knowledge_relations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("source_node_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_nodes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_node_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_nodes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("relation_type", sa.String(), nullable=False),
        sa.Column("weight", sa.Float(), server_default=sa.text("0.5"), nullable=False),
        sa.Column("metadata", postgresql.JSONB(), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("source_node_id", "target_node_id", "relation_type", name="uq_knowledge_relations"),
    )
    op.create_index(op.f("ix_knowledge_relations_source_node_id"), "knowledge_relations", ["source_node_id"])
    op.create_index(op.f("ix_knowledge_relations_target_node_id"), "knowledge_relations", ["target_node_id"])
    op.create_index(op.f("ix_knowledge_relations_relation_type"), "knowledge_relations", ["relation_type"])

    # --- book_knowledge_relations ---
    op.create_table(
        "book_knowledge_relations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("book_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("books.id", ondelete="CASCADE"), nullable=False),
        sa.Column("node_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_nodes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("relation_type", sa.String(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("status", sa.String(), server_default=sa.text("'proposed'"), nullable=False),
        sa.Column("confidence", sa.Float(), server_default=sa.text("0.5"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("book_id", "node_id", "relation_type", "source", name="uq_book_knowledge_relations"),
    )
    op.create_index(op.f("ix_book_knowledge_relations_book_id"), "book_knowledge_relations", ["book_id"])
    op.create_index(op.f("ix_book_knowledge_relations_node_id"), "book_knowledge_relations", ["node_id"])
    op.create_index(op.f("ix_book_knowledge_relations_status"), "book_knowledge_relations", ["status"])

    # --- user_book_experiences ---
    op.create_table(
        "user_book_experiences",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("book_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("books.id", ondelete="CASCADE"), nullable=False),
        sa.Column("atmosphere_node_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_nodes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("mood_node_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_nodes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("intensity", sa.Float(), server_default=sa.text("0.5"), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "book_id", "atmosphere_node_id", name="uq_user_book_experiences"),
    )
    op.create_index(op.f("ix_user_book_experiences_user_id"), "user_book_experiences", ["user_id"])
    op.create_index(op.f("ix_user_book_experiences_book_id"), "user_book_experiences", ["book_id"])


def downgrade() -> None:
    op.drop_table("user_book_experiences")
    op.drop_table("book_knowledge_relations")
    op.drop_table("knowledge_relations")
    op.drop_table("knowledge_nodes")
