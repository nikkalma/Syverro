"""Deterministic component-level entailment for structured Timeline claims."""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.syvai.evidence import (
    GROUNDING_GROUNDED,
    GROUNDING_PARTIAL,
    EvidenceVerification,
    extract_detail_tokens,
    normalize_evidence,
    verify_evidence,
)
from app.syvai.timeline_claims import TimelineClaim

TIMELINE_ENTAILMENT_VERSION = "timeline_entailment_v1"

# Deliberately small, versioned, and limited to event types in TimelineClaim.
EVENT_RELATIONS_V1: dict[str, tuple[str, ...]] = {
    "publication": (
        r"\bpublish(?:ed|ing|es)?\b",
        r"\bpublication\b",
        r"\bопубликован(?:а|о|ы)?\b",
        r"\bпубликаци(?:я|и|ю|ей)\b",
    ),
    "award": (r"\baward(?:ed|s)?\b", r"\bwon\b"),
    "milestone": (r"\bmilestone\b", r"\benrolled\b"),
    "birth": (r"\bborn\b", r"\bbirth\b"),
    "death": (r"\bdied\b", r"\bdeath\b"),
    "education": (r"\bstudied\b", r"\beducated\b", r"\bgraduated\b"),
    "correspondence": (r"\bcorrespond(?:ed|ence|ing)?\b", r"\bletter(?:s)?\b"),
    "career": (r"\bcareer\b", r"\bworked\b", r"\bappointed\b"),
    "personal": (r"\bmarried\b", r"\bmarriage\b", r"\bdivorced\b"),
}

_EVENT_LABEL_PREFIXES: dict[str, tuple[str, ...]] = {
    "publication": ("publication of ", "published "),
    "award": ("award of ", "award for "),
    "milestone": ("milestone of ",),
    "birth": ("birth of ",),
    "death": ("death of ",),
    "education": ("education of ",),
    "correspondence": ("correspondence of ",),
    "career": ("career of ",),
    "personal": ("marriage of ", "personal life of "),
}

_MONTHS = (
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
)
_MONTH_FORMS = (
    ("january", "январь", "января", "январе"),
    ("february", "февраль", "февраля", "феврале"),
    ("march", "март", "марта", "марте"),
    ("april", "апрель", "апреля", "апреле"),
    ("may", "май", "мая", "мае"),
    ("june", "июнь", "июня", "июне"),
    ("july", "июль", "июля", "июле"),
    ("august", "август", "августа", "августе"),
    ("september", "сентябрь", "сентября", "сентябре"),
    ("october", "октябрь", "октября", "октябре"),
    ("november", "ноябрь", "ноября", "ноябре"),
    ("december", "декабрь", "декабря", "декабре"),
)
_WORK_DISAMBIGUATORS = frozenset({"novel", "book", "work", "play", "poem", "роман", "книга"})


@dataclass(frozen=True)
class TimelineComponentVerdicts:
    subject: bool
    relation: bool
    date: bool
    place: bool | None
    description: bool | None

    @property
    def all_supported(self) -> bool:
        return all(value is not False for value in (
            self.subject, self.relation, self.date, self.place, self.description
        ))


def _sentences(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"(?<=[.!?…])\s+|[\r\n]+", text) if part.strip()]


def _subject_from_label(claim: TimelineClaim) -> str | None:
    folded = claim.label.strip().casefold()
    for prefix in _EVENT_LABEL_PREFIXES.get(claim.event_type, ()):
        if folded.startswith(prefix):
            subject = claim.label.strip()[len(prefix):].strip(" :-–—")
            return subject or None
    if claim.event_type == "publication":
        match = re.match(r"(.+?)\s+(?:was\s+)?publish(?:ed|ing|es)\b", claim.label, re.IGNORECASE)
        if match:
            return match.group(1).strip(" :-–—") or None
    return None


def _canonical_source_subject(title: str | None) -> tuple[str | None, bool]:
    if not title:
        return None, False
    match = re.fullmatch(r"\s*(.+?)\s*\(([^()]+)\)\s*", title)
    if not match:
        return title.strip(), False
    return match.group(1).strip(), match.group(2).strip().casefold() in _WORK_DISAMBIGUATORS


def _tokens(text: str) -> set[str]:
    return set(re.findall(r"[^\W_]+", normalize_evidence(text), flags=re.UNICODE))


def _subject_supported(subject: str | None, sentence: str, source_title: str | None) -> bool:
    if not subject:
        return False
    subject_tokens = _tokens(subject)
    sentence_tokens = _tokens(sentence)
    if subject_tokens and subject_tokens.issubset(sentence_tokens):
        return True
    scoped_subject, work_scoped = _canonical_source_subject(source_title)
    return bool(
        work_scoped
        and scoped_subject
        and _tokens(scoped_subject) == subject_tokens
    )


