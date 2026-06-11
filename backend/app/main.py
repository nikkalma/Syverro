from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import routers
from app.database import engine, Base

app = FastAPI(title="Syverro API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
       "https://test.syverro.com",          # <-- Твой тестовый фронтенд
        "https://syverro-production.up.railway.app", # <-- Твой собственный бэкенд (важно!)
        "https://syverro.com", 
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Подключаем роутеры
for router in routers:
    app.include_router(router, prefix="/api/v1")