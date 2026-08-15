"""Add persistent security audit log.

Revision ID: 0020_security_audit_logs
Revises: 0019_refresh_sessions
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0020_security_audit_logs"
down_revision: Union[str, None] = "0019_refresh_sessions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "security_audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("target_id", sa.String(length=128), nullable=True),
        sa.Column("endpoint", sa.String(length=255), nullable=False),
        sa.Column("method", sa.String(length=16), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False),
        sa.Column("request_id", sa.String(length=36), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    for column in ("event_type", "actor_id", "request_id", "created_at"):
        op.create_index(f"ix_security_audit_logs_{column}", "security_audit_logs", [column])


def downgrade() -> None:
    for column in ("created_at", "request_id", "actor_id", "event_type"):
        op.drop_index(f"ix_security_audit_logs_{column}", table_name="security_audit_logs")
    op.drop_table("security_audit_logs")
