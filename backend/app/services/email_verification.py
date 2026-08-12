"""Email-verification token lifecycle and delivery boundary."""

from dataclasses import dataclass
from datetime import datetime, timedelta
import hashlib
import secrets
from typing import Protocol

from app.config import settings


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
    async def send(self, email: str, token: str) -> None: ...


@dataclass
class UnconfiguredVerificationDelivery:
    """Safe placeholder until an email provider is configured."""

    async def send(self, email: str, token: str) -> None:
        return None


verification_delivery: VerificationDelivery = UnconfiguredVerificationDelivery()
