from unittest.mock import AsyncMock

import pytest

from app import main


def test_application_keeps_core_routes():
    paths = set(main.app.openapi()["paths"])

    assert "/health" in paths
    assert "/auth/register" in paths
    assert "/books/" in paths
    assert any(path.startswith("/admin/") for path in paths)


@pytest.mark.asyncio
async def test_lifespan_runs_bootstrap(monkeypatch):
    bootstrap = AsyncMock()
    monkeypatch.setattr(main, "bootstrap_application", bootstrap)

    async with main.lifespan(main.app):
        bootstrap.assert_awaited_once_with()
