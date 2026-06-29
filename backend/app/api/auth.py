from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.deps import get_current_user, get_db
from app.core.security import (
    get_password_hash, verify_password, create_access_token,
    get_user_by_email
)
from app.models.user import User
from app.schemas.user import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    TelegramAuthData
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


# ===== REGISTER =====
@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    logger.info(f"🔍 REGISTER ATTEMPT: {user_data.email}")

    try:
        result = await db.execute(select(User).where(User.email == user_data.email))
        existing = result.scalar_one_or_none()
        if existing:
            logger.warning(f"❌ Email already registered: {user_data.email}")
            raise HTTPException(status_code=400, detail="Email already registered")

        user = User(
            email=user_data.email,
            password_hash=get_password_hash(user_data.password)
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        logger.info(f"✅ User created: {user.id} - {user.email}")

        return UserResponse(
            id=user.id,
            email=user.email,
            role=user.role,
            created_at=user.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"🔥 REGISTER ERROR: {type(e).__name__} - {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


# ===== LOGIN =====
@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    logger.info(f"🔍 LOGIN ATTEMPT: {user_data.email}")

    try:
        user = await get_user_by_email(db, user_data.email)
        if not user or not verify_password(user_data.password, user.password_hash):
            logger.warning(f"❌ Login failed: {user_data.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")

        access_token = create_access_token({"sub": str(user.id)})
        logger.info(f"✅ Login success: {user.id} - {user.email}")

        return TokenResponse(access_token=access_token)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"🔥 LOGIN ERROR: {type(e).__name__} - {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


# ===== ME =====
@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    logger.info(f"🔍 ME request for user: {current_user.id}")
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at
    )


# ===== TELEGRAM LOGIN (для будущего) =====
@router.post("/telegram", response_model=TokenResponse)
async def telegram_login(
    telegram_data: TelegramAuthData,
    db: AsyncSession = Depends(get_db)
):
    logger.info(f"🔍 TELEGRAM LOGIN ATTEMPT: {telegram_data.id}")

    try:
        from app.core.security import get_user_by_telegram_id
        
        user = await get_user_by_telegram_id(db, telegram_data.id)

        if not user:
            user = User(
                telegram_id=telegram_data.id,
                first_name=telegram_data.first_name,
                last_name=telegram_data.last_name,
                username=telegram_data.username,
                photo_url=telegram_data.photo_url,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            logger.info(f"✅ New user created via Telegram: {user.id} - {telegram_data.username}")

        access_token = create_access_token({"sub": str(user.id)})
        logger.info(f"✅ Telegram login success: {user.id}")

        return TokenResponse(access_token=access_token)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"🔥 TELEGRAM ERROR: {type(e).__name__} - {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")