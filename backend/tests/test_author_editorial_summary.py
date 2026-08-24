from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.dialects import postgresql

from app.models.author import Author
from app.models.source import Source
from app.models.source_candidate import SourceCandidate
from app.services.author_editorial_summary import author_editorial_summaries
from app.api.admin import get_authors
from app.syvai.discovery.verification import CONTENT_INSPECTOR_VERSION


class Result:
    def __init__(self, rows):
        self.rows = rows

    def all(self):
        return self.rows


class FakeDB:
    def __init__(self, results):
        self.results = list(results)
        self.statements = []

    async def execute(self, statement):
        self.statements.append(statement)
        return Result(self.results.pop(0))


def author(**overrides):
    values = {
        "id": uuid4(), "name": "Sparse Author", "metadata_status": "draft",
        "sort_name": None, "nationality": None, "country": None,
        "birth_date": None, "birth_year": None, "languages": [],
        "occupations": [], "bio": None, "photo": None,
        "wikipedia_url": None, "official_website": None,
        "portrait_caption": None, "author_intro_quote": None,
        "genres": [], "themes": [], "motifs": [], "concepts": [],
        "atmospheres": [], "literary_movements": [], "writing_languages": [],
    }
    values.update(overrides)
    return Author(**values)


def candidate(author_id, **overrides):
    values = {
        "id": uuid4(), "author_id": author_id, "url": "https://example.test/source",
        "normalized_url": f"https://example.test/{uuid4()}", "authority_tier": "high",
        "assessment": "needs_review", "status": "pending", "review_action": None,
    }
    values.update(overrides)
    return SourceCandidate(**values)


@pytest.mark.asyncio
async def test_page_projection_reuses_corpus_readiness_and_keeps_authors_isolated():
    sparse = author()
    ready = author(
        name="Ready Author", metadata_status="review_ready", sort_name="Author, Ready",
        nationality="GB", birth_year=1900, languages=["English"],
        occupations=["Writer"], bio="Biography",
    )
    source = Source(
        id=uuid4(), title="Current source", source_type="encyclopedia",
        content_capabilities=["BIOGRAPHY"], capability_evidence={"BIOGRAPHY": [{"span": "Biography"}]},
        content_inspector_version=CONTENT_INSPECTOR_VERSION,
    )
    verified = candidate(ready.id, source_id=source.id, assessment="auto_usable", review_action="approved", status="reviewed")
    pending = candidate(sparse.id)
    rejected = candidate(sparse.id, assessment="rejected", review_action="rejected", status="reviewed")
    latest = SimpleNamespace(
        author_id=ready.id, status="skipped", domain="biography",
        routing_reason="INSUFFICIENT_CORPUS:BIOGRAPHY_UNSUPPORTED", error=None,
        created_at=datetime(2026, 8, 24, tzinfo=timezone.utc), finished_at=None,
    )
    db = FakeDB([
        [(sparse.id, 0, 0), (ready.id, 3, 1)],
        [(verified, source), (pending, None), (rejected, None)],
        [],
        [(str(sparse.id), 1, 0, 0), (str(ready.id), 0, 2, 1)],
        [latest],
    ])

    summaries = await author_editorial_summaries(db, [sparse, ready])

    assert len(db.statements) == 5
    assert summaries[str(sparse.id)]["verified_source_count"] == 0
    assert summaries[str(sparse.id)]["pending_source_candidate_count"] == 1
    assert summaries[str(sparse.id)]["rejected_source_candidate_count"] == 1
    assert summaries[str(sparse.id)]["pending_proposal_count"] == 1
    assert summaries[str(sparse.id)]["metadata_status"] == "draft"
    assert summaries[str(sparse.id)]["publication_ready"] is False
    assert "Biography" in summaries[str(sparse.id)]["missing_required_fields"]

    ready_summary = summaries[str(ready.id)]
    assert ready_summary["verified_source_count"] == 1
    assert ready_summary["corpus_ready"] is True
    assert ready_summary["accepted_unapplied_proposal_count"] == 2
    assert ready_summary["applied_proposal_count"] == 1
    assert ready_summary["publication_ready"] is True
    assert ready_summary["missing_required_fields"] == []
    assert ready_summary["last_syvai_run_reason"] == "INSUFFICIENT_CORPUS:BIOGRAPHY_UNSUPPORTED"

    proposal_sql = str(db.statements[3].compile(dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True}))
    assert "quality_review" in proposal_sql and "policy_review" in proposal_sql
    assert "proposed" in proposal_sql and "under_review" in proposal_sql


@pytest.mark.asyncio
async def test_legacy_or_stale_source_does_not_make_corpus_ready():
    item = author()
    stale = Source(
        id=uuid4(), title="Stale", source_type="website",
        content_capabilities=["BIOGRAPHY"], capability_evidence={"BIOGRAPHY": [{}]},
        content_inspector_version="content_v1",
    )
    legacy = candidate(
        item.id, source_id=stale.id, assessment="auto_usable", review_action="auto_approved",
        identity_verification={}, status="reviewed",
    )
    db = FakeDB([[(item.id, 0, 0)], [(legacy, stale)], [], [], []])

    summary = (await author_editorial_summaries(db, [item]))[str(item.id)]

    assert summary["verified_source_count"] == 0
    assert summary["corpus_ready"] is False
    assert summary["last_syvai_run_at"] is None


@pytest.mark.asyncio
async def test_author_list_rejects_noncanonical_metadata_filter_before_querying():
    class NoQueryDB:
        async def scalar(self, _statement):
            raise AssertionError("invalid filters must fail before querying")

    with pytest.raises(HTTPException) as exc:
        await get_authors(
            metadata_status="seventy_three_percent_complete",
            current_user=SimpleNamespace(role="admin"),
            db=NoQueryDB(),
        )
    assert exc.value.status_code == 400
