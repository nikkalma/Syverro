"""Link books to author_publications (canonical bibliography).

AuthorPublication becomes the canonical bibliography for an author.
books.publication_id creates the hierarchy Author → AuthorPublication → Book.
Historical book metadata (original_title, original_language, country_of_origin,
original_publication_year) moves to AuthorPublication; Book keeps catalog/user data.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0014_book_publication_link"
down_revision: Union[str, None] = "0013_author_taxonomy_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("books", sa.Column("publication_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index("ix_books_publication_id", "books", ["publication_id"])
    op.create_foreign_key(
        "fk_books_publication_id",
        "books", "author_publications",
        ["publication_id"], ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_books_publication_id", "books", type_="foreignkey")
    op.drop_index("ix_books_publication_id", table_name="books")
    op.drop_column("books", "publication_id")
