from .auth import router as auth_router
from .sync import router as sync_router
from .books import router as books_router
from .admin import router as admin_router
from .taxonomy import router as taxonomy_router
from .admin_taxonomy import router as admin_taxonomy_router
from .admin_books import router as admin_books_router
from .authors import router as authors_router
from .graph import router as graph_router
from .graph_queries import router as graph_queries_router
from .user_book_experience import router as user_book_experience_router
from .admin_timeline import router as admin_timeline_router
from .admin_sources import router as admin_sources_router
from .admin_places import router as admin_places_router
from .admin_author_knowledge import router as admin_author_knowledge_router

routers = [
    auth_router,
    sync_router,
    books_router,
    admin_router,
    taxonomy_router,
    admin_taxonomy_router,
    admin_books_router,
    authors_router,
    graph_router,
    graph_queries_router,
    user_book_experience_router,
    admin_timeline_router,
    admin_sources_router,
    admin_places_router,
    admin_author_knowledge_router,
]
