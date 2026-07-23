"""Convert database graph objects into the standard API-safe format.

Each node:

    { "id": str, "type": str, "name": str, "metadata": dict }

Each relation:

    { "source": str, "target": str, "relation_type": str }
"""
from app.models.book import Book
from app.models.author import Author
from app.models.genre import Genre
from app.models.knowledge_node import KnowledgeNode
from app.models.book_knowledge_relation import BookKnowledgeRelation
from app.models.knowledge_relation import KnowledgeRelation


def serialize_book(book: Book) -> dict:
    return {
        "id": str(book.id),
        "type": "book",
        "name": book.title,
        "metadata": {
            "cover": book.cover,
            "description": book.description,
            "original_language": book.original_language,
            "original_publication_year": book.original_publication_year,
            "publication_type": book.publication_type,
            "metadata_status": book.metadata_status,
            "is_published": book.is_published,
        },
    }


def serialize_author(author: Author) -> dict:
    return {
        "id": str(author.id),
        "type": "author",
        "name": author.name,
        "metadata": {
            "country": author.nationality,
            "bio": author.bio,
            "birth_year": author.birth_year,
            "death_year": author.death_year,
        },
    }


def serialize_genre(genre: Genre) -> dict:
    return {
        "id": str(genre.id),
        "type": "genre",
        "name": genre.name,
        "metadata": {
            "slug": genre.slug,
            "type": genre.type,
        },
    }


def serialize_knowledge_node(node: KnowledgeNode) -> dict:
    return {
        "id": str(node.id),
        "type": node.node_type,
        "name": node.name,
        "metadata": {
            "slug": node.slug,
            "node_type": node.node_type,
        },
    }


def relation(source_id: str, target_id: str, relation_type: str) -> dict:
    return {
        "source": source_id,
        "target": target_id,
        "relation_type": relation_type,
    }
