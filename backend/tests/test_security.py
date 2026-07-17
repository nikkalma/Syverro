from datetime import timedelta

from app.core.security import (
    create_access_token,
    decode_token,
    get_password_hash,
    verify_password,
)


def test_password_hash_and_verify():
    password = "correct-horse-battery-staple"
    hashed = get_password_hash(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_create_and_decode_access_token():
    token = create_access_token({"sub": "user-123"}, expires_delta=timedelta(minutes=5))
    payload = decode_token(token)

    assert payload is not None
    assert payload["sub"] == "user-123"
    assert "exp" in payload


def test_decode_invalid_token_returns_none():
    assert decode_token("not-a-valid-jwt") is None
