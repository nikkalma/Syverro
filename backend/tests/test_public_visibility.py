from sqlalchemy.dialects import postgresql

from app.core.public_visibility import (
    public_author_clause,
    public_book_clause,
    public_knowledge_node_clause,
)


def _sql(clause) -> str:
    return str(
        clause.compile(
            dialect=postgresql.dialect(),
            compile_kwargs={"literal_binds": True},
        )
    )


def test_public_author_requires_explicit_golden_review_state():
    assert "authors.metadata_status = 'golden'" in _sql(public_author_clause())


def test_public_book_requires_both_publication_and_moderation_approval():
    sql = _sql(public_book_clause())
    assert "books.is_published IS true" in sql
    assert "books.moderation_status = 'approved'" in sql


def test_public_knowledge_node_requires_publication_and_explorer_visibility():
    sql = _sql(public_knowledge_node_clause())
    assert "knowledge_nodes.status = 'published'" in sql
    assert "knowledge_nodes.explorer_visible IS true" in sql
