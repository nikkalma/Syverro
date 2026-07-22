from .auth import router as auth_router
from .sync import router as sync_router
from .books import router as books_router
from .admin import router as admin_router
from .taxonomy import router as taxonomy_router
from .admin_taxonomy import router as admin_taxonomy_router

routers = [
    auth_router,
    sync_router,
    books_router,
    admin_router,
    taxonomy_router,
    admin_taxonomy_router,
]
