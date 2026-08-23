"""Explicit, audited lifecycle for refreshing Source content inspection."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any, Awaitable, Callable
from urllib.parse import quote, unquote_to_bytes, urlencode, urlparse

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
    provenance: dict[str, Any]


class ReinspectionFailure(DiscoveryError):
    def __init__(self, code: str):
        self.code = code
        super().__init__(code)


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
    return (
        source.content_inspector_version != CONTENT_INSPECTOR_VERSION
        or not source.capability_evidence
    )


def wikipedia_title_from_url(url: str) -> str:
    """Deterministically recover the UTF-8 MediaWiki title from an article URL."""
    parsed = urlparse(url)
    if (parsed.hostname or "").casefold() != "en.wikipedia.org" or not parsed.path.startswith("/wiki/"):
        raise ReinspectionFailure("INVALID_SOURCE_URL")
    slug = parsed.path.removeprefix("/wiki/")
    if not slug or re.search(r"%(?![0-9A-Fa-f]{2})", slug):
        raise ReinspectionFailure("INVALID_SOURCE_URL")
    try:
        title = unquote_to_bytes(slug).decode("utf-8", errors="strict")
    except UnicodeDecodeError as exc:
        raise ReinspectionFailure("INVALID_SOURCE_URL") from exc
    if not title.strip() or "\x00" in title:
        raise ReinspectionFailure("INVALID_SOURCE_URL")
    return title


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
        title = wikipedia_title_from_url(source.url or "")
        params = urlencode({
            "action": "query", "format": "json", "formatversion": 2,
            "prop": "extracts|pageprops", "ppprop": "disambiguation",
            "exintro": 1, "explaintext": 1, "redirects": 1, "titles": title,
        })
        page = await _fetcher({host}).fetch(f"https://en.wikipedia.org/w/api.php?{params}")
        data = json.loads(page.text)
        pages = data.get("query", {}).get("pages", []) or []
        if len(pages) != 1 or pages[0].get("missing"):
            raise ReinspectionFailure("ARTICLE_NOT_FOUND")
        article = pages[0]
        if "disambiguation" in (article.get("pageprops") or {}):
            raise ReinspectionFailure("DISAMBIGUATION_PAGE")
        evidence = extract_evidence(article.get("extract") or "")
        if not evidence:
            raise ReinspectionFailure("CONTENT_EMPTY")
        metadata = {"title": article.get("title") or title}
        provenance = {"authority": "wikipedia", "page_id": article.get("pageid"), "resolved_title": article.get("title")}
        if not provenance["page_id"] or not provenance["resolved_title"]:
            raise ReinspectionFailure("CONTENT_RETRIEVAL_FAILED")
    elif host == "archive.org" and parsed.path.startswith("/details/"):
        identifier = parsed.path.removeprefix("/details/").split("/", 1)[0]
        page = await _fetcher({host}).fetch(f"https://archive.org/metadata/{quote(identifier)}")
        data = json.loads(page.text)
        metadata = data.get("metadata", {}) or {}
        raw = metadata.get("description") or metadata.get("summary") or ""
        evidence = extract_evidence(" ".join(raw) if isinstance(raw, list) else str(raw))
        provenance = {"authority": "internet_archive", "identifier": identifier}
    elif host in {"www.loc.gov", "loc.gov"} and "/item/" in parsed.path:
        item_path = parsed.path.split("/item/", 1)[1].split("/", 1)[0]
        api_host = "www.loc.gov"
        page = await _fetcher({api_host}).fetch(f"https://{api_host}/item/{quote(item_path)}/?fo=json")
        data = json.loads(page.text)
        item = data.get("item", data) or {}
        metadata = {"title": item.get("title"), "creator": item.get("contributors") or item.get("created_published")}
        raw = item.get("description") or item.get("summary") or ""
        evidence = extract_evidence(" ".join(raw) if isinstance(raw, list) else str(raw))
        provenance = {"authority": "library_of_congress", "item_id": item_path}
    else:
        raise ReinspectionFailure("INVALID_SOURCE_URL")

    if not evidence:
        raise ReinspectionFailure("CONTENT_EMPTY")
    return RetrievedSourceContent(evidence=evidence, metadata_fields=metadata, provenance=provenance)


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
    except ReinspectionFailure as exc:
        add_security_event(
            db,
            event_type="source_content_reinspection",
            endpoint=f"/admin/sources/{source.id}/reinspect",
            method="POST",
            status_code=422,
            actor_id=actor_id,
            target_id=source.id,
            details={
                "source_id": str(source.id),
                "outcome": "failed",
                "attempted_inspector_version": CONTENT_INSPECTOR_VERSION,
                "failure_reason": exc.code,
            },
        )
        await db.commit()
        raise
    except Exception as exc:
        failure = ReinspectionFailure("CONTENT_RETRIEVAL_FAILED")
        add_security_event(
            db,
            event_type="source_content_reinspection",
            endpoint=f"/admin/sources/{source.id}/reinspect",
            method="POST",
            status_code=422,
            actor_id=actor_id,
            target_id=source.id,
            details={
                "source_id": str(source.id),
                "outcome": "failed",
                "attempted_inspector_version": CONTENT_INSPECTOR_VERSION,
                "failure_reason": failure.code,
            },
        )
        await db.commit()
        raise failure from exc
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
            "outcome": "success",
            "previous_inspector_version": previous_version,
            "new_inspector_version": CONTENT_INSPECTOR_VERSION,
            "capabilities_added": sorted(set(after) - set(before)),
            "capabilities_removed": sorted(set(before) - set(after)),
        },
    )
    await db.commit()
    return ReinspectionResult(str(source.id), previous_version, CONTENT_INSPECTOR_VERSION, before, after, evidence, True, "reinspected")
