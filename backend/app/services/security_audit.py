from typing import Any
from uuid import UUID

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.security_audit_log import SecurityAuditLog


def add_security_event(
    db: AsyncSession,
    *,
    event_type: str,
    endpoint: str,
    method: str,
    status_code: int,
    actor_id: UUID | None = None,
    target_id: str | UUID | None = None,
    request: Request | None = None,
    details: dict[str, Any] | None = None,
) -> SecurityAuditLog:
    """Stage a security event in the caller's transaction.

    Callers must only pass identifiers and allow-listed state changes. Credentials,
    cookies, tokens, request bodies, email addresses and Telegram payloads are forbidden.
    """
    event = SecurityAuditLog(
        event_type=event_type,
        actor_id=actor_id,
        target_id=str(target_id) if target_id is not None else None,
        endpoint=endpoint,
        method=method,
        status_code=status_code,
        request_id=getattr(request.state, "request_id", None) if request else None,
        details=details,
    )
    db.add(event)
    return event
