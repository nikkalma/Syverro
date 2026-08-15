import os
import secrets
import logging
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]

load_dotenv(BASE_DIR / ".env")


class Settings:
    def __init__(self):
        self.ENVIRONMENT = os.getenv("ENVIRONMENT", "production").lower()
        self.DATABASE_URL = os.getenv("DATABASE_URL", "")
        configured_secret = os.getenv("SECRET_KEY")
        unsafe_secrets = {
            "your-secret-key-change-this-in-production",
            "change-me-in-production",
            "local-development-only-secret-do-not-deploy",
            "replace-with-long-random-string",
        }
        if self.ENVIRONMENT == "production" and (
            not configured_secret
            or configured_secret in unsafe_secrets
            or len(configured_secret) < 32
        ):
            raise RuntimeError("SECRET_KEY must be configured securely in production")
        if not configured_secret:
            configured_secret = secrets.token_urlsafe(48)
            logging.getLogger(__name__).warning(
                "Using an ephemeral JWT secret in %s; tokens will not survive restart",
                self.ENVIRONMENT,
            )
        self.SECRET_KEY = configured_secret
        self.TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
        self.TELEGRAM_AUTH_MAX_AGE_SECONDS = int(
            os.getenv("TELEGRAM_AUTH_MAX_AGE_SECONDS", "300")
        )
        self.EMAIL_VERIFICATION_EXPIRE_MINUTES = int(
            os.getenv("EMAIL_VERIFICATION_EXPIRE_MINUTES", "60")
        )
        self.RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
        self.EMAIL_FROM = os.getenv("EMAIL_FROM", "")
        self.SITE_URL = os.getenv("SITE_URL", "https://syverro.com").rstrip("/")
        self.ALGORITHM = "HS256"
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
        )
        self.AUTH_COOKIE_SECURE = self.ENVIRONMENT not in {"development", "test"}
        self.AUTH_COOKIE_DOMAIN = os.getenv("AUTH_COOKIE_DOMAIN") or (
            "syverro.com" if self.ENVIRONMENT == "production" else None
        )

        if self.DATABASE_URL:
            if self.DATABASE_URL.startswith("postgres://"):
                self.DATABASE_URL = self.DATABASE_URL.replace(
                    "postgres://",
                    "postgresql+asyncpg://",
                    1
                )

            elif (
                self.DATABASE_URL.startswith("postgresql://")
                and "+asyncpg" not in self.DATABASE_URL
            ):
                self.DATABASE_URL = self.DATABASE_URL.replace(
                    "postgresql://",
                    "postgresql+asyncpg://",
                    1
                )



settings = Settings()
