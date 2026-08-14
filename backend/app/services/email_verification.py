"""Email-verification token lifecycle and delivery boundary."""

from dataclasses import dataclass
from datetime import datetime, timedelta
import asyncio
import hashlib
import json
import logging
import secrets
from typing import Protocol
from urllib import request

from app.config import settings

logger = logging.getLogger(__name__)


def hash_verification_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_verification_token() -> tuple[str, str, datetime]:
    token = secrets.token_urlsafe(32)
    return (
        token,
        hash_verification_token(token),
        datetime.utcnow() + timedelta(minutes=settings.EMAIL_VERIFICATION_EXPIRE_MINUTES),
    )


class VerificationDelivery(Protocol):
    @property
    def configured(self) -> bool: ...

    async def send(self, email: str, token: str) -> None: ...


@dataclass
class UnconfiguredVerificationDelivery:
    """Safe placeholder until an email provider is configured."""

    @property
    def configured(self) -> bool:
        return settings.ENVIRONMENT in {"development", "test"}

    async def send(self, email: str, token: str) -> None:
        return None


@dataclass
class ResendVerificationDelivery:
    api_key: str
    sender: str
    site_url: str

    @property
    def configured(self) -> bool:
        return bool(self.api_key and self.sender)

    def _send_sync(self, email: str, token: str) -> None:
        verification_url = f"{self.site_url}/verify-email?token={token}"
        payload = json.dumps(
            {
                "from": self.sender,
                "to": [email],
                "subject": "Подтвердите email в Syverro",
                "text": (
                    "Подтвердите адрес электронной почты, открыв ссылку: "
                    f"{verification_url}\n\n"
                    "Если вы не регистрировались в Syverro, проигнорируйте письмо."
                ),
                "html": (
                    "<h1>Подтвердите email в Syverro</h1>"
                    "<p>Чтобы завершить регистрацию, откройте ссылку:</p>"
                    f'<p><a href="{verification_url}">Подтвердить email</a></p>'
                    "<p>Если вы не регистрировались в Syverro, "
                    "просто проигнорируйте письмо.</p>"
                ),
            }
        ).encode("utf-8")
        email_request = request.Request(
            "https://api.resend.com/emails",
            data=payload,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "Idempotency-Key": f"verify-{hash_verification_token(token)}",
                "User-Agent": "Syverro/1.0",
            },
            method="POST",
        )
        with request.urlopen(email_request, timeout=10) as response:
            if response.status not in {200, 201}:
                raise RuntimeError(f"Email provider returned status {response.status}")

    async def send(self, email: str, token: str) -> None:
        await asyncio.to_thread(self._send_sync, email, token)
        logger.info("Verification email accepted for delivery")


def build_verification_delivery() -> VerificationDelivery:
    if settings.RESEND_API_KEY or settings.EMAIL_FROM:
        return ResendVerificationDelivery(
            api_key=settings.RESEND_API_KEY,
            sender=settings.EMAIL_FROM,
            site_url=settings.SITE_URL,
        )
    return UnconfiguredVerificationDelivery()


verification_delivery = build_verification_delivery()
