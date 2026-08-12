from datetime import datetime, timedelta
import hashlib
import hmac
import time

import bcrypt
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.config import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = 90


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    to_encode["type"] = "access"
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["type"] = "refresh"
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_telegram_id(db: AsyncSession, telegram_id: str) -> User | None:
    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    return result.scalar_one_or_none()


def verify_telegram_auth(data: dict, now: int | None = None) -> bool:
    """Verify Telegram Login Widget data before trusting identity fields."""
    received_hash = data.get("hash")
    auth_date = data.get("auth_date")
    if not settings.TELEGRAM_BOT_TOKEN or not isinstance(received_hash, str):
        return False
    try:
        auth_timestamp = int(auth_date)
    except (TypeError, ValueError):
        return False
    current_time = int(time.time()) if now is None else now
    age = current_time - auth_timestamp
    if age < 0 or age > settings.TELEGRAM_AUTH_MAX_AGE_SECONDS:
        return False
    check_string = "\n".join(
        f"{key}={value}"
        for key, value in sorted(data.items())
        if key != "hash" and value is not None
    )
    secret_key = hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode("utf-8")).digest()
    expected_hash = hmac.new(
        secret_key, check_string.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected_hash, received_hash)
