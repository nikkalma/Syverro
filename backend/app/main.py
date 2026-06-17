from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import logging
from logging.handlers import RotatingFileHandler
import os

# ========== НАСТРОЙКА ЛОГИРОВАНИЯ ==========
os.makedirs("logs", exist_ok=True)

log_handler = RotatingFileHandler(
    "logs/backend.log",
    maxBytes=10_000_000,
    backupCount=5
)
log_handler.setFormatter(
    logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
)

logger = logging.getLogger("syverro")
logger.addHandler(log_handler)
logger.setLevel(logging.INFO)

console_handler = logging.StreamHandler()
console_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(console_handler)

logger.info("🚀 Бэкенд Syverro запускается")
# ==========================================

app = FastAPI(title="Syverro API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://test.syverro.com",
        "https://syverro-production.up.railway.app",
        "https://syverro.com",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== HEALTH CHECK ==========
@app.get("/health")
async def health_check():
    logger.info("Health check вызван")
    return {"status": "ok", "service": "syverro-backend"}

@app.get("/health/detailed")
async def detailed_health_check():
    logger.info("Detailed health check вызван")
    return {
        "status": "ok",
        "service": "syverro-backend",
        "version": "0.1.0",
        "logging": "active"
    }
# ==================================

@app.on_event("startup")
async def init_db():
    logger.info("Инициализация базы данных...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ База данных готова")

# ========== ПОДКЛЮЧАЕМ РОУТЕРЫ (БЕЗ /api/v1) ==========
from app.api.auth import router as auth_router
from app.api.sync import router as sync_router
from app.api.books import router as books_router

app.include_router(auth_router)
app.include_router(sync_router)
app.include_router(books_router)

logger.info("✅ Роутеры подключены: auth, sync, books")