"""Deterministic Author field entailment for Catalog Bootstrap B3.

The verifier proves target subject + allowed relation + exact value. It has no
model, embedding, fuzzy-match, or general-discovery dependency.
"""

from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass
from enum import StrEnum
from typing import Any, Iterable
from uuid import UUID

from app.syvai.field_specs import AUTHOR_FIELD_REGISTRY, BootstrapPolicy, EvidenceRelation

VERIFIER_VERSION = "author_field_entailment_v1"
CLAIM_SCHEMA_VERSION = "catalog_bootstrap_claim_v1"
MAX_EVIDENCE_SPAN_CHARS = 500


class VerificationState(StrEnum):
    DIRECT_GROUNDED = "direct_grounded"
    PARTIAL = "partial"
    UNGROUNDED = "ungrounded"


@dataclass(frozen=True)
class EntailmentResult:
    verification_state: VerificationState
    reason: str
    verifier_version: str = VERIFIER_VERSION
    source_span: str | None = None
    span_start: int | None = None
    span_end: int | None = None

    @property
    def direct_grounded(self) -> bool:
        return self.verification_state == VerificationState.DIRECT_GROUNDED


@dataclass(frozen=True)
class EvidenceSpan:
    text: str
    start: int
    end: int


@dataclass(frozen=True)
class WikidataSemanticRule:
    property_id: str
    field_name: str
    relation: EvidenceRelation
    value_kind: str


WIKIDATA_PROPERTY_RULES: dict[str, WikidataSemanticRule] = {
    rule.property_id: rule for rule in (
        WikidataSemanticRule("P569", "birth_date", EvidenceRelation.AUTHOR_BORN_ON, "time"),
        WikidataSemanticRule("P570", "death_date", EvidenceRelation.AUTHOR_DIED_ON, "time"),
        WikidataSemanticRule("P19", "birth_place", EvidenceRelation.AUTHOR_BORN_IN, "entity"),
        WikidataSemanticRule("P20", "death_place", EvidenceRelation.AUTHOR_DIED_IN, "entity"),
        WikidataSemanticRule("P106", "occupations", EvidenceRelation.AUTHOR_OCCUPATION, "entity"),
        WikidataSemanticRule("P27", "citizenship", EvidenceRelation.AUTHOR_CITIZENSHIP, "entity"),
        WikidataSemanticRule("P1477", "birth_name", EvidenceRelation.AUTHOR_BIRTH_NAME, "monolingual"),
        WikidataSemanticRule("P1559", "native_name", EvidenceRelation.AUTHOR_NATIVE_NAME, "monolingual"),
        # P742 is only the generic pseudonym relation. It never entails the
        # narrower pen_names or native_name fields.
        WikidataSemanticRule("P742", "pseudonyms", EvidenceRelation.AUTHOR_PSEUDONYM, "monolingual"),
        WikidataSemanticRule("P21", "gender", EvidenceRelation.AUTHOR_GENDER, "entity"),
    )
}


TEXT_RELATIONS: dict[str, EvidenceRelation] = {
    "native_name": EvidenceRelation.AUTHOR_NATIVE_NAME,
    "birth_name": EvidenceRelation.AUTHOR_BIRTH_NAME,
    "pseudonyms": EvidenceRelation.AUTHOR_PSEUDONYM,
    "pen_names": EvidenceRelation.AUTHOR_PEN_NAME,
    "nationality": EvidenceRelation.AUTHOR_NATIONALITY,
    "citizenship": EvidenceRelation.AUTHOR_CITIZENSHIP,
    "gender": EvidenceRelation.AUTHOR_GENDER,
    "occupations": EvidenceRelation.AUTHOR_OCCUPATION,
    "birth_date": EvidenceRelation.AUTHOR_BORN_ON,
    "death_date": EvidenceRelation.AUTHOR_DIED_ON,
    "birth_place": EvidenceRelation.AUTHOR_BORN_IN,
    "death_place": EvidenceRelation.AUTHOR_DIED_IN,
}


