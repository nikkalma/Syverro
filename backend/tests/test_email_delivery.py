import json
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from app.api import auth
from app.schemas.user import UserCreate
from app.services.email_verification import ResendVerificationDelivery


def test_resend_delivery_builds_verification_link(monkeypatch):
    captured = {}

    class Response:
        status = 200

        def __enter__(self):
            return self

        def __exit__(self, *_):
            return None

    def fake_urlopen(email_request, timeout):
        captured["url"] = email_request.full_url
        captured["headers"] = dict(email_request.header_items())
        captured["payload"] = json.loads(email_request.data)
        captured["timeout"] = timeout
        return Response()

    monkeypatch.setattr("app.services.email_verification.request.urlopen", fake_urlopen)
    delivery = ResendVerificationDelivery(
        api_key="re_test",
        sender="Syverro <noreply@syverro.com>",
        site_url="https://syverro.com",
    )

    delivery._send_sync("reader@example.com", "secret-token")

    assert captured["url"] == "https://api.resend.com/emails"
    assert captured["headers"]["Authorization"] == "Bearer re_test"
    assert captured["headers"]["Idempotency-key"].startswith("verify-")
    assert captured["payload"]["to"] == ["reader@example.com"]
    assert "https://syverro.com/verify-email?token=secret-token" in captured["payload"]["html"]
    assert captured["timeout"] == 10


@pytest.mark.asyncio
async def test_registration_fails_before_database_write_without_email_delivery(monkeypatch):
    monkeypatch.setattr(auth, "verification_delivery", SimpleNamespace(configured=False))
    db = AsyncMock()

    with pytest.raises(HTTPException) as unavailable:
        await auth.register(
            UserCreate(email="reader@example.com", password="strong-password"),
            db,
        )

    assert unavailable.value.status_code == 503
    db.execute.assert_not_awaited()
