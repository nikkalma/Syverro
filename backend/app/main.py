"""Syverro ASGI application composition."""

from contextlib import asynccontextmanager
import logging
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    admin,
    admin_author_knowledge,
    admin_authors_ext,
    admin_books,
    admin_places,
    admin_sources,
    admin_syvai,
    admin_syvai_discovery,
    admin_taxonomy,
    admin_timeline,
    auth,
    authors,
    books,
    graph,
    graph_queries,
    sync,
    taxonomy,
    user_book_experience,
)
from app.bootstrap import bootstrap_application

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PUBLIC_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "https://syverro.com",
    "https://www.syverro.com",
    "https://studio.syverro.com",
    "https://api.syverro.com",
    "http://77.233.220.197:3002",
]

ROUTERS = [
    auth.router,
    books.router,
    sync.router,
    admin.router,
    taxonomy.router,
    admin_taxonomy.router,
    admin_books.router,
    authors.router,
    admin_authors_ext.router,
    admin_timeline.router,
    admin_sources.router,
    admin_places.router,
    admin_author_knowledge.router,
    admin_syvai.router,
    admin_syvai_discovery.router,
    graph.router,
    graph_queries.router,
    user_book_experience.router,
]


@asynccontextmanager
async def lifespan(_: FastAPI):
    await bootstrap_application()
    yield


def create_app() -> FastAPI:
    application = FastAPI(title="Syverro API", version="1.0.0", lifespan=lifespan)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=PUBLIC_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.middleware("http")
    async def attach_request_id(request: Request, call_next):
        request_id = str(uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        logger.info(
            "request_completed request_id=%s method=%s path=%s status=%s",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
        )
        return response
    for router in ROUTERS:
        application.include_router(router)

    @application.get("/health")
    async def health():
        return {"status": "ok"}

    return application


app = create_app()