def normalize_wikidata_time(raw: dict) -> dict | None:
    """Preserve Wikidata year/month/day precision without inventing parts."""
    time_text = raw.get("time")
    precision = int(raw.get("precision") or 0)
    if not isinstance(time_text, str) or precision not in {9, 10, 11}:
        return None
    sign = "-" if time_text.startswith("-") else ""
    digits = time_text.lstrip("+-").split("T", 1)[0].split("-")
    if len(digits) < 3:
        return None
    year, month, day = digits[:3]
    if precision == 9:
        value, label = f"{sign}{int(year)}", "year"
    elif precision == 10:
        value, label = f"{sign}{int(year):04d}-{int(month):02d}", "month"
    else:
        value, label = f"{sign}{int(year):04d}-{int(month):02d}-{int(day):02d}", "day"
    return {"value": value, "precision": label, "wikidata_precision": precision}


def _policy_allows(field_name: str, relation: str) -> bool:
    policy = AUTHOR_FIELD_REGISTRY.get(field_name)
    if not policy or policy.deferred or policy.bootstrap_policy in {
        BootstrapPolicy.DETERMINISTIC,
        BootstrapPolicy.PRESERVE_EXISTING,
        BootstrapPolicy.SYNTHESIZED_REVIEW_REQUIRED,
        BootstrapPolicy.TIMELINE_ENTAILMENT,
    }:
        return False
    try:
        parsed = EvidenceRelation(relation)
    except ValueError:
        return False
    return parsed in policy.allowed_relations


def _is_uuid(value: Any) -> bool:
    try:
        UUID(str(value))
    except (TypeError, ValueError, AttributeError):
        return False
    return True


def _valid_value_shape(field_name: str, value: Any, method: str) -> bool:
    if method == "WIKIPEDIA_TEXT":
        return bool(_text_value(value))
    if field_name in {"birth_date", "death_date"}:
        return (
            isinstance(value, dict)
            and isinstance(value.get("value"), str)
            and value.get("precision") in {"year", "month", "day"}
            and value.get("wikidata_precision") in {9, 10, 11}
        )
    if field_name in {"birth_place", "death_place", "citizenship", "occupations", "gender"}:
        return (
            isinstance(value, dict)
            and bool(str(value.get("value") or "").strip())
            and bool(re.fullmatch(r"Q\d+", str(value.get("wikidata_qid") or "")))
        )
    if field_name in {"native_name", "birth_name", "pseudonyms"}:
        return (
            isinstance(value, dict)
            and bool(str(value.get("value") or "").strip())
            and bool(str(value.get("language") or "").strip())
        )
    # Text-mode scalar/list-item claims use a direct string value.
    return isinstance(value, str) and bool(value.strip())


def validate_claim_envelope(
    claim: Any,
    *,
    target_author_id: str,
    target_qid: str,
) -> EntailmentResult | None:
    """Return an UNGROUNDED structural result, or None when valid."""
    if not isinstance(claim, dict) or claim.get("schema_version") != CLAIM_SCHEMA_VERSION:
        return EntailmentResult(VerificationState.UNGROUNDED, "invalid_claim_schema")
    if not _is_uuid(target_author_id) or not _is_uuid(claim.get("target_author_id")):
        return EntailmentResult(VerificationState.UNGROUNDED, "invalid_target_author_id")
    if str(claim.get("target_author_id")) != str(target_author_id):
        return EntailmentResult(VerificationState.UNGROUNDED, "target_author_mismatch")
    subject = claim.get("subject") or {}
    if subject.get("type") != "Author" or str(subject.get("author_id")) != str(target_author_id):
        return EntailmentResult(VerificationState.UNGROUNDED, "invalid_target_subject")
    if subject.get("wikidata_qid") != target_qid or not re.fullmatch(r"Q\d+", target_qid or ""):
        return EntailmentResult(VerificationState.UNGROUNDED, "target_qid_mismatch")
    field_name, relation = claim.get("field_name"), claim.get("relation")
    if not isinstance(field_name, str) or not _policy_allows(field_name, str(relation or "")):
        return EntailmentResult(VerificationState.UNGROUNDED, "field_relation_not_allowed")
    source = claim.get("source") or {}
    if not _is_uuid(source.get("source_id")) or source.get("wikidata_qid") != target_qid:
        return EntailmentResult(VerificationState.UNGROUNDED, "invalid_source_identity")
    method = claim.get("acquisition_method")
    if method not in {"WIKIDATA_STRUCTURED", "WIKIPEDIA_TEXT"}:
        return EntailmentResult(VerificationState.UNGROUNDED, "invalid_acquisition_method")
    if not isinstance(claim.get("acquisition_version"), str) or not claim["acquisition_version"]:
        return EntailmentResult(VerificationState.UNGROUNDED, "missing_acquisition_version")
    if not _valid_value_shape(field_name, claim.get("value"), method):
        return EntailmentResult(VerificationState.UNGROUNDED, "invalid_value_shape")
    evidence = claim.get("evidence") or {}
    if method == "WIKIDATA_STRUCTURED":
        statement_id = evidence.get("statement_id")
        if (
            not source.get("property_id") or not isinstance(statement_id, str)
            or not statement_id.startswith(f"{target_qid}$")
        ):
            return EntailmentResult(VerificationState.UNGROUNDED, "missing_structured_reference")
        if "retrieved_datavalue" not in evidence:
            return EntailmentResult(VerificationState.UNGROUNDED, "missing_structured_datavalue")
    else:
        span = evidence.get("span") or {}
        text = span.get("text")
        if (
            not isinstance(text, str) or not text.strip()
            or len(text) > MAX_EVIDENCE_SPAN_CHARS
            or not isinstance(span.get("start"), int)
            or not isinstance(span.get("end"), int)
            or span["start"] < 0 or span["end"] <= span["start"]
            or span["end"] - span["start"] != len(text)
        ):
            return EntailmentResult(VerificationState.UNGROUNDED, "invalid_text_evidence_span")
    return None


def _structured_value_matches(rule: WikidataSemanticRule, claimed: Any, raw: Any) -> bool:
    if rule.value_kind == "time":
        return isinstance(raw, dict) and normalize_wikidata_time(raw) == claimed
    if rule.value_kind == "entity":
        return (
            isinstance(raw, dict)
            and isinstance(claimed, dict)
            and raw.get("id") == claimed.get("wikidata_qid")
            and bool(str(claimed.get("value") or "").strip())
        )
    if rule.value_kind == "monolingual":
        return (
            isinstance(raw, dict)
            and isinstance(claimed, dict)
            and raw.get("text") == claimed.get("value")
            and raw.get("language") == claimed.get("language")
        )
    return False


def _qualifiers_contradict(property_id: str, raw_value: Any, qualifiers: Any) -> bool:
    if not isinstance(qualifiers, dict):
        return True
    for qualifier in qualifiers.get(property_id, []):
        value = ((qualifier or {}).get("datavalue") or {}).get("value")
        if value is not None and value != raw_value:
            return True
    return False


def verify_wikidata_claim(
    claim: dict,
    *,
    target_author_id: str,
    target_qid: str,
) -> EntailmentResult:
    invalid = validate_claim_envelope(
        claim, target_author_id=target_author_id, target_qid=target_qid,
    )
    if invalid:
        return invalid
    if claim.get("acquisition_method") != "WIKIDATA_STRUCTURED":
        return EntailmentResult(VerificationState.UNGROUNDED, "wrong_evidence_mode")
    source, evidence = claim["source"], claim["evidence"]
    rule = WIKIDATA_PROPERTY_RULES.get(source["property_id"])
    if not rule:
        return EntailmentResult(VerificationState.UNGROUNDED, "unmapped_wikidata_property")
    if rule.field_name != claim["field_name"] or rule.relation.value != claim["relation"]:
        return EntailmentResult(VerificationState.UNGROUNDED, "property_relation_mismatch")
    if source.get("wikidata_qid") != target_qid:
        return EntailmentResult(VerificationState.UNGROUNDED, "structured_subject_mismatch")
    if evidence.get("rank") == "deprecated":
        return EntailmentResult(VerificationState.UNGROUNDED, "deprecated_statement")
    if evidence.get("rank") not in {"normal", "preferred"}:
        return EntailmentResult(VerificationState.UNGROUNDED, "invalid_statement_rank")
    raw = evidence.get("retrieved_datavalue")
    if not _structured_value_matches(rule, claim["value"], raw):
        return EntailmentResult(VerificationState.UNGROUNDED, "structured_value_mismatch")
    if rule.value_kind == "entity" and evidence.get("resolved_entity_label") != claim["value"].get("value"):
        return EntailmentResult(VerificationState.UNGROUNDED, "entity_label_mismatch")
    if _qualifiers_contradict(rule.property_id, raw, evidence.get("qualifiers") or {}):
        return EntailmentResult(VerificationState.UNGROUNDED, "contradictory_qualifier")
    return EntailmentResult(
        VerificationState.DIRECT_GROUNDED,
        "wikidata_subject_relation_value_verified",
        source_span=f"{rule.property_id} statement {evidence['statement_id']}",
    )


_SENTENCE_RE = re.compile(r"[^\n.!?]+(?:[.!?]+(?=\s|$)|$)", re.MULTILINE)


def extract_evidence_spans(text: str) -> tuple[EvidenceSpan, ...]:
    """Deterministically segment immutable source-derived sentence spans."""
    spans: list[EvidenceSpan] = []
    for match in _SENTENCE_RE.finditer(text or ""):
        raw = match.group(0)
        left = len(raw) - len(raw.lstrip())
        cleaned = raw.strip()
        if not cleaned or len(cleaned) > MAX_EVIDENCE_SPAN_CHARS:
            continue
        start = match.start() + left
        spans.append(EvidenceSpan(cleaned, start, start + len(cleaned)))
    return tuple(spans)


def controlled_subject_aliases(
    canonical_name: str,
    canonical_title: str,
    native_identity: dict | None = None,
) -> tuple[str, ...]:
    """Exact deterministic identity aliases only; no stored search aliases."""
    aliases: list[str] = []
    for value in (
        canonical_name,
        canonical_title,
        (native_identity or {}).get("title"),
    ):
        normalized = unicodedata.normalize("NFKC", str(value or "")).strip()
        if normalized and normalized.casefold() not in {a.casefold() for a in aliases}:
            aliases.append(normalized)
    return tuple(aliases)


def _text_value(value: Any) -> str:
    if isinstance(value, dict):
        return str(value.get("value") or "").strip()
    return str(value or "").strip()


def _contains_exact(text: str, value: str) -> bool:
    return bool(value and re.search(rf"(?<!\w){re.escape(value)}(?!\w)", text, re.IGNORECASE))


def _alias_pattern(aliases: Iterable[str]) -> str:
    ordered = sorted((re.escape(alias) for alias in aliases if alias), key=len, reverse=True)
    return "(?:" + "|".join(ordered) + ")" if ordered else r"(?!)"


def _relation_entails(field: str, span: str, aliases: tuple[str, ...], value: str) -> bool:
    alias = _alias_pattern(aliases)
    val = re.escape(value)
    patterns: dict[str, tuple[str, ...]] = {
        "nationality": (rf"\b{alias}\s+(?:was|is)\s+(?:an?\s+)?{val}\b",),
        "citizenship": (
            rf"\b{alias}\s+(?:was|is)\s+(?:an?\s+)?citizen of (?:the\s+)?{val}\b",
            rf"\b{alias}\s+(?:held|holds) citizenship (?:in|of) (?:the\s+)?{val}\b",
        ),
        "gender": (rf"\b{alias}\s+(?:was|is)\s+(?:an?\s+)?{val}\b",),
        "occupations": (
            rf"\b{alias}\s+(?:was|is)\s+(?:an?\s+)?[^.;!?]{{0,100}}\b{val}\b",
        ),
        "birth_date": (rf"\b{alias}\s+was born (?:on\s+)?{val}\b",),
        "death_date": (rf"\b{alias}\s+died (?:on\s+)?{val}\b",),
        "birth_place": (rf"\b{alias}\s+was born in (?:the\s+)?{val}\b",),
        "death_place": (rf"\b{alias}\s+died in (?:the\s+)?{val}\b",),
        "native_name": (
            rf"\b{alias}(?:'s|’s) native (?:or original )?name was {val}\b",
            rf"\b{alias}\s*\(native name:\s*{val}\)",
        ),
        "birth_name": (
            rf"\b{alias}(?:'s|’s) (?:real or )?birth name was {val}\b",
            rf"\b{val} was the (?:real or )?birth name of {alias}\b",
        ),
        "pseudonyms": (
            rf"\b{alias}\s+(?:wrote|published) under the pseudonym {val}\b",
            rf"\b{alias}(?:'s|’s) pseudonym was {val}\b",
        ),
        "pen_names": (
            rf"\b{alias}\s+(?:wrote|published) under the pen name {val}\b",
            rf"\b{alias}(?:'s|’s) pen name was {val}\b",
        ),
    }
    if field == "occupations":
        ownership = re.search(
            rf"\b{alias}\s+(?:was|is)(?P<body>[^.;!?]{{0,100}})\b{val}\b",
            span, re.IGNORECASE,
        )
        if ownership and re.search(
            r"\b(?:edited|translated|narrated) by\b|\b(?:his|her|their) "
            r"(?:editor|translator|narrator|spouse)\b",
            ownership.group("body"), re.IGNORECASE,
        ):
            return False
    if field == "nationality" and re.search(
        rf"\b{val}\s+citizen\b", span, re.IGNORECASE,
    ):
        return False
    return any(re.search(pattern, span, re.IGNORECASE) for pattern in patterns.get(field, ()))


_MONTHS = (
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
)


def _text_value_variants(field: str, value: Any) -> tuple[str, ...]:
    primary = _text_value(value)
    variants = [primary] if primary else []
    if field in {"birth_date", "death_date"} and isinstance(value, dict):
        precision = value.get("precision")
        parts = primary.split("-")
        try:
            if precision == "month" and len(parts) == 2:
                variants.append(f"{_MONTHS[int(parts[1]) - 1]} {int(parts[0])}")
            elif precision == "day" and len(parts) == 3:
                month = _MONTHS[int(parts[1]) - 1]
                variants.extend((
                    f"{int(parts[2])} {month} {int(parts[0])}",
                    f"{month} {int(parts[2])}, {int(parts[0])}",
                ))
        except (ValueError, IndexError):
            pass
    return tuple(dict.fromkeys(variant for variant in variants if variant))


def verify_wikipedia_text_claim(
    claim: dict,
    *,
    target_author_id: str,
    target_qid: str,
    aliases: tuple[str, ...],
    source_text: str,
) -> EntailmentResult:
    invalid = validate_claim_envelope(
        claim, target_author_id=target_author_id, target_qid=target_qid,
    )
    if invalid:
        return invalid
    if claim.get("acquisition_method") != "WIKIPEDIA_TEXT":
        return EntailmentResult(VerificationState.UNGROUNDED, "wrong_evidence_mode")
    field = claim["field_name"]
    if TEXT_RELATIONS.get(field, object()) != EvidenceRelation(claim["relation"]):
        return EntailmentResult(VerificationState.UNGROUNDED, "text_relation_mismatch")
    span_data = claim["evidence"]["span"]
    span = span_data["text"]
    start, end = span_data["start"], span_data["end"]
    if end > len(source_text) or source_text[start:end] != span:
        return EntailmentResult(VerificationState.UNGROUNDED, "non_verbatim_evidence_span")
    values = _text_value_variants(field, claim["value"])
    alias_present = any(_contains_exact(span, alias) for alias in aliases)
    value_present = any(_contains_exact(span, value) for value in values)
    entailed_value = next(
        (value for value in values if _relation_entails(field, span, aliases, value)), None
    ) if alias_present and value_present else None
    if entailed_value:
        return EntailmentResult(
            VerificationState.DIRECT_GROUNDED,
            "wikipedia_subject_relation_value_verified",
            source_span=span, span_start=start, span_end=end,
        )
    if alias_present and value_present:
        return EntailmentResult(
            VerificationState.PARTIAL, "subject_and_value_without_explicit_relation",
            source_span=span, span_start=start, span_end=end,
        )
    return EntailmentResult(VerificationState.UNGROUNDED, "text_entailment_failed")


def logical_claim_value(value: Any) -> str:
    """Stable semantic value key for rerun/cross-source deduplication."""
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).casefold()
