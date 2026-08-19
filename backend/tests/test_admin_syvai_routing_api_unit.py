"""Read-only Beta routing admin endpoint test (offline)."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from app.api.admin_syvai_discovery import get_author_routing


class _EmptyResult:
    def scalars(self):
        return self

    def all(self):
        return []


class _EmptySession:
    async def execute(self, query):
        return _EmptyResult()


def _author():
    return SimpleNamespace(id=uuid4())


@pytest.mark.asyncio
async def test_routing_endpoint_returns_report():
    author = _author()
    metrics_payload = {
        "author_id": str(author.id),
        "geographic_context": ["GB", "GLOBAL"],
        "research_domains": ["BIOGRAPHY", "BIBLIOGRAPHY"],
        "pools": {
            "BIOGRAPHY": {"state": "SOURCE_POOL_READY", "sources": ["wikipedia_global"]},
            "BIBLIOGRAPHY": {"state": "SOURCE_POOL_READY", "sources": ["loc_global", "archive_global"]},
        },
        "proposals": {
            "received": 4,
            "auto_approved": 4,
            "human_review": 0,
            "grounded": 4,
            "independently_corroborated": 0,
        },
    }
    discovery_payload = {
        "candidates_total": 6,
        "candidates_pending": 3,
        "providers_attempted": 3,
        "providers_succeeded": 3,
        "providers_failed": 0,
        "human_actions_per_author": 1,
        "distinct_family_count": 2,
    }

    with patch(
        "app.api.admin_syvai_discovery.beta_routing_metrics",
        new=AsyncMock(return_value=metrics_payload),
    ), patch(
        "app.api.admin_syvai_discovery.discovery_metrics",
        new=AsyncMock(return_value=discovery_payload),
    ), patch(
        "app.api.admin_syvai_discovery.get_author_or_404",
        new=AsyncMock(return_value=author),
    ):
        response = await get_author_routing(
            author_id=str(author.id),
            current_user=SimpleNamespace(id=uuid4(), role="admin"),
            db=_EmptySession(),
        )

    assert response["geographic_context"] == ["GB", "GLOBAL"]
    assert response["pools"]["BIOGRAPHY"]["state"] == "SOURCE_POOL_READY"
    assert response["proposals"]["auto_approved"] == 4
    assert response["source_discovery"]["providers_failed"] == 0