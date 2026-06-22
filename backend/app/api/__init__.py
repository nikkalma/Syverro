from .auth import router as auth_router
from .sync import router as sync_router
from .books import router as books_router

routers = [
    auth_router,
    sync_router,
    books_router,
]