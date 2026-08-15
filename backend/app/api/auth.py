import logging
import hashlib
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from sqlalchemy import select, update
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
from app.models.refresh_session import RefreshSession
from app.schemas.user import (
    BrowserSessionResponse,
    BrowserTelegramLoginResponse,
    EmailVerificationRequest,
    EmailVerificationResponse,
    RegistrationResponse,
    RefreshTokenRequest,
    TelegramAuthData,
    TelegramLoginResponse,
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
WEB_SESSION_ORIGINS = {
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "https://syverro.com",
    "https://www.syverro.com",
    "https://studio.syverro.com",
}


def _is_web_session_request(request: Request) -> bool:
    return request.headers.get("origin") in WEB_SESSION_ORIGINS


def _set_auth_cookies(response: Response, tokens: TokenResponse) -> None:
    cookie_options = {
        "httponly": True,
        "secure": settings.AUTH_COOKIE_SECURE,
        "samesite": "strict",
    }
    if settings.AUTH_COOKIE_DOMAIN:
        cookie_options["domain"] = settings.AUTH_COOKIE_DOMAIN
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
        path="/auth",
        **cookie_options,
    )


def _hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def _issue_tokens(
    response: Response, db: AsyncSession, user_id: UUID
) -> TokenResponse:
    refresh_token = create_refresh_token({"sub": str(user_id)})
    payload = decode_token(refresh_token)
    if payload is None or "exp" not in payload:
        raise RuntimeError("Failed to create refresh token")
    tokens = TokenResponse(
        access_token=create_access_token({"sub": str(user_id)}),
        refresh_token=refresh_token,
    )
    db.add(
        RefreshSession(
            user_id=user_id,
            token_hash=_hash_refresh_token(refresh_token),
            expires_at=datetime.utcfromtimestamp(payload["exp"]),
        )
    )
    await db.commit()
    _set_auth_cookies(response, tokens)
    return tokens


async def _consume_refresh_session(db: AsyncSession, token: str) -> UUID | None:
    payload = decode_token(token)
    if payload is None or payload.get("type") != "refresh" or not payload.get("sub"):
        return None
    try:
        token_user_id = UUID(payload["sub"])
    except (TypeError, ValueError):
        return None

    now = datetime.utcnow()
    result = await db.execute(
        update(RefreshSession)
        .where(
            RefreshSession.token_hash == _hash_refresh_token(token),
            RefreshSession.revoked_at.is_(None),
            RefreshSession.expires_at > now,
        )
        .values(revoked_at=now)
        .returning(RefreshSession.user_id)
    )
    stored_user_id = result.scalar_one_or_none()
    if stored_user_id != token_user_id:
        return None
    return token_user_id


@router.post("/register", response_model=RegistrationResponse, status_code=201)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    logger.info("Registration attempt")
    if not verification_delivery.configured:
        logger.error("Registration unavailable: email delivery is not configured")
        raise HTTPException(
            status_code=503,
            detail="Registration is temporarily unavailable",
        )
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
        await db.flush()
        await verification_delivery.send(user.email, token)
        await db.commit()
        await db.refresh(user)
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


@router.post("/login", response_model=TokenResponse | BrowserSessionResponse)
async def login(
    user_data: UserLogin,
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),
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
        tokens = await _issue_tokens(response, db, user.id)
        if _is_web_session_request(request):
            return BrowserSessionResponse()
        return tokens
    except HTTPException:
        raise
    except Exception:
        await db.rollback()
        logger.exception("Login failed unexpectedly")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/refresh", response_model=TokenResponse | BrowserSessionResponse)
async def refresh_token(
    response: Response,
    http_request: Request,
    request: RefreshTokenRequest | None = None,
    refresh_cookie: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    db: AsyncSession = Depends(get_db),
):
    supplied_token = request.refresh_token if request else None
    refresh_value = supplied_token or refresh_cookie or ""
    user_id = await _consume_refresh_session(db, refresh_value)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    # Commit the one-time consume before issuing a replacement. A crash may require
    # re-login, but can never leave the already-used token replayable.
    await db.commit()
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is disabled")
    if user.password_hash and not user.email_verified:
        raise HTTPException(status_code=403, detail="Email verification required")
    tokens = await _issue_tokens(response, db, user.id)
    if _is_web_session_request(http_request):
        return BrowserSessionResponse()
    return tokens


@router.post("/logout", status_code=204)
async def logout(
    response: Response,
    request: RefreshTokenRequest | None = None,
    refresh_cookie: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    db: AsyncSession = Depends(get_db),
):
    supplied_token = request.refresh_token if request else None
    refresh_value = supplied_token or refresh_cookie
    if refresh_value:
        await db.execute(
            update(RefreshSession)
            .where(
                RefreshSession.token_hash == _hash_refresh_token(refresh_value),
                RefreshSession.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.utcnow())
        )
        await db.commit()
    response.delete_cookie(
        ACCESS_COOKIE_NAME, path="/", domain=settings.AUTH_COOKIE_DOMAIN
    )
    response.delete_cookie(
        REFRESH_COOKIE_NAME, path="/auth", domain=settings.AUTH_COOKIE_DOMAIN
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post(
    "/telegram",
    response_model=TelegramLoginResponse | BrowserTelegramLoginResponse,
)
async def telegram_login(
    telegram_data: TelegramAuthData,
    response: Response,
    request: Request,
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
        telegram_id = str(telegram_data.id)
        user = await get_user_by_telegram_id(db, telegram_id)
        if not user:
            user = User(
                email=f"telegram-{telegram_id}@users.invalid",
                telegram_id=telegram_id,
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
        tokens = await _issue_tokens(response, db, user.id)
        if _is_web_session_request(request):
            return BrowserTelegramLoginResponse(
                user=UserResponse.model_validate(user),
            )
        return TelegramLoginResponse(
            **tokens.model_dump(),
            user=UserResponse.model_validate(user),
        )
    except HTTPException:
        raise
    except Exception:
        await db.rollback()
        logger.exception("Telegram authentication failed unexpectedly")
        raise HTTPException(status_code=500, detail="Internal server error")
