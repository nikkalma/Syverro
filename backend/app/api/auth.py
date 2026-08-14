import logging
from datetime import datetime

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.deps import ACCESS_COOKIE_NAME, get_current_user, get_db
from app.core.security import (
    REFRESH_TOKEN_EXPIRE_DAYS,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    get_user_by_email,
    get_user_by_telegram_id,
    verify_password,
    verify_telegram_auth,
)
from app.models.user import User
from app.schemas.user import (
    EmailVerificationRequest,
    EmailVerificationResponse,
    RegistrationResponse,
    RefreshTokenRequest,
    TelegramAuthData,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.email_verification import (
    generate_verification_token,
    hash_verification_token,
    verification_delivery,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])
REFRESH_COOKIE_NAME = "syverro_refresh"


def _set_auth_cookies(response: Response, tokens: TokenResponse) -> None:
    cookie_options = {
        "httponly": True,
        "secure": settings.AUTH_COOKIE_SECURE,
        "samesite": "strict",
    }
    response.set_cookie(
        ACCESS_COOKIE_NAME,
        tokens.access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        **cookie_options,
    )
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        tokens.refresh_token,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/auth/refresh",
        **cookie_options,
    )


def _issue_tokens(response: Response, user_id) -> TokenResponse:
    tokens = TokenResponse(
        access_token=create_access_token({"sub": str(user_id)}),
        refresh_token=create_refresh_token({"sub": str(user_id)}),
    )
    _set_auth_cookies(response, tokens)
    return tokens


@router.post("/register", response_model=RegistrationResponse, status_code=201)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    logger.info("Registration attempt")
    try:
        result = await db.execute(select(User).where(User.email == user_data.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")

        token, token_hash, expires_at = generate_verification_token()
        user = User(
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            email_verified=False,
            email_verification_token_hash=token_hash,
            email_verification_expires_at=expires_at,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        await verification_delivery.send(user.email, token)
        logger.info("Unverified user created: %s", user.id)
        return RegistrationResponse(
            detail="Registration successful. Verify your email before signing in.",
            verification_token=token
            if settings.ENVIRONMENT in {"development", "test"}
            else None,
        )
    except HTTPException:
        raise
    except Exception:
        await db.rollback()
        logger.exception("Registration failed")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/verify-email", response_model=EmailVerificationResponse)
async def verify_email(
    request: EmailVerificationRequest, db: AsyncSession = Depends(get_db)
):
    if not request.token or len(request.token) > 512:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    try:
        result = await db.execute(
            select(User).where(
                User.email_verification_token_hash
                == hash_verification_token(request.token)
            )
        )
        user = result.scalar_one_or_none()
        if (
            user is None
            or user.email_verification_expires_at is None
            or user.email_verification_expires_at < datetime.utcnow()
        ):
            raise HTTPException(status_code=400, detail="Invalid or expired verification token")
        user.email_verified = True
        user.email_verification_token_hash = None
        user.email_verification_expires_at = None
        await db.commit()
        logger.info("Email verified for user %s", user.id)
        return EmailVerificationResponse(detail="Email verified")
    except HTTPException:
        raise
    except Exception:
        await db.rollback()
        logger.exception("Email verification failed")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/login", response_model=TokenResponse)
async def login(
    user_data: UserLogin, response: Response, db: AsyncSession = Depends(get_db)
):
    logger.info("Login attempt")
    try:
        user = await get_user_by_email(db, user_data.email)
        if not user or not user.password_hash or not verify_password(
            user_data.password, user.password_hash
        ):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        if not user.email_verified:
            raise HTTPException(status_code=403, detail="Email verification required")
        return _issue_tokens(response, user.id)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Login failed unexpectedly")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    response: Response,
    request: RefreshTokenRequest | None = None,
    refresh_cookie: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    db: AsyncSession = Depends(get_db),
):
    supplied_token = request.refresh_token if request else None
    payload = decode_token(supplied_token or refresh_cookie or "")
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is disabled")
    if user.password_hash and not user.email_verified:
        raise HTTPException(status_code=403, detail="Email verification required")
    return _issue_tokens(response, user.id)


@router.post("/logout", status_code=204)
async def logout(response: Response):
    response.delete_cookie(ACCESS_COOKIE_NAME, path="/")
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/auth/refresh")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/telegram", response_model=TokenResponse)
async def telegram_login(
    telegram_data: TelegramAuthData,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    logger.info("Telegram login attempt")
    try:
        if not settings.TELEGRAM_BOT_TOKEN:
            raise HTTPException(status_code=503, detail="Telegram authentication unavailable")
        if not verify_telegram_auth(telegram_data.model_dump()):
            raise HTTPException(
                status_code=401, detail="Invalid or stale Telegram authentication"
            )
        user = await get_user_by_telegram_id(db, telegram_data.id)
        if not user:
            user = User(
                email=f"telegram-{telegram_data.id}@users.invalid",
                telegram_id=telegram_data.id,
                first_name=telegram_data.first_name,
                last_name=telegram_data.last_name,
                username=telegram_data.username,
                photo_url=telegram_data.photo_url,
                email_verified=False,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            logger.info("New Telegram user created: %s", user.id)
        return _issue_tokens(response, user.id)
    except HTTPException:
        raise
    except Exception:
        await db.rollback()
        logger.exception("Telegram authentication failed unexpectedly")
        raise HTTPException(status_code=500, detail="Internal server error")
