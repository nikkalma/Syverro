from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.api import admin_authors_ext


@pytest.mark.asyncio
async def test_single_author_editorial_summary_reuses_projection(monkeypatch):
    author = SimpleNamespace(id=uuid4())
    user = SimpleNamespace(role="moderator")
    db = AsyncMock()
    expected = {"metadata_status": "draft", "corpus_ready": False}

    monkeypatch.setattr(admin_authors_ext, "get_author_or_404", AsyncMock(return_value=author))
    projection = AsyncMock(return_value={str(author.id): expected})
    monkeypatch.setattr(admin_authors_ext, "author_editorial_summaries", projection)

    result = await admin_authors_ext.get_author_editorial_summary(str(author.id), user, db)

    assert result == expected
    projection.assert_awaited_once_with(db, [author])
