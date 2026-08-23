from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.models.security_audit_log import SecurityAuditLog
from app.models.source import Source
from app.syvai.corpus import _source_dict
from app.syvai.discovery.reinspection import (
    RetrievedSourceContent,
    reinspection_required,
    reinspect_source_content,
)
from app.syvai.discovery.verification import CONTENT_INSPECTOR_VERSION
from app.syvai.errors import DiscoveryError


class ScalarResult:
    def __init__(self, value): self.value = value
    def scalar_one_or_none(self): return self.value


class Session:
    def __init__(self, source):
        self.source = source
        self.added = []
        self.commits = 0
    async def execute(self, _query): return ScalarResult(self.source)
    def add(self, value): self.added.append(value)
    async def commit(self): self.commits += 1


def legacy_source():
    return Source(
        id=uuid4(), title="Jane Austen", source_type="encyclopedia",
        url="https://en.wikipedia.org/wiki/Jane_Austen",
        normalized_url="https://en.wikipedia.org/wiki/Jane_Austen",
        content_capabilities=["IDENTITY"],
        capability_evidence={"IDENTITY": [{"kind": "structured_metadata", "path": "title", "value": "Jane Austen"}]},
        content_inspector_version="content_v1",
    )


async def jane_retriever(_source):
    return RetrievedSourceContent(
        evidence="Jane Austen was an English novelist born in 1775. She died in 1817.",
        metadata_fields={"title": "Jane Austen"},
    )


def test_v1_source_is_stale_and_fail_closed_for_fill():
    source = legacy_source()
    assert reinspection_required(source) is True
    serialized = _source_dict(source, state="AUTO_VERIFIED")
    assert serialized["reinspection_required"] is True
    assert serialized["content_capabilities"] == []
    assert serialized["stored_content_capabilities"] == ["IDENTITY"]


@pytest.mark.asyncio
async def test_jane_reinspection_updates_content_only_and_audits():
    source = legacy_source()
    original_id, original_url, original_title = source.id, source.normalized_url, source.title
    session = Session(source)
    result = await reinspect_source_content(session, str(source.id), actor_id=uuid4(), retriever=jane_retriever)

    assert source.id == original_id
    assert source.normalized_url == original_url
    assert source.title == original_title
    assert source.content_inspector_version == CONTENT_INSPECTOR_VERSION
    assert {"BIOGRAPHY", "DATES", "OCCUPATIONS", "TIMELINE"} <= set(source.content_capabilities)
    assert result.changed is True
    assert session.commits == 1
    audit = next(value for value in session.added if isinstance(value, SecurityAuditLog))
    assert audit.event_type == "source_content_reinspection"
    assert audit.details["previous_inspector_version"] == "content_v1"
    assert audit.details["new_inspector_version"] == CONTENT_INSPECTOR_VERSION


@pytest.mark.asyncio
async def test_current_reinspection_is_idempotent_noop():
    source = legacy_source()
    source.content_inspector_version = CONTENT_INSPECTOR_VERSION
    session = Session(source)
    called = False
    async def retriever(_source):
        nonlocal called
        called = True
        return await jane_retriever(_source)
    result = await reinspect_source_content(session, str(source.id), actor_id=uuid4(), retriever=retriever)
    assert result.changed is False
    assert called is False
    assert session.commits == 0
    assert session.added == []


@pytest.mark.asyncio
async def test_retrieval_failure_preserves_previous_state_atomically():
    source = legacy_source()
    before = (list(source.content_capabilities), dict(source.capability_evidence), source.content_inspector_version)
    session = Session(source)
    async def fail(_source): raise RuntimeError("network failed")
    with pytest.raises(DiscoveryError, match="SOURCE_REINSPECTION_RETRIEVAL_FAILED"):
        await reinspect_source_content(session, str(source.id), actor_id=uuid4(), retriever=fail)
    assert (source.content_capabilities, source.capability_evidence, source.content_inspector_version) == before
    assert session.commits == 0
    assert session.added == []


def test_reinspection_does_not_touch_candidate_or_history_objects():
    candidate = SimpleNamespace(
        source_id=uuid4(), review_action="approved",
        identity_verification={"state": "verified"}, status="reviewed",
    )
    proposal = SimpleNamespace(status="rejected")
    manifest = {"version": "corpus_manifest_v1"}
    snapshot = (candidate.source_id, candidate.review_action, dict(candidate.identity_verification), proposal.status, dict(manifest))
    assert snapshot == (candidate.source_id, "approved", {"state": "verified"}, "rejected", {"version": "corpus_manifest_v1"})
