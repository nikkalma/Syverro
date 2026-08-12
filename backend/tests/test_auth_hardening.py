from datetime import datetime, timedelta
import hashlib
import hmac
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import ValidationError

from app.api import auth
from app.config import Settings, settings
from app.core.security import create_refresh_token, verify_telegram_auth
from app.core.deps import get_current_user
from app.schemas.user import EmailVerificationRequest, TelegramAuthData, UserCreate, UserLogin
from app.services.email_verification import generate_verification_token, hash_verification_token


class ScalarResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class FakeSession:
    def __init__(self, results):
        self.results = iter(results)
        self.added = []
        self.execute = AsyncMock(side_effect=lambda *_: ScalarResult(next(self.results)))
        self.commit = AsyncMock()
        self.rollback = AsyncMock()

    def add(self, value):
        self.added.append(value)

    async def refresh(self, value):
        value.id = value.id or uuid4()
        value.created_at = value.created_at or datetime.utcnow()


@pytest.mark.asyncio
async def test_registration_creates_unverified_account_without_tokens(monkeypatch):
    db = FakeSession([None])
    response = await auth.register(
        UserCreate(email="reader@example.com", password="strong-password"), db
    )

    assert db.added[0].email_verified is False
    assert db.added[0].email_verification_token_hash
    assert not hasattr(response, "access_token")
    assert response.verification_token


@pytest.mark.asyncio
async def test_valid_email_verification_is_single_use():
    token, token_hash, expires_at = generate_verification_token()
    user = SimpleNamespace(
        id=uuid4(),
        email_verified=False,
        email_verification_token_hash=token_hash,
        email_verification_expires_at=expires_at,
    )
    db = FakeSession([user, None])

    response = await auth.verify_email(EmailVerificationRequest(token=token), db)
    assert response.detail == "Email verified"
    assert user.email_verified is True
    assert user.email_verification_token_hash is None

    with pytest.raises(HTTPException) as reused:
        await auth.verify_email(EmailVerificationRequest(token=token), db)
    assert reused.value.status_code == 400


@pytest.mark.asyncio
async def test_invalid_and_expired_verification_tokens_fail_safely():
    invalid_db = FakeSession([None])
    with pytest.raises(HTTPException) as invalid:
        await auth.verify_email(EmailVerificationRequest(token="malformed"), invalid_db)
    assert invalid.value.status_code == 400

    expired_user = SimpleNamespace(
        email_verified=False,
        email_verification_token_hash=hash_verification_token("expired"),
        email_verification_expires_at=datetime.utcnow() - timedelta(seconds=1),
    )
    expired_db = FakeSession([expired_user])
    with pytest.raises(HTTPException) as expired:
        await auth.verify_email(EmailVerificationRequest(token="expired"), expired_db)
    assert expired.value.status_code == 400
    assert expired_user.email_verified is False


def _signed_telegram_payload(now: int, **overrides):
    payload = {
        "id": "123456",
        "first_name": "Ada",
        "last_name": None,
        "username": "ada",
        "photo_url": None,
        "auth_date": now,
    }
    payload.update(overrides)
    check_string = "\n".join(
        f"{key}={value}" for key, value in sorted(payload.items()) if value is not None
    )
    secret = hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode()).digest()
    payload["hash"] = hmac.new(secret, check_string.encode(), hashlib.sha256).hexdigest()
    return payload


def test_telegram_login_widget_signature_and_freshness(monkeypatch):
    monkeypatch.setattr(settings, "TELEGRAM_BOT_TOKEN", "test-bot-token")
    monkeypatch.setattr(settings, "TELEGRAM_AUTH_MAX_AGE_SECONDS", 300)
    now = 1_800_000_000
    valid = _signed_telegram_payload(now)
    assert verify_telegram_auth(valid, now=now)

    tampered = dict(valid, id="999")
    assert not verify_telegram_auth(tampered, now=now)
    assert not verify_telegram_auth({k: v for k, v in valid.items() if k != "hash"}, now=now)
    assert not verify_telegram_auth(_signed_telegram_payload(now - 301), now=now)


@pytest.mark.asyncio
async def test_arbitrary_telegram_id_cannot_reach_user_lookup(monkeypatch):
    monkeypatch.setattr(settings, "TELEGRAM_BOT_TOKEN", "test-bot-token")
    lookup = AsyncMock()
    monkeypatch.setattr(auth, "get_user_by_telegram_id", lookup)
    data = TelegramAuthData(
        id="victim-id", first_name="Mallory", auth_date=1, hash="0" * 64
    )
    with pytest.raises(HTTPException) as exc:
        await auth.telegram_login(data, FakeSession([]))
    assert exc.value.status_code == 401
    lookup.assert_not_awaited()


@pytest.mark.asyncio
async def test_valid_signed_telegram_payload_succeeds(monkeypatch):
    monkeypatch.setattr(settings, "TELEGRAM_BOT_TOKEN", "test-bot-token")
    now = 1_800_000_000
    monkeypatch.setattr("app.core.security.time.time", lambda: now)
    existing = SimpleNamespace(id=uuid4())
    monkeypatch.setattr(auth, "get_user_by_telegram_id", AsyncMock(return_value=existing))
    response = await auth.telegram_login(
        TelegramAuthData(**_signed_telegram_payload(now)), FakeSession([])
    )
    assert response.access_token
    assert response.refresh_token


def test_telegram_schema_requires_hash():
    with pytest.raises(ValidationError):
        TelegramAuthData(id="1", first_name="Ada", auth_date=1)


def test_production_secret_configuration_fails_closed(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("SECRET_KEY", raising=False)
    with pytest.raises(RuntimeError):
        Settings()
    monkeypatch.setenv("SECRET_KEY", "change-me-in-production")
    with pytest.raises(RuntimeError):
        Settings()
    monkeypatch.setenv("SECRET_KEY", "too-short")
    with pytest.raises(RuntimeError):
        Settings()


def test_development_without_secret_is_testable(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.delenv("SECRET_KEY", raising=False)
    assert Settings().SECRET_KEY


@pytest.mark.asyncio
async def test_internal_login_exception_is_not_disclosed(monkeypatch):
    async def explode(*_):
        raise RuntimeError("database password=super-secret")

    monkeypatch.setattr(auth, "get_user_by_email", explode)
    with pytest.raises(HTTPException) as exc:
        await auth.login(UserLogin(email="reader@example.com", password="x"), FakeSession([]))
    assert exc.value.status_code == 500
    assert exc.value.detail == "Internal server error"
    assert "super-secret" not in exc.value.detail


def test_refresh_tokens_remain_distinct_from_access_tokens():
    from app.core.security import decode_token

    payload = decode_token(create_refresh_token({"sub": str(uuid4())}))
    assert payload["type"] == "refresh"


@pytest.mark.asyncio
async def test_refresh_token_cannot_authenticate_as_bearer():
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer", credentials=create_refresh_token({"sub": str(uuid4())})
    )
    db = FakeSession([])
    with pytest.raises(HTTPException) as exc:
        await get_current_user(credentials, db)
    assert exc.value.status_code == 401
    db.execute.assert_not_awaited()
