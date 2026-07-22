"""Scoring infrastructure for future graph-based ranking and recommendations.

No algorithms are implemented yet. This module defines the interfaces
that the similarity and recommendation engines will use once built.

Current state: all scores return 0.0 as placeholder.
"""


def same_author_score(book_a_id: str, book_b_id: str, shared_author_count: int) -> float:
    """Weight contributed by shared authors between two books.

    Future: factor in author prominence, role (primary vs secondary), etc.
    """
    return 0.0


def same_genre_score(book_a_id: str, book_b_id: str, shared_genre_count: int, total_genre_count: int) -> float:
    """Weight contributed by overlapping genres.

    Future: factor in genre hierarchy depth, genre specificity, etc.
    """
    return 0.0


def same_theme_score(book_a_id: str, book_b_id: str, shared_theme_count: int) -> float:
    """Weight contributed by shared thematic knowledge nodes.

    Future: factor in relation_type (explores vs mentions), confidence, source.
    """
    return 0.0


def same_atmosphere_score(book_a_id: str, book_b_id: str, shared_atmosphere_count: int) -> float:
    """Weight contributed by shared atmosphere/mood nodes.

    Future: factor in user-experience intensity, user count, etc.
    """
    return 0.0


def same_concept_score(book_a_id: str, book_b_id: str, shared_concept_count: int) -> float:
    """Weight contributed by shared abstract concepts.

    Future: factor in KnowledgeRelation depth (direct vs 2-hop).
    """
    return 0.0


def graph_similarity_score(book_a_id: str, book_b_id: str) -> float:
    """Aggregate similarity score between two books based on their graph positions.

    Future: weighted combination of all above scores.
    """
    return 0.0


def relevance_score(book_id: str, user_id: str) -> float:
    """Personalized relevance score for a user.

    Future: combine user reading history, UserBookExperience, subjective tags.
    """
    return 0.0
