from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, books, sync, admin
from app.database import engine, Base
from app.models import user, book, author, genre
from app.models.session import ReadingSession  # ✅ НОВЫЙ
from app.models.quote import Quote            # ✅ НОВЫЙ
from app.models.sync_state import SyncState   # ✅ НОВЫЙ
from app.models.change_log import ChangeLog   # ✅ НОВЫЙ
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Syverro API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "https://syverro.com",
        "https://api.syverro.com",
        "http://77.233.220.197:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Роутеры
app.include_router(auth.router)
app.include_router(books.router)
app.include_router(sync.router)  # ✅ ТЕПЕРЬ РАБОТАЕТ
app.include_router(admin.router)

async def ensure_user_profile_columns(conn):
    """Add columns that create_all won't add to existing tables."""
    from sqlalchemy import text

    statements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url VARCHAR",
        "ALTER TABLE books ADD COLUMN IF NOT EXISTS description TEXT",
        "ALTER TABLE genres ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES genres(id)",
    ]
    for sql in statements:
        await conn.execute(text(sql))


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await ensure_user_profile_columns(conn)
    logger.info("✅ Database tables created")

@app.get("/health")
async def health():
    return {"status": "ok"}