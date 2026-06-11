from datetime import datetime, timedelta
# from jose import JWTError, jwt  # Временно отключено
# import bcrypt  # Временно отключено
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User

SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Временная заглушка"""
    # return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    return plain_password == hashed_password  # ⚠️ Только для теста! Не используй в проде


def get_password_hash(password: str) -> str:
    """Временная заглушка"""
    # salt = bcrypt.gensalt()
    # return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    return password  # ⚠️ Только для теста! Не используй в проде


# Алиас для совместимости
hash_password = get_password_hash


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Временная заглушка"""
    # to_encode = data.copy()
    # if expires_delta:
    #     expire = datetime.utcnow() + expires_delta
    # else:
    #     expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # to_encode.update({"exp": expire})
    # encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    # return encoded_jwt
    return "fake-token-for-testing"


def decode_token(token: str) -> dict | None:
    """Временная заглушка"""
    # try:
    #     payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    #     return payload
    # except JWTError:
    #     return None
    return {"sub": "fake-user-id"}


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()