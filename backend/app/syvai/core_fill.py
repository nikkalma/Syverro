"""SyvAI 0.4B — Author core fill orchestrator.

One generic consumer running ANY of the fill domains (identity, biography,
literary_context) through the existing SyvAI architecture:

    routed/loadable trusted sources
        -> bounded per-domain prompt
        -> provider structured output
        -> generic field-claim parsing
        -> deterministic field validation
        -> evidence verification (0.2D material-detail grounding)
        -> corroboration (0.2E family dedupe)
        -> explainable confidence
        -> AIProposal / AIProposalSource persistence

TIMELINE is untouched; ``run_timeline_research`` remains the only timeline
consumer. This module deliberately mirrors its failure/telemetry contract for
the new domains without reimplementing it.

Semantics worth noting:

  * routing gate: if the registry pool for the domain is MISSING, the run is
    recorded as ``skipped`` with the reason, and no provider call is made;
  * generation only runs when at least one trusted source is loaded;
  * list fields are split into one proposal per item so grounding is per item
    (one grounded sibling never grounds another);
  * no proposal is applied here — safe generation first, Apply is deferred.
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_proposal import AIProposal
from app.models.ai_proposal_source import AIProposalSource
from app.models.author import Author
from app.models.author_citizenship import AuthorCitizenship
from app.models.author_residence import AuthorResidence
from app.models.genre import Genre
from app.models.place import Place
from app.models.source import Source
from app.models.syvai_run import SyvaiRun
from app.syvai.confidence import compute_confidence
from app.syvai.corroboration import corroborate_sources
from app.syvai.errors import ConfigurationError, ProviderError, StructuredOutputError
from app.syvai.evidence import (
    EVIDENCE_PARTIAL,
    EVIDENCE_SYNTHETIC,
    PROVENANCE_DIRECT,
    PROVENANCE_SYNTHETIC,
    PROVENANCE_UNVERIFIED,
    EvidenceVerification,
    build_field_material_requirements,
    verify_evidence,
    verify_field_explicit_evidence,
)
from app.syvai.field_claims import FieldClaim, parse_field_claims
from app.syvai.field_specs import (
    DOMAIN_LITERARY_CONTEXT,
    EXPLICIT_STATEMENT_FIELDS,
    FILL_DOMAINS,
    TAXONOMY_FIELDS,
    VALUE_TYPE_ENTITY,
    VALUE_TYPE_LIST,
    specs_for_domain,
)
from app.syvai.field_validators import normalize_list_items, validate_field_claim
from app.syvai.pipeline import (
    RunOutcome,
    _match_source,
    _record_usage,
    _reliability_tier,
    _sanitize_error,
)
from app.syvai.provider import Provider
from app.syvai.prompts.core_fill_v2 import build_domain_prompt
from app.syvai.timeline_research import build_research_input
from app.syvai.corpus import build_author_corpus
from app.syvai.validators import (
    REVIEW_BAND_AUTO_REJECTED,
    REVIEW_BANDS_NEEDING_HUMAN,
)

logger = logging.getLogger(__name__)


@dataclass
class _SplitItem:
    value: Any
    label: str | None
    description: str | None
    sources: list[Any]
    split_key: bool = True


def _fallback_label(value: Any) -> str:
    if isinstance(value, dict):
        return value.get("state_name") or value.get("place") or str(value)
    return str(value)


def _split_for_spec(claim: FieldClaim, spec) -> list[_SplitItem] | None:
    """Coerce a raw claim into one-or-more single-value items (None = malformed).

    List fields emit one item per proposed list member (per-item grounding).
    """
    value = claim.value
    description = claim.description or None
    if spec.value_type == VALUE_TYPE_ENTITY:
        if not isinstance(value, dict):
            return None
        return [_SplitItem(value, claim.label or _fallback_label(value), description, claim.sources)]
    if spec.value_type == VALUE_TYPE_LIST:
        if isinstance(value, str):
            cleaned = value.strip()
            return (
                None
                if not cleaned
                else [_SplitItem(cleaned, claim.label or cleaned, description, claim.sources)]
            )
        if isinstance(value, list):
            items = normalize_list_items([str(v) for v in value])
            if not items:
                return None
            return [
                _SplitItem(item, claim.label or item, description, claim.sources)
                for item in items
            ]
        return None
    if isinstance(value, (dict, list)):
        return None
    text = str(value).strip() if value is not None else ""
    if not text:
        return None
    return [_SplitItem(text, claim.label or text, description, claim.sources)]


def _field_material(spec, label: str | None, value: Any):
    """Build the material-detail requirements for one field proposal."""
    if spec.value_type == VALUE_TYPE_ENTITY:
        if spec.name == "active_years":
            return build_field_material_requirements(
                label=label,
                value="",
                date_values=(
                    str(value.get("from_year") or ""),
                    str(value.get("to_year") or ""),
                ),
            )
        if spec.name == "citizenship":
            return build_field_material_requirements(
                label=label,
                value=value.get("state_name"),
                date_values=(value.get("from_date"), value.get("to_date")),
            )
        if spec.name == "residence":
            return build_field_material_requirements(
                label=label,
                value=value.get("place"),
                place=value.get("place"),
                date_values=(value.get("from_date"), value.get("to_date")),
            )
    return build_field_material_requirements(
        label=label,
        value=str(value) if value is not None else None,
    )


def _suggested_value_payload(
    *,
    spec,
    value: Any,
    label: str | None,
    description: str | None,
    split: bool,
    taxonomy_match: str | None,
    taxonomy_applies: bool,
) -> dict:
    payload: dict[str, Any] = {
        "field": spec.name,
        "value": value,
        "label": label,
        "description": description,
        "value_type": spec.value_type,
    }
    if split:
        payload["split_item"] = True
    if taxonomy_applies:
        payload["taxonomy_match"] = (
            {"resolved": True, "slug": taxonomy_match} if taxonomy_match else {"resolved": False}
        )
    return payload


async def _persist_proposal(
    db: AsyncSession,
    author: Author,
    run: SyvaiRun,
    *,
    spec,
    payload: dict,
    existing_value: Any,
    validation,
    confidence: float,
) -> AIProposal:
    field_name = spec.name
    current_json = None
    if existing_value not in (None, "", [], {}):
        current_json = json.dumps({"field": field_name, "value": existing_value}, ensure_ascii=False)

    proposal = AIProposal(
        entity_type="author",
        entity_id=str(author.id),
        field_name=field_name,
        current_value=current_json,
        suggested_value=json.dumps(payload, ensure_ascii=False),
        source_type="ai",
        confidence=confidence,
        status="rejected" if validation.review_band == REVIEW_BAND_AUTO_REJECTED else "proposed",
        validation_state=validation.validation_state,
        conflict_state=validation.conflict_state,
        review_band=validation.review_band,
        review_reason=validation.review_reason,
        run_id=run.id,
    )
    db.add(proposal)
    await db.flush()
    return proposal


async def _persist_rejected(
    db: AsyncSession,
    author: Author,
    run: SyvaiRun,
    claim: FieldClaim,
    reason: str,
) -> AIProposal:
    proposal = AIProposal(
        entity_type="author",
        entity_id=str(author.id),
        field_name=claim.field_name,
        current_value=None,
        suggested_value=json.dumps(
            {
                "field": claim.field_name,
                "value": claim.value,
                "label": claim.label,
                "description": claim.description,
                "reason": reason,
            },
            ensure_ascii=False,
        ),
        source_type="ai",
        confidence=0.1,
        status="rejected",
        validation_state="invalid",
        conflict_state="new",
        review_band="auto_rejected",
        review_reason="invalid_claim",
        run_id=run.id,
    )
    db.add(proposal)
    await db.flush()
    return proposal


async def _persist_one_item(
    db: AsyncSession,
    author: Author,
    run: SyvaiRun,
    spec,
    item: _SplitItem,
    trusted_sources: list[dict],
    source_by_id: dict[str, Source],
    existing_values: dict,
    taxonomy_names: set[str],
) -> AIProposal | None:
    matched_sources: list[dict] = []
    ref_evidence: dict[str, str | None] = {}
    seen_source_ids: set[str] = set()
    for ref in item.sources:
        matched = _match_source(ref.model_dump(), trusted_sources)
        if matched and matched["id"] not in seen_source_ids:
            matched_sources.append(matched)
            seen_source_ids.add(matched["id"])
            ref_evidence[matched["id"]] = ref.evidence

    reliabilities = [source.get("reliability_score") for source in matched_sources]

    material = _field_material(spec, item.label, item.value)
    verifications: dict[str, EvidenceVerification] = {}
    grounded_source_count = 0
    # 0.6B Phase 2: for fields that must be explicitly stated, a failed
    # fragment check may be supplemented by a deterministic explicit-statement
    # check against the full stored citation (value tokens must be literally
    # present in the trusted source text — never inferred from a proxy).
    explicit_capable = spec.name in EXPLICIT_STATEMENT_FIELDS
    for matched in matched_sources:
        source_id = matched["id"]
        source_row = source_by_id.get(source_id)
        citation = source_row.citation if source_row else None
        verification = verify_evidence(
            ref_evidence.get(source_id),
            citation,
            material=material,
        )
        if not verification.is_grounded and explicit_capable:
            verification = verify_field_explicit_evidence(
                str(item.value) if item.value is not None else None,
                citation,
            )
        verifications[source_id] = verification
        if verification.is_grounded:
            grounded_source_count += 1

    corroboration = corroborate_sources(
        [source_by_id.get(matched["id"]) for matched in matched_sources],
        [verifications[matched["id"]].is_grounded for matched in matched_sources],
    )
    grounded_reliabilities = [
        matched.get("reliability_score")
        for matched in matched_sources
        if verifications[matched["id"]].is_grounded
    ]

    validation_result = validate_field_claim(
        spec=spec,
        value=item.value,
        label=item.label,
        description=item.description,
        existing_value=existing_values.get(spec.name),
        source_count=len(matched_sources),
        grounded_source_count=grounded_source_count,
        taxonomy_names=taxonomy_names,
    )
    confidence = compute_confidence(
        validation=validation_result.validation,
        source_count=len(matched_sources),
        reliabilities=reliabilities,
        grounded_source_count=grounded_source_count,
        independent_grounded_source_count=corroboration.independent_grounded_source_count,
        grounded_reliabilities=grounded_reliabilities,
    )

    persist_value = (
        validation_result.value if validation_result.value is not None else item.value
    )
    taxonomy_applies = spec.domain == DOMAIN_LITERARY_CONTEXT and spec.name in TAXONOMY_FIELDS
    payload = _suggested_value_payload(
        spec=spec,
        value=persist_value,
        label=item.label,
        description=item.description,
        split=item.split_key,
        taxonomy_match=validation_result.taxonomy_match,
        taxonomy_applies=taxonomy_applies,
    )
    proposal = await _persist_proposal(
        db,
        author,
        run,
        spec=spec,
        payload=payload,
        existing_value=existing_values.get(spec.name),
        validation=validation_result.validation,
        confidence=confidence,
    )
    proposal.corroboration = corroboration.to_dict()

    partial_count = sum(
        verification.verification_state == EVIDENCE_PARTIAL
        for verification in verifications.values()
    )
    synthetic_claim = grounded_source_count == 0 and partial_count > 1

    for matched in matched_sources:
        source_id = matched["id"]
        verification = verifications[source_id]
        state = EVIDENCE_SYNTHETIC if synthetic_claim and verification.is_persistable else verification.verification_state
        snippet = verification.source_span if verification.is_persistable else None
        db.add(
            AIProposalSource(
                proposal_id=proposal.id,
                source_id=source_id,
                snippet=snippet,
                verification_state=state,
                verification_reason=verification.reason,
                provenance_type=(
                    PROVENANCE_SYNTHETIC
                    if state == EVIDENCE_SYNTHETIC
                    else PROVENANCE_DIRECT
                    if snippet
                    else PROVENANCE_UNVERIFIED
                ),
                synthesis_involved=state == EVIDENCE_SYNTHETIC,
                reliability_tier=_reliability_tier(
                    source_by_id.get(source_id).reliability_score
                    if source_by_id.get(source_id) else None
                ),
            )
        )
    return proposal


async def _persist_field_proposals(
    db: AsyncSession,
    author: Author,
    run: SyvaiRun,
    claims: list[FieldClaim],
    trusted_sources: list[dict],
    existing_values: dict,
    taxonomy_names: set[str],
) -> list[AIProposal]:
    source_map = {source["id"]: source for source in trusted_sources}
    source_id_list = list(source_map)
    source_rows: list[Source] = []
    if source_id_list:
        result = await db.execute(select(Source).where(Source.id.in_(source_id_list)))
        source_rows = result.scalars().all()
    source_by_id = {str(source.id): source for source in source_rows}

    specs = {spec.name: spec for spec in specs_for_domain(run.domain)}
    proposals: list[AIProposal] = []
    seen_run_items: dict[str, set[str]] = {}

    for claim in claims:
        spec = specs.get(claim.field_name)
        if spec is None:
            proposals.append(
                await _persist_rejected(
                    db, author, run, claim,
                    f"unsupported field for domain '{run.domain}'",
                )
            )
            continue
        items = _split_for_spec(claim, spec)
        if items is None:
            proposals.append(
                await _persist_rejected(db, author, run, claim, "missing value or malformed value")
            )
            continue
        seen = seen_run_items.setdefault(spec.name, set())
        for item in items:
            if spec.value_type == VALUE_TYPE_LIST and _norm(str(item.value)) in seen:
                continue  # deterministic dedupe within one run
            seen.add(_norm(str(item.value)))
            proposal = await _persist_one_item(
                db, author, run, spec, item, trusted_sources,
                source_by_id, existing_values, taxonomy_names,
            )
            if proposal is not None:
                proposals.append(proposal)
    return proposals


def _norm(value: str) -> str:
    return value.strip().casefold()


async def _load_existing_values(db: AsyncSession, author: Author) -> dict:
    """Snapshot of the current Author field values for conflict detection."""
    values: dict[str, Any] = {}
    for field in ("native_name", "birth_name", "nationality", "gender", "bio"):
        values[field] = getattr(author, field, None)
    for field in (
        "pen_names", "pseudonyms", "languages", "occupations",
        "literary_movements", "genres", "themes", "motifs", "concepts",
        "atmospheres", "writing_languages",
    ):
        values[field] = list(getattr(author, field, None) or [])
    active_years = {}
    try:
        if getattr(author, "active_from_year", None) is not None or getattr(author, "active_to_year", None) is not None:
            active_years = {
                "from_year": getattr(author, "active_from_year", None),
                "to_year": getattr(author, "active_to_year", None),
            }
    except Exception:  # noqa: BLE001 - non-ORM author shims in tests
        active_years = {}
    values["active_years"] = active_years

    citizenship_result = await db.execute(
        select(AuthorCitizenship.state_name).where(
            AuthorCitizenship.author_id == author.id
        )
    )
    values["citizenship"] = list(citizenship_result.scalars().all())

    residence_result = await db.execute(
        select(Place.name)
        .join(AuthorResidence, AuthorResidence.place_id == Place.id)
        .where(AuthorResidence.author_id == author.id)
    )
    values["residence"] = list(residence_result.scalars().all())
    return values


async def _load_taxonomy_names(db: AsyncSession) -> set[str]:
    """Canonical taxonomy labels used to resolve literary-context proposals."""
    result = await db.execute(select(Genre.name))
    return set(result.scalars().all())


async def run_domain_research(
    db: AsyncSession,
    author: Author,
    provider: Provider,
    domain: str,
    *,
    route_result=None,
) -> RunOutcome:
    """Execute one grounded fill run for one of the 0.4B fill domains.

    The run record is committed regardless of outcome (telemetry and skip
    reasons survive provider or routing failures).
    """
    if domain not in FILL_DOMAINS:
        raise ValueError(f"unsupported fill domain '{domain}'")

    started = time.monotonic()
    run = SyvaiRun(
        author_id=author.id,
        domain=domain,
        status="running",
        provider=getattr(provider, "name", ""),
        model=getattr(provider, "model", None),
    )
    db.add(run)
    await db.flush()

    try:
        corpus = (
            route_result.corpus_snapshot
            if route_result is not None and hasattr(route_result, "corpus_snapshot")
            else await build_author_corpus(db, author.id)
        )
        trusted_sources = corpus.sources_for_domain(domain)
        manifest = corpus.manifest(domain, trusted_sources)
        run.corpus_manifest = manifest
        run.routing_reason = manifest["routing_reason"]
        run.source_count = len(trusted_sources)
        await db.flush()  # immutable input decision exists before any provider call
        if manifest["permitted_domain"] is None:
            run.status = "skipped"
            run.error = manifest["routing_reason"]
            run.duration_ms = int((time.monotonic() - started) * 1000)
            run.finished_at = datetime.now(timezone.utc).replace(tzinfo=None)
            await db.commit()
            await db.refresh(run)
            return RunOutcome(run=run, proposals=[], error=run.error)

        research = build_research_input(author, trusted_sources)
        system_prompt, user_prompt = build_domain_prompt(domain, research)
        run.corpus_manifest = {**manifest, "provider_called": True}
        await db.flush()
        result: Any = await provider.complete(system_prompt, user_prompt)

        field_claims = parse_field_claims(result.text)
        existing_values = await _load_existing_values(db, author)
        taxonomy_names = (
            await _load_taxonomy_names(db) if domain == DOMAIN_LITERARY_CONTEXT else set()
        )
        proposals = await _persist_field_proposals(
            db,
            author,
            run,
            field_claims,
            trusted_sources,
            existing_values,
            taxonomy_names,
        )

        _record_usage(run, result.usage)
        run.duration_ms = int((time.monotonic() - started) * 1000)
        run.finished_at = datetime.now(timezone.utc).replace(tzinfo=None)
        if any(p.review_band in REVIEW_BANDS_NEEDING_HUMAN for p in proposals):
            run.status = "review_needed"
        else:
            run.status = "completed"
        run.error = None

        await db.commit()
        await db.refresh(run)
        return RunOutcome(run=run, proposals=proposals)
    except (ConfigurationError, ProviderError, StructuredOutputError) as exc:
        run.status = "failed"
        run.error = _sanitize_error(exc)
        run.duration_ms = int((time.monotonic() - started) * 1000)
        run.finished_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await db.commit()
        await db.refresh(run)
        logger.warning("syvai %s run failed: %s", domain, run.error)
        return RunOutcome(run=run, proposals=[], error=run.error)
    except Exception as exc:  # noqa: BLE001 - boundary catch for telemetry
        run.status = "failed"
        run.error = _sanitize_error(exc)
        run.duration_ms = int((time.monotonic() - started) * 1000)
        run.finished_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await db.commit()
        await db.refresh(run)
        logger.exception("syvai %s run crashed: %s", domain, run.error)
        return RunOutcome(run=run, proposals=[], error=run.error)