def _relation_supported(event_type: str, sentence: str) -> bool:
    normalized = normalize_evidence(sentence)
    return any(re.search(pattern, normalized, flags=re.IGNORECASE) for pattern in EVENT_RELATIONS_V1[event_type])


def _relation_scope(event_type: str, sentence: str) -> str | None:
    """Return the contrast-bounded clause containing the event relation."""
    for clause in re.split(r"\s*(?:;|\balthough\b|\bwhereas\b|\bbut\b)\s*", sentence, flags=re.IGNORECASE):
        if _relation_supported(event_type, clause):
            return clause
    return None


def _date_supported(claim: TimelineClaim, sentence: str) -> bool:
    match = re.fullmatch(r"(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?", claim.date_value.strip())
    if not match:
        return False
    year, month_text, day_text = match.groups()
    if not re.search(rf"(?<!\d){re.escape(year)}(?!\d)", sentence):
        return False
    if claim.date_precision in {"month", "full"}:
        if not month_text or not (1 <= int(month_text) <= 12):
            return False
        month = int(month_text)
        month_supported = (
            any(form in sentence.casefold() for form in _MONTH_FORMS[month - 1])
            or bool(re.search(rf"(?<!\d){year}[-/.]0?{month}(?!\d)", sentence))
        )
        if not month_supported:
            return False
    if claim.date_precision == "full":
        if not day_text:
            return False
        day, month = int(day_text), int(month_text)
        name = _MONTHS[month - 1]
        return any(re.search(pattern, sentence, flags=re.IGNORECASE) for pattern in (
            rf"(?<!\d){day}(?:st|nd|rd|th)?\s+{name}\s+{year}(?!\d)",
            rf"{name}\s+{day}(?:st|nd|rd|th)?(?:,)?\s+{year}(?!\d)",
            rf"(?<!\d){year}[-/.]0?{month}[-/.]0?{day}(?!\d)",
        ))
    return True


def _optional_supported(value: str | None, sentence: str) -> bool | None:
    if value is None:
        return None
    required = extract_detail_tokens(value)
    return bool(required) and required.issubset(_tokens(sentence))


def _place_supported(value: str | None, event_type: str, relation_scope: str) -> bool | None:
    supported = _optional_supported(value, relation_scope)
    if supported is not True or event_type != "publication":
        return supported
    first_token = next(iter(sorted(extract_detail_tokens(value or ""))), None)
    if not first_token:
        return False
    normalized = normalize_evidence(relation_scope)
    relation_end = min(
        (match.end() for pattern in EVENT_RELATIONS_V1[event_type]
         if (match := re.search(pattern, normalized, flags=re.IGNORECASE))),
        default=-1,
    )
    place_position = normalized.find(first_token, relation_end)
    if relation_end < 0 or place_position < 0:
        return False
    between = normalized[relation_end:place_position]
    return bool(re.search(r"\b(?:in|at)\b", between))


def verify_timeline_evidence(
    claim: TimelineClaim,
    evidence: str | None,
    citation: str | None,
    *,
    source_title: str | None,
    fallback_subject: str | None = None,
) -> tuple[EvidenceVerification, TimelineComponentVerdicts]:
    """Verify all persisted Timeline components in one coherent source span."""
    provenance = verify_evidence(evidence, citation)
    empty = TimelineComponentVerdicts(False, False, False, None, None)
    if not provenance.source_span or not evidence:
        return provenance, empty

    subject = _subject_from_label(claim) or fallback_subject
    best = empty
    # Evaluate the immutable source sentence, not a model-trimmed substring;
    # the latter may omit the grammatical subject while still matching it.
    for sentence in _sentences(provenance.source_span):
        relation_scope = _relation_scope(claim.event_type, sentence)
        semantic_scope = relation_scope or sentence
        verdicts = TimelineComponentVerdicts(
            subject=_subject_supported(subject, sentence, source_title),
            relation=relation_scope is not None,
            date=_date_supported(claim, semantic_scope),
            place=_place_supported(claim.place, claim.event_type, semantic_scope),
            description=_optional_supported(claim.description, semantic_scope),
        )
        if verdicts.all_supported:
            return EvidenceVerification(
                GROUNDING_GROUNDED,
                f"{TIMELINE_ENTAILMENT_VERSION}: all persisted structured components are supported",
                provenance.source_span,
            ), verdicts
        if sum(value is True for value in verdicts.__dict__.values()) > sum(
            value is True for value in best.__dict__.values()
        ):
            best = verdicts

    missing = [name for name, value in best.__dict__.items() if value is False]
    return EvidenceVerification(
        GROUNDING_PARTIAL,
        f"{TIMELINE_ENTAILMENT_VERSION}: unsupported structured component(s): {', '.join(missing)}",
        provenance.source_span,
    ), best
