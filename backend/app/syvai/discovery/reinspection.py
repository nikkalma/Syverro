"""Explicit, audited lifecycle for refreshing Source content inspection."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Awaitable, Callable
from urllib.parse import quote, urlencode, urlparse

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.source import Source
from app.services.security_audit import add_security_event
from app.syvai.discovery.evidence import extract_evidence
from app.syvai.discovery.fetcher import FetcherConfig, SafeFetcher
from app.syvai.discovery.verification import (
    CONTENT_INSPECTOR_VERSION,
    inspect_content_capabilities,
    inspected_at,
)
from app.syvai.errors import DiscoveryError


@dataclass(frozen=True)
class RetrievedSourceContent:
    evidence: str
    metadata_fields: dict[str, Any]


@dataclass(frozen=True)
class ReinspectionResult:
    source_id: str
    previous_inspector_version: str | None
    current_inspector_version: str
    capabilities_before: list[str]
    capabilities_after: list[str]
    capability_evidence: dict[str, list[dict]]
    changed: bool
    status: str


Retriever = Callable[[Source], Awaitable[RetrievedSourceContent]]


def reinspection_required(source: Source) -> bool:
    return source.content_inspector_version != CONTENT_INSPECTOR_VERSION


def _fetcher(hosts: set[str]) -> SafeFetcher:
    return SafeFetcher(FetcherConfig(
        timeout_seconds=settings.SYVAI_DISCOVERY_TIMEOUT_SECONDS,
        max_bytes=settings.SYVAI_DISCOVERY_MAX_PAGE_BYTES,
        user_agent=settings.SYVAI_DISCOVERY_USER_AGENT,
        allowed_hosts=frozenset(hosts),
    ))


async def retrieve_source_content(source: Source) -> RetrievedSourceContent:
    """Retrieve known authority documents through bounded, host-specific APIs."""
    parsed = urlparse(source.url or "")
    host = (parsed.hostname or "").casefold()

    if host == "en.wikipedia.org" and parsed.path.startswith("/wiki/"):
        title = parsed.path.removeprefix("/wiki/").replace("_", " ")
        params = urlencode({
            "action": "query", "format": "json", "formatversion": 2,
            "prop": "extracts", "exintro": 1, "explaintext": 1, "titles": title,
        })
        page = await _fetcher({host}).fetch(f"https://en.wikipedia.org/w/api.php?{params}")
        data = json.loads(page.text)
        pages = data.get("query", {}).get("pages", []) or []
        evidence = extract_evidence(pages[0].get("extract") or "") if len(pages) == 1 and not pages[0].get("missing") else ""
        metadata = {"title": pages[0].get("title") or title} if pages else {"title": title}
    elif host == "archive.org" and parsed.path.startswith("/details/"):
        identifier = parsed.path.removeprefix("/details/").split("/", 1)[0]
        page = await _fetcher({host}).fetch(f"https://archive.org/metadata/{quote(identifier)}")
        data = json.loads(page.text)
        metadata = data.get("metadata", {}) or {}
        raw = metadata.get("description") or metadata.get("summary") or ""
        evidence = extract_evidence(" ".join(raw) if isinstance(raw, list) else str(raw))
    elif host in {"www.loc.gov", "loc.gov"} and "/item/" in parsed.path:
        item_path = parsed.path.split("/item/", 1)[1].split("/", 1)[0]
        api_host = "www.loc.gov"
        page = await _fetcher({api_host}).fetch(f"https://{api_host}/item/{quote(item_path)}/?fo=json")
        data = json.loads(page.text)
        item = data.get("item", data) or {}
        metadata = {"title": item.get("title"), "creator": item.get("contributors") or item.get("created_published")}
        raw = item.get("description") or item.get("summary") or ""
        evidence = extract_evidence(" ".join(raw) if isinstance(raw, list) else str(raw))
    else:
        raise DiscoveryError("SOURCE_REINSPECTION_ADAPTER_UNAVAILABLE")

    if not evidence and not any(value for value in metadata.values()):
        raise DiscoveryError("SOURCE_REINSPECTION_CONTENT_UNAVAILABLE")
    return RetrievedSourceContent(evidence=evidence, metadata_fields=metadata)


async def reinspect_source_content(
    db: AsyncSession,
    source_id: str,
    *,
    actor_id,
    retriever: Retriever = retrieve_source_content,
) -> ReinspectionResult:
    result = await db.execute(select(Source).where(Source.id == source_id).with_for_update())
    source = result.scalar_one_or_none()
    if source is None:
        raise DiscoveryError("SOURCE_NOT_FOUND")

    previous_version = source.content_inspector_version
    before = sorted(source.content_capabilities or [])
    if not reinspection_required(source):
        return ReinspectionResult(str(source.id), previous_version, CONTENT_INSPECTOR_VERSION, before, before, source.capability_evidence or {}, False, "current")

    # Retrieval and inspection complete before any persistent Source field changes.
    try:
        retrieved = await retriever(source)
        after, evidence = inspect_content_capabilities(
            evidence=retrieved.evidence,
            metadata_fields=retrieved.metadata_fields,
        )
    except DiscoveryError:
        raise
    except Exception as exc:
        raise DiscoveryError("SOURCE_REINSPECTION_RETRIEVAL_FAILED") from exc
    source.content_capabilities = after
    source.capability_evidence = evidence
    source.content_inspected_at = inspected_at()
    source.content_inspector_version = CONTENT_INSPECTOR_VERSION
    add_security_event(
        db,
        event_type="source_content_reinspection",
        endpoint=f"/admin/sources/{source.id}/reinspect",
        method="POST",
        status_code=200,
        actor_id=actor_id,
        target_id=source.id,
        details={
            "source_id": str(source.id),
            "previous_inspector_version": previous_version,
            "new_inspector_version": CONTENT_INSPECTOR_VERSION,
            "capabilities_added": sorted(set(after) - set(before)),
            "capabilities_removed": sorted(set(before) - set(after)),
        },
    )
    await db.commit()
    return ReinspectionResult(str(source.id), previous_version, CONTENT_INSPECTOR_VERSION, before, after, evidence, True, "reinspected")
