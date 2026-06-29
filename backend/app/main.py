from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, books, sync, admin
from app.database import engine, Base
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
app.include_router(sync.router)
app.include_router(admin.router)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables created")

@app.get("/health")
async def health():
    return {"status": "ok"}