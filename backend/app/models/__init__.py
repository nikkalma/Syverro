from app.models.user import User
from app.models.refresh_session import RefreshSession
from app.models.book import Book
from app.models.user_book import UserBook
from app.models.author import Author
from app.models.genre import Genre
from app.models.session import ReadingSession
from app.models.quote import Quote
from app.models.sync_state import SyncState
from app.models.change_log import ChangeLog
from app.models.book_author import book_authors  # noqa: F401 — ensures table is registered
from app.models.book_genre import book_genres  # noqa: F401 — ensures table is registered
from app.models.knowledge_node import KnowledgeNode
from app.models.knowledge_relation import KnowledgeRelation
from app.models.book_knowledge_relation import BookKnowledgeRelation
from app.models.user_book_experience import UserBookExperience
from app.models.author_award import AuthorAward
from app.models.source import Source
from app.models.place import Place
from app.models.author_knowledge_relation import AuthorKnowledgeRelation
from app.models.timeline_event import TimelineEvent
from app.models.author_quote import AuthorQuote
from app.models.author_citizenship import AuthorCitizenship
from app.models.author_residence import AuthorResidence
from app.models.ai_proposal import AIProposal
from app.models.author_publication import AuthorPublication

__all__ = [
    "User",
    "RefreshSession",
    "Book",
    "UserBook",
    "Author",
    "Genre",
    "ReadingSession",
    "Quote",
    "SyncState",
    "ChangeLog",
    "KnowledgeNode",
    "KnowledgeRelation",
    "BookKnowledgeRelation",
    "UserBookExperience",
    "AuthorAward",
    "Source",
    "Place",
    "AuthorKnowledgeRelation",
    "TimelineEvent",
    "AuthorQuote",
    "AuthorCitizenship",
    "AuthorResidence",
    "AIProposal",
    "AuthorPublication",
]
