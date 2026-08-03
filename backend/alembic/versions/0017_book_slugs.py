"""Add stable canonical slugs to books."""

import re
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from unidecode import unidecode


revision: str = "0017_book_slugs"
down_revision: Union[str, None] = "0016_knowledge_node_lifecycle"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

UUID_SHAPED_SLUG = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
)


def _slugify(value: str) -> str:
    value = unidecode(value or "").lower()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-") or "book"
    return f"book-{value}" if UUID_SHAPED_SLUG.fullmatch(value) else value


def upgrade() -> None:
    op.add_column("books", sa.Column("slug", sa.String(), nullable=True))

    connection = op.get_bind()
    rows = connection.execute(sa.text(
        """
        SELECT id, title, original_title, original_publication_year
        FROM books
        ORDER BY created_at NULLS LAST, id
        """
    )).mappings()
    used: set[str] = set()
    for row in rows:
        base = _slugify(row["original_title"] or row["title"])
        candidates = [base]
        if row["original_publication_year"]:
            candidates.append(f"{base}-{row['original_publication_year']}")
        candidates.extend((f"{base}-{str(row['id'])[:8]}", f"{base}-{row['id']}"))
        slug = next(candidate for candidate in candidates if candidate not in used)
        used.add(slug)
        connection.execute(
            sa.text("UPDATE books SET slug = :slug WHERE id = :id"),
            {"slug": slug, "id": row["id"]},
        )

    invalid_count = connection.execute(sa.text(
        "SELECT count(*) FROM books WHERE slug IS NULL OR btrim(slug) = ''"
    )).scalar_one()
    if invalid_count:
        raise RuntimeError(f"Book slug backfill left {invalid_count} invalid rows")

    op.create_index("ix_books_slug", "books", ["slug"], unique=True)
    op.alter_column("books", "slug", existing_type=sa.String(), nullable=False)


def downgrade() -> None:
    op.drop_index("ix_books_slug", table_name="books")
    op.drop_column("books", "slug")
