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
        # --- SyvAI provider settings ---
        # Real API keys are read from the environment only; nothing is committed.
        self.SYVAI_OPENAI_API_KEY = os.getenv("SYVAI_OPENAI_API_KEY", "")
        self.SYVAI_OPENAI_BASE_URL = os.getenv("SYVAI_OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.SYVAI_OPENAI_MODEL = os.getenv("SYVAI_OPENAI_MODEL", "gpt-4o-mini")
        self.SYVAI_PROVIDER_TIMEOUT_SECONDS = float(os.getenv("SYVAI_PROVIDER_TIMEOUT_SECONDS", "60"))
        self.SYVAI_PROVIDER_TEMPERATURE = float(os.getenv("SYVAI_PROVIDER_TEMPERATURE", "0"))
        self.SYVAI_PROVIDER_MAX_TOKENS = int(os.getenv("SYVAI_PROVIDER_MAX_TOKENS", "4096"))
        # --- SyvAI 0.2A source-discovery settings (env-only, fail-safe) ---
        self.SYVAI_DISCOVERY_ENABLED = os.getenv("SYVAI_DISCOVERY_ENABLED", "").lower() in {
            "1", "true", "yes", "on",
        }
        self.SYVAI_DISCOVERY_PROVIDER = os.getenv("SYVAI_DISCOVERY_PROVIDER", "wikipedia")
        # Bounded multi-authority (0.3A): ordered, credential-free provider set.
        # SYVAI_DISCOVERY_PROVIDERS wins when set; otherwise falls back to the
        # legacy single-provider setting, then the default three.
        self.SYVAI_DISCOVERY_PROVIDERS = (
            os.getenv("SYVAI_DISCOVERY_PROVIDERS")
            or os.getenv("SYVAI_DISCOVERY_PROVIDER")
            or "wikipedia,loc,archive"
        )
        self.SYVAI_DISCOVERY_MAX_CANDIDATES = int(
            os.getenv("SYVAI_DISCOVERY_MAX_CANDIDATES", "5")
        )
        self.SYVAI_DISCOVERY_MAX_PER_FAMILY = int(
            os.getenv("SYVAI_DISCOVERY_MAX_PER_FAMILY", "2")
        )
        # 0.3C: hard per-run cap on provider item/metadata detail requests
        # (enrichment). Detail fetch is strictly optional; search candidates
        # never depend on it.
        self.SYVAI_DISCOVERY_DETAIL_MAX_PER_RUN = int(
            os.getenv("SYVAI_DISCOVERY_DETAIL_MAX_PER_RUN", "6")
        )
        self.SYVAI_DISCOVERY_TIMEOUT_SECONDS = float(
            os.getenv("SYVAI_DISCOVERY_TIMEOUT_SECONDS", "15")
        )
        self.SYVAI_DISCOVERY_MAX_PAGE_BYTES = int(
            os.getenv("SYVAI_DISCOVERY_MAX_PAGE_BYTES", "500000")
        )
        self.SYVAI_DISCOVERY_USER_AGENT = os.getenv(
            "SYVAI_DISCOVERY_USER_AGENT", "SyverroSyvAI/0.2 (+https://syverro.com)"
        )
        # Deterministic ru.wikipedia -> EN identity bootstrap for cross-script
        # authors. Default OFF so unit tests and offline runs never touch the
        # network; production enables it explicitly via env.
        self.SYVAI_DISCOVERY_LANGLINKS_BOOTSTRAP = os.getenv(
            "SYVAI_DISCOVERY_LANGLINKS_BOOTSTRAP", ""
        ).lower() in {
            "1", "true", "yes", "on",
        }

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
