"""Canonical publication predicates for anonymous editorial surfaces."""

from sqlalchemy.sql.elements import ColumnElement

from app.models.author import Author
from app.models.book import Book
from app.models.knowledge_node import KnowledgeNode


PUBLIC_AUTHOR_STATUS = "golden"
PUBLIC_CHILD_STATUS = "verified"
PUBLIC_KNOWLEDGE_STATUS = "published"


def public_author_clause() -> ColumnElement[bool]:
    return Author.metadata_status == PUBLIC_AUTHOR_STATUS


def public_book_clause() -> ColumnElement[bool]:
    return (Book.is_published.is_(True)) & (Book.moderation_status == "approved")


def public_knowledge_node_clause() -> ColumnElement[bool]:
    return (
        (KnowledgeNode.status == PUBLIC_KNOWLEDGE_STATUS)
        & KnowledgeNode.explorer_visible.is_(True)
    )
