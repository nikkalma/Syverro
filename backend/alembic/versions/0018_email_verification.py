"""Add persisted email verification state.

Revision ID: 0018_email_verification
Revises: 0017_book_slugs
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0018_email_verification"
down_revision: Union[str, None] = "0017_book_slugs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("users", sa.Column("email_verification_token_hash", sa.String(), nullable=True))
    op.add_column("users", sa.Column("email_verification_expires_at", sa.DateTime(), nullable=True))
    op.execute(sa.text("UPDATE users SET email_verified = true"))
    op.create_unique_constraint(
        "uq_users_email_verification_token_hash",
        "users",
        ["email_verification_token_hash"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_users_email_verification_token_hash", "users", type_="unique")
    op.drop_column("users", "email_verification_expires_at")
    op.drop_column("users", "email_verification_token_hash")
    op.drop_column("users", "email_verified")
