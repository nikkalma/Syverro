"""Catalog Bootstrap B2: deterministic canonical Author evidence acquisition.

This path is deliberately separate from general discovery and ``/ai/fill``.
It resolves exact Wikipedia titles, binds them to one Wikidata entity, stores a
bounded canonical article, and creates human-review-only structured proposals.
Semantic entailment of article text belongs to B3.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import StrEnum
from typing import Any, Sequence
from urllib.parse import quote, unquote, urlencode, urlparse

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.ai_proposal import AIProposal
from app.models.ai_proposal_source import AIProposalSource
from app.models.author import Author
from app.models.source import AuthorSourceLink, Source
from app.models.syvai_run import SyvaiRun
from app.syvai.discovery.fetcher import FetcherConfig, SafeFetcher
from app.syvai.discovery.query_terms import search_variants
from app.syvai.discovery.urls import normalize_url
from app.syvai.author_entailment import (
    VERIFIER_VERSION,
    WIKIDATA_PROPERTY_RULES,
    logical_claim_value,
    normalize_wikidata_time,
    verify_wikidata_claim,
)
from app.syvai.field_specs import (
    AUTHOR_FIELD_REGISTRY,
    BootstrapPolicy,
    EvidenceRelation,
)

DOMAIN = "catalog_bootstrap_author"
CLAIM_SCHEMA_VERSION = "catalog_bootstrap_claim_v1"
ACQUISITION_VERSION = "catalog_bootstrap_acquisition_v1"
WIKIDATA_API = "https://www.wikidata.org/w/api.php"
WIKIDATA_HOSTS = frozenset({"www.wikidata.org"})
WIKIPEDIA_HOSTS = frozenset({"en.wikipedia.org", "ru.wikipedia.org"})
MAX_QUERY_VARIANTS = 4
MAX_ARTICLE_CHARS = 120_000
MAX_STATEMENTS_PER_PROPERTY = 20
MAX_ENTITY_LABELS = 50
MAX_QUALIFIER_PROPERTIES = 10
MAX_QUALIFIER_VALUES = 10


class AcquisitionMethod(StrEnum):
    WIKIDATA_STRUCTURED = "WIKIDATA_STRUCTURED"
    WIKIPEDIA_TEXT = "WIKIPEDIA_TEXT"


class VerifierStatus(StrEnum):
    UNVERIFIED_SEMANTICALLY = "UNVERIFIED_SEMANTICALLY"
    DETERMINISTIC_PROPERTY_RETRIEVED = "DETERMINISTIC_PROPERTY_RETRIEVED"


@dataclass(frozen=True)
class PropertyRule:
    property_id: str
    relation: EvidenceRelation
    field_name: str
    value_kind: str
    multiple: bool = False


# Explicit mappings only. P27 is citizenship, never nationality. P742 is the
# generic Wikidata "pseudonym" property and therefore never silently becomes
# the narrower Syverro ``pen_names`` relation.
PROPERTY_RULES: tuple[PropertyRule, ...] = (
    *(
        PropertyRule(
            semantic.property_id,
            semantic.relation,
            semantic.field_name,
            semantic.value_kind,
            semantic.field_name in {"occupations", "citizenship", "pseudonyms"},
        )
        for semantic in WIKIDATA_PROPERTY_RULES.values()
    ),
)


@dataclass(frozen=True)
class CanonicalIdentity:
    qid: str
    query_variant: str
    resolved_title: str
    resolved_page_id: int
    resolved_site: str
    canonical_title: str
    canonical_url: str
    canonical_site: str
    native_sitelink: dict[str, str] | None = None

    def provenance(self) -> dict[str, Any]:
        return {
            "author_query_variant": self.query_variant,
            "resolved_wikipedia": {
                "site": self.resolved_site,
                "title": self.resolved_title,
                "page_id": self.resolved_page_id,
            },
            "wikidata_qid": self.qid,
            "canonical_wikipedia": {
                "site": self.canonical_site,
                "title": self.canonical_title,
                "url": self.canonical_url,
            },
            "native_sitelink": self.native_sitelink,
            "resolution_method": "exact_title_pageprops_wikibase_item",
        }


@dataclass(frozen=True)
class AcquiredFact:
    rule: PropertyRule
    value: Any
    statement_id: str | None
    rank: str
    qualifiers: dict[str, Any]
    raw_datavalue: Any


@dataclass
class BootstrapOutcome:
    run: SyvaiRun
    identity: CanonicalIdentity | None = None
    wikipedia_source: Source | None = None
    wikidata_source: Source | None = None
    proposals: list[AIProposal] = field(default_factory=list)
    fields_skipped: list[dict[str, str]] = field(default_factory=list)
    error: str | None = None


def _fetcher(hosts: frozenset[str]) -> SafeFetcher:
    return SafeFetcher(FetcherConfig(
        timeout_seconds=settings.SYVAI_DISCOVERY_TIMEOUT_SECONDS,
        max_bytes=settings.SYVAI_DISCOVERY_MAX_PAGE_BYTES,
        user_agent=settings.SYVAI_DISCOVERY_USER_AGENT,
        allowed_hosts=hosts,
    ))


async def _json(fetcher: SafeFetcher, url: str) -> dict:
    page = await fetcher.fetch(url)
    return json.loads(page.text)


def _stored_wikipedia_identity(author: Author) -> tuple[str, str] | None:
    raw = (author.wikipedia_url or "").strip()
    if not raw:
        return None
    parsed = urlparse(raw)
    if parsed.hostname not in WIKIPEDIA_HOSTS or not parsed.path.startswith("/wiki/"):
        return None
    title = unquote(parsed.path[len("/wiki/"):]).replace("_", " ").strip()
    return (parsed.hostname.split(".", 1)[0], title) if title else None


def _wiki_query_url(site: str, variants: Sequence[str], *, extract: bool = False) -> str:
    props = "extracts|pageprops" if extract else "pageprops"
    params = {
        "action": "query", "format": "json", "formatversion": 2, "redirects": 1,
        "prop": props, "ppprop": "disambiguation|wikibase_item",
        "titles": "|".join(variants[:MAX_QUERY_VARIANTS]),
    }
    if extract:
        params.update({"explaintext": 1, "exsectionformat": "plain"})
    return f"https://{site}.wikipedia.org/w/api.php?{urlencode(params)}"


async def _resolve_on_site(
    fetcher: SafeFetcher, site: str, variants: Sequence[str]
) -> tuple[str, str, int, str] | None:
    data = await _json(fetcher, _wiki_query_url(site, variants))
    pages = data.get("query", {}).get("pages", []) or []
    candidates: list[tuple[str, str, int, str]] = []
    for page in pages:
        props = page.get("pageprops") or {}
        if page.get("missing") or "disambiguation" in props:
            continue
        qid = (props.get("wikibase_item") or "").strip()
        if not qid.startswith("Q"):
            continue
        title = page.get("title") or ""
        # MediaWiki does not expose the originating variant per returned page;
        # retain the first exact bounded variant that normalizes to this page.
        variant = next((v for v in variants if v.casefold() == title.casefold()), variants[0])
        candidates.append((qid, title, int(page.get("pageid") or 0), variant))
    identities = {(qid, title) for qid, title, _, _ in candidates}
    if len(identities) > 1:
        raise ValueError("AMBIGUOUS_WIKIPEDIA_IDENTITY")
    return candidates[0] if candidates else None


async def resolve_canonical_identity(
    author: Author,
    *,
    wikipedia_fetcher: SafeFetcher | None = None,
    wikidata_fetcher: SafeFetcher | None = None,
) -> tuple[CanonicalIdentity, dict]:
    wiki = wikipedia_fetcher or _fetcher(WIKIPEDIA_HOSTS)
    wd = wikidata_fetcher or _fetcher(WIKIDATA_HOSTS)
    stored = _stored_wikipedia_identity(author)
    variants = search_variants(author)
    attempts: list[tuple[str, list[str]]] = []
    if stored:
        attempts.append((stored[0], [stored[1]]))
    attempts.append(("en", variants))
    if any(ord(ch) > 127 for variant in variants for ch in variant):
        attempts.append(("ru", variants))

    resolved = None
    resolved_site = ""
    for site, terms in attempts:
        if not terms or site not in {"en", "ru"}:
            continue
        candidate = await _resolve_on_site(wiki, site, terms)
        if candidate:
            resolved, resolved_site = candidate, site
            break
    if not resolved:
        raise ValueError("CANONICAL_WIKIPEDIA_IDENTITY_NOT_FOUND")
    qid, title, page_id, variant = resolved

    entity_url = f"{WIKIDATA_API}?{urlencode({'action':'wbgetentities','format':'json','ids':qid,'props':'claims|labels|sitelinks','languages':'en'})}"
    entity = (await _json(wd, entity_url)).get("entities", {}).get(qid) or {}
    if entity.get("missing") is not None:
        raise ValueError("WIKIDATA_ENTITY_MISSING")
    sitelinks = entity.get("sitelinks") or {}
    resolved_key = f"{resolved_site}wiki"
    bound_title = (sitelinks.get(resolved_key) or {}).get("title")
    if bound_title and bound_title.casefold() != title.casefold():
        raise ValueError("WIKIDATA_SITELINK_IDENTITY_MISMATCH")
    canonical_site = "en" if sitelinks.get("enwiki") else resolved_site
    canonical_title = (sitelinks.get(f"{canonical_site}wiki") or {}).get("title") or title
    native = None
    if resolved_site != "en":
        native = {"site": resolved_key, "title": title}
    identity = CanonicalIdentity(
        qid=qid, query_variant=variant, resolved_title=title,
        resolved_page_id=page_id, resolved_site=resolved_site,
        canonical_title=canonical_title, canonical_site=canonical_site,
        canonical_url=f"https://{canonical_site}.wikipedia.org/wiki/{quote(canonical_title.replace(' ', '_'))}",
        native_sitelink=native,
    )
    return identity, entity


def _ranked_statements(statements: list[dict]) -> tuple[list[dict], str | None]:
    usable = [s for s in statements if s.get("rank", "normal") != "deprecated"]
    preferred = [s for s in usable if s.get("rank") == "preferred"]
    return (preferred or usable, "preferred" if preferred else "normal")


def _time_value(raw: dict) -> dict | None:
    return normalize_wikidata_time(raw)


def _entity_label(entity_id: str, entities: dict[str, dict]) -> str | None:
    entity = entities.get(entity_id) or {}
    labels = entity.get("labels") or {}
    return ((labels.get("en") or {}).get("value") or next(
        (entry.get("value") for entry in labels.values() if entry.get("value")), None
    ))


def _bounded_qualifiers(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        return {}
    return {
        str(property_id): values[:MAX_QUALIFIER_VALUES] if isinstance(values, list) else []
        for property_id, values in list(raw.items())[:MAX_QUALIFIER_PROPERTIES]
    }


async def _load_entity_labels(
    qids: set[str], fetcher: SafeFetcher
) -> dict[str, dict]:
    if not qids:
        return {}
    bounded_qids = sorted(qids)[:MAX_ENTITY_LABELS]
    url = f"{WIKIDATA_API}?{urlencode({'action':'wbgetentities','format':'json','ids':'|'.join(bounded_qids),'props':'labels','languages':'en'})}"
    return (await _json(fetcher, url)).get("entities", {}) or {}


async def acquire_structured_facts(
    entity: dict,
    *,
    wikidata_fetcher: SafeFetcher | None = None,
) -> tuple[list[AcquiredFact], list[dict[str, str]]]:
    fetcher = wikidata_fetcher or _fetcher(WIKIDATA_HOSTS)
    claims = entity.get("claims") or {}
    selected: dict[str, tuple[PropertyRule, list[dict], str]] = {}
    entity_qids: set[str] = set()
    skipped: list[dict[str, str]] = []
    for rule in PROPERTY_RULES:
        policy = AUTHOR_FIELD_REGISTRY.get(rule.field_name)
        if not policy or policy.deferred or policy.bootstrap_policy in {
            BootstrapPolicy.DETERMINISTIC, BootstrapPolicy.PRESERVE_EXISTING,
            BootstrapPolicy.SYNTHESIZED_REVIEW_REQUIRED, BootstrapPolicy.TIMELINE_ENTAILMENT,
        } or rule.relation not in policy.allowed_relations:
            skipped.append({"field": rule.field_name, "reason": "field_policy_not_acquirable"})
            continue
        statements, rank = _ranked_statements(
            (claims.get(rule.property_id) or [])[:MAX_STATEMENTS_PER_PROPERTY]
        )
        if not statements:
            continue
        selected[rule.property_id] = (rule, statements, rank or "normal")
        if rule.value_kind == "entity":
            for statement in statements:
                value = (((statement.get("mainsnak") or {}).get("datavalue") or {}).get("value"))
                if isinstance(value, dict) and value.get("id"):
                    entity_qids.add(value["id"])
    labels = await _load_entity_labels(entity_qids, fetcher)

    facts: list[AcquiredFact] = []
    for property_id, (rule, statements, rank) in selected.items():
        converted: list[AcquiredFact] = []
        for statement in statements:
            snak = statement.get("mainsnak") or {}
            if snak.get("snaktype") != "value":
                continue
            raw = (snak.get("datavalue") or {}).get("value")
            value: Any = None
            if rule.value_kind == "time" and isinstance(raw, dict):
                value = _time_value(raw)
            elif rule.value_kind == "entity" and isinstance(raw, dict) and raw.get("id"):
                label = _entity_label(raw["id"], labels)
                value = {"value": label, "wikidata_qid": raw["id"]} if label else None
            elif rule.value_kind == "monolingual" and isinstance(raw, dict):
                text = (raw.get("text") or "").strip()
                value = {"value": text, "language": raw.get("language")} if text else None
            if value is not None:
                converted.append(AcquiredFact(
                    rule, value, statement.get("id"), statement.get("rank", rank),
                    _bounded_qualifiers(statement.get("qualifiers")), raw,
                ))
        unique = {json.dumps(f.value, sort_keys=True, ensure_ascii=False) for f in converted}
        if not rule.multiple and len(unique) > 1:
            skipped.append({"field": rule.field_name, "reason": f"conflicting_{property_id}_values"})
            continue
        facts.extend(converted if rule.multiple else converted[:1])
    return facts, skipped


async def _reuse_or_create_source(
    db: AsyncSession, *, author: Author, title: str, source_type: str, url: str,
    citation: str | None, notes: str, authority_tier: str,
) -> Source:
    normalized = normalize_url(url) or url
    result = await db.execute(select(Source).where(Source.normalized_url == normalized))
    source = result.scalar_one_or_none()
    if source is None:
        source = Source(
            title=title, source_type=source_type, url=url, normalized_url=normalized,
            citation=citation, notes=notes, language="en" if "en.wikipedia.org" in url else None,
            reliability_score="4", source_origin="catalog_bootstrap",
            authority_tier=authority_tier, review_status="pending",
            discovered_by=ACQUISITION_VERSION, discovered_at=datetime.now(timezone.utc),
        )
        db.add(source)
        await db.flush()
    link = await db.execute(select(AuthorSourceLink).where(
        AuthorSourceLink.author_id == author.id, AuthorSourceLink.source_id == source.id,
    ))
    if link.scalar_one_or_none() is None:
        db.add(AuthorSourceLink(author_id=author.id, source_id=source.id))
    return source


async def _fetch_article(identity: CanonicalIdentity, fetcher: SafeFetcher) -> tuple[str, dict]:
    data = await _json(fetcher, _wiki_query_url(identity.canonical_site, [identity.canonical_title], extract=True))
    pages = data.get("query", {}).get("pages", []) or []
    if len(pages) != 1:
        raise ValueError("CANONICAL_WIKIPEDIA_ARTICLE_NOT_FOUND")
    page = pages[0]
    props = page.get("pageprops") or {}
    text = (page.get("extract") or "").strip()
    if page.get("missing") or "disambiguation" in props or not text:
        raise ValueError("CANONICAL_WIKIPEDIA_ARTICLE_INVALID")
    if props.get("wikibase_item") != identity.qid:
        raise ValueError("CANONICAL_WIKIPEDIA_QID_MISMATCH")
    return text[:MAX_ARTICLE_CHARS], {
        "page_id": page.get("pageid"), "title": page.get("title"), "qid": identity.qid,
        "truncated": len(text) > MAX_ARTICLE_CHARS, "max_chars": MAX_ARTICLE_CHARS,
    }


def _current_value(author: Author, field_name: str) -> Any:
    if field_name == "citizenship":
        return None
    return getattr(author, field_name, None)


def _proposal_claim(proposal: AIProposal) -> dict | None:
    try:
        payload = json.loads(proposal.suggested_value)
    except (TypeError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


async def _pending_logical_duplicate(
    db: AsyncSession, *, author: Author, field_name: str, value: Any,
) -> AIProposal | None:
    result = await db.execute(select(AIProposal).where(
        AIProposal.entity_type == "author",
        AIProposal.entity_id == str(author.id),
        AIProposal.field_name == field_name,
        AIProposal.source_type == "catalog_bootstrap",
        AIProposal.status == "proposed",
    ))
    key = logical_claim_value(value)
    for proposal in result.scalars().all():
        payload = _proposal_claim(proposal)
        if payload and logical_claim_value(payload.get("value")) == key:
            return proposal
    return None


async def _attach_verified_source(
    db: AsyncSession, *, proposal: AIProposal, source: Source,
    fact: AcquiredFact, verification,
) -> None:
    result = await db.execute(select(AIProposalSource).where(
        AIProposalSource.proposal_id == proposal.id,
        AIProposalSource.source_id == source.id,
    ))
    if result.scalar_one_or_none() is not None:
        return
    db.add(AIProposalSource(
        proposal_id=proposal.id, source_id=source.id,
        snippet=verification.source_span,
        reliability_tier="high", verification_state=verification.verification_state.value,
        verification_reason=f"{VERIFIER_VERSION}: {verification.reason}",
        provenance_type="wikidata_structured", synthesis_involved=False,
    ))


def _merge_statement_provenance(proposal: AIProposal, fact: AcquiredFact) -> None:
    claim = _proposal_claim(proposal)
    if not claim:
        return
    evidence = claim.setdefault("evidence", {})
    primary_id = evidence.get("statement_id")
    statement = {
        "statement_id": fact.statement_id,
        "rank": fact.rank,
        "qualifiers": fact.qualifiers,
        "retrieved_datavalue": fact.raw_datavalue,
        "resolved_entity_label": (
            fact.value.get("value")
            if fact.rule.value_kind == "entity" and isinstance(fact.value, dict)
            else None
        ),
    }
    if not fact.statement_id or fact.statement_id == primary_id:
        return
    additional = evidence.setdefault("additional_statements", [])
    if fact.statement_id not in {item.get("statement_id") for item in additional}:
        additional.append(statement)
        proposal.suggested_value = json.dumps(claim, ensure_ascii=False)


async def _persist_fact(
    db: AsyncSession, *, author: Author, run: SyvaiRun, fact: AcquiredFact,
    identity: CanonicalIdentity, source: Source,
) -> AIProposal:
    policy = AUTHOR_FIELD_REGISTRY[fact.rule.field_name]
    claim = {
        "schema_version": CLAIM_SCHEMA_VERSION,
        "target_author_id": str(author.id),
        "field_name": fact.rule.field_name,
        "value": fact.value,
        "subject": {"type": "Author", "author_id": str(author.id), "wikidata_qid": identity.qid},
        "relation": fact.rule.relation.value,
        "source": {"source_id": str(source.id), "wikidata_qid": identity.qid, "property_id": fact.rule.property_id},
        "evidence": {
            "statement_id": fact.statement_id, "rank": fact.rank,
            "qualifiers": fact.qualifiers, "retrieved_datavalue": fact.raw_datavalue,
            "resolved_entity_label": (
                fact.value.get("value")
                if fact.rule.value_kind == "entity" and isinstance(fact.value, dict)
                else None
            ),
        },
        "acquisition_method": AcquisitionMethod.WIKIDATA_STRUCTURED.value,
        "acquisition_version": ACQUISITION_VERSION,
        "verifier_status": VerifierStatus.DETERMINISTIC_PROPERTY_RETRIEVED.value,
        "human_review_required": True,
        "auto_apply": False,
    }
    verification = verify_wikidata_claim(
        claim, target_author_id=str(author.id), target_qid=identity.qid,
    )
    # Structurally impossible or semantically mismatched B2 envelopes never
    # reach proposal persistence. Acquisition records the skipped field.
    if not verification.direct_grounded:
        raise ValueError(f"BOOTSTRAP_CLAIM_REJECTED:{verification.reason}")

    existing = await _pending_logical_duplicate(
        db, author=author, field_name=fact.rule.field_name, value=fact.value,
    )
    if existing is not None:
        _merge_statement_provenance(existing, fact)
        await _attach_verified_source(
            db, proposal=existing, source=source, fact=fact, verification=verification,
        )
        return existing

    claim["verifier_status"] = "DIRECT_GROUNDED"
    claim["verification"] = {
        "verifier_version": VERIFIER_VERSION,
        "state": verification.verification_state.value,
        "reason": verification.reason,
    }
    current = _current_value(author, fact.rule.field_name)
    proposal = AIProposal(
        entity_type="author", entity_id=str(author.id), field_name=fact.rule.field_name,
        current_value=(json.dumps({"field": fact.rule.field_name, "value": current}, ensure_ascii=False) if current not in (None, "", [], {}) else None),
        suggested_value=json.dumps(claim, ensure_ascii=False), source_type="catalog_bootstrap",
        confidence=1.0, status="proposed", validation_state="direct_grounded",
        conflict_state="existing_value" if current not in (None, "", [], {}) else "new",
        review_band="quality_review", review_reason="bootstrap_semantic_verified_human_review_required",
        run_id=run.id,
    )
    assert policy.human_review_required
    db.add(proposal)
    await db.flush()
    await _attach_verified_source(
        db, proposal=proposal, source=source, fact=fact, verification=verification,
    )
    return proposal


async def run_author_bootstrap(
    db: AsyncSession,
    author: Author,
    *,
    wikipedia_fetcher: SafeFetcher | None = None,
    wikidata_fetcher: SafeFetcher | None = None,
) -> BootstrapOutcome:
    """Execute one explicit B2 acquisition. Nothing is approved or applied."""
    started = time.monotonic()
    run = SyvaiRun(
        author_id=author.id, domain=DOMAIN, status="running", provider="wikimedia",
        model=ACQUISITION_VERSION, calls=0, source_count=0,
        corpus_manifest={"acquisition_version": ACQUISITION_VERSION, "provider_called": False},
    )
    db.add(run)
    await db.flush()
    outcome = BootstrapOutcome(run=run)
    wiki = wikipedia_fetcher or _fetcher(WIKIPEDIA_HOSTS)
    wd = wikidata_fetcher or _fetcher(WIKIDATA_HOSTS)
    try:
        identity, entity = await resolve_canonical_identity(
            author, wikipedia_fetcher=wiki, wikidata_fetcher=wd,
        )
        outcome.identity = identity
        article, retrieval = await _fetch_article(identity, wiki)
        # Finish every remote acquisition before persistence. A failed label or
        # fact read therefore leaves only the operator-visible failed run, not
        # a partially-created source/proposal set.
        facts, skipped = await acquire_structured_facts(entity, wikidata_fetcher=wd)
        outcome.fields_skipped.extend(skipped)
        wikipedia_source = await _reuse_or_create_source(
            db, author=author, title=identity.canonical_title, source_type="wikipedia",
            url=identity.canonical_url, citation=article,
            notes=json.dumps({"bootstrap_retrieval": retrieval, "identity": identity.provenance()}, ensure_ascii=False),
            authority_tier="medium",
        )
        wikidata_source = await _reuse_or_create_source(
            db, author=author, title=f"Wikidata entity {identity.qid}", source_type="wikidata",
            url=f"https://www.wikidata.org/wiki/{identity.qid}", citation=None,
            notes=f"Canonical structured identity for {identity.canonical_title}; properties are retained per proposal provenance.",
            authority_tier="high",
        )
        outcome.wikipedia_source, outcome.wikidata_source = wikipedia_source, wikidata_source
        for fact in facts:
            proposal = await _persist_fact(
                db, author=author, run=run, fact=fact, identity=identity, source=wikidata_source,
            )
            if proposal.id not in {item.id for item in outcome.proposals}:
                outcome.proposals.append(proposal)
        # Explicit B2 deferrals are present in telemetry even though no claim
        # generation path exists for them.
        for name, policy in AUTHOR_FIELD_REGISTRY.items():
            if policy.deferred or policy.bootstrap_policy in {
                BootstrapPolicy.DETERMINISTIC, BootstrapPolicy.PRESERVE_EXISTING,
                BootstrapPolicy.SYNTHESIZED_REVIEW_REQUIRED, BootstrapPolicy.TIMELINE_ENTAILMENT,
            }:
                outcome.fields_skipped.append({"field": name, "reason": policy.bootstrap_policy.value})
        run.status = "completed"
        # SyvaiRun.calls is provider/model usage telemetry. Wikimedia HTTP
        # acquisition is described by the manifest and makes no model call.
        run.calls = 0
        run.source_count = 2
        run.routing_reason = "canonical_wikimedia_identity"
        run.corpus_manifest = {
            "acquisition_version": ACQUISITION_VERSION, "claim_schema_version": CLAIM_SCHEMA_VERSION,
            "verifier_version": VERIFIER_VERSION,
            "provider_called": False, "openai_called": False, "identity": identity.provenance(),
            "wikipedia_source_id": str(wikipedia_source.id), "wikidata_source_id": str(wikidata_source.id),
            "proposal_count": len(outcome.proposals), "fields_skipped": outcome.fields_skipped,
        }
    except Exception as exc:  # typed, persisted operator-visible failure
        outcome.error = str(exc)[:500]
        run.status = "failed"
        run.error = outcome.error
        run.routing_reason = "canonical_identity_or_acquisition_failed"
        run.corpus_manifest = {
            "acquisition_version": ACQUISITION_VERSION, "provider_called": False,
            "verifier_version": VERIFIER_VERSION,
            "openai_called": False, "error": outcome.error,
        }
    run.duration_ms = int((time.monotonic() - started) * 1000)
    run.finished_at = datetime.now(timezone.utc).replace(tzinfo=None)
    await db.flush()
    return outcome
