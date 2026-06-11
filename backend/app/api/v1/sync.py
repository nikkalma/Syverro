from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_current_user, get_db
from app.models.user import User

router = APIRouter(prefix="/sync", tags=["sync"])


@router.get("/")
async def get_sync_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить данные для синхронизации (GET)"""
    return {
        "books": [],
        "sessions": [],
        "quotes": [],
        "server_time": "2026-01-15T10:00:00Z"
    }


@router.post("/")
async def sync_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Отправить данные для синхронизации (POST)"""
    return {
        "books": [],
        "sessions": [],
        "quotes": [],
        "server_time": "2026-01-15T10:00:00Z"
    }