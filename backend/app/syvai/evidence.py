"""Deterministic claim-level evidence verification.

For every ``SourceRef.evidence`` the model returns, we verify *before* any
proposal is persisted that the fragment genuinely comes from the trusted
source's stored citation text (``Source.citation``). This is the SyvAI
grounding boundary: auto-approval never rests on the model's word alone.

States
------
``grounded``            fragment appears in the source text AND supports every
                        material detail the claim asserts: its own date/year,
                        its named place(s), and each named entity phrase
                        (work/person) — conjunctively. Nothing important is
                        left to a single-token "or".
``partially_grounded``  fragment appears verbatim in the source text but fails
                        to support at least one asserted material detail (or is
                        generic text with no material detail). A human must
                        review.
``ungrounded``          fragment does not appear in the source text, or is
                        empty or outside length bounds, or the source has no
                        stored text to verify against.
``no_evidence``         the model returned no evidence fragment at all.

Material detail model (author-independent, deterministic):
  * date      — the claim's OWN asserted year token must appear in the
                evidence (an unrelated year anywhere does not count).
  * place     — every significant token of the claim's place field must appear.
  * entities  — every significant token of each named entity phrase detected
                in the label/description (quoted phrases and multi-word
                capitalized runs) must appear.
  * distinct  — at least one distinctive claim token must appear, so an
                evidence fragment that only repeats a year is never enough.

Full grounding requires ALL applicable requirements to be satisfied; a
single missing material detail downgrades the claim to ``partially_grounded``
(human review) rather than full auto-approval.

This module is pure and deterministic — no LLM calls.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

GROUNDING_GROUNDED = "grounded"
GROUNDING_PARTIAL = "partially_grounded"
GROUNDING_UNGROUNDED = "ungrounded"
GROUNDING_NO_EVIDENCE = "no_evidence"

EVIDENCE_DIRECT_GROUNDED = "direct_grounded"
EVIDENCE_PARTIAL = "partial"
EVIDENCE_SYNTHETIC = "synthetic"
EVIDENCE_UNGROUNDED = "ungrounded"

PROVENANCE_DIRECT = "source_span"
PROVENANCE_SYNTHETIC = "multi_fragment"
PROVENANCE_UNVERIFIED = "unverified_model"

MIN_EVIDENCE_CHARS = 6
MAX_EVIDENCE_CHARS = 700

# Years in a sensible historical range.
_YEAR_RE = re.compile(r"(?<!\d)(?:1[0-9]{3}|20[0-2][0-9])(?!\d)")

# Punctuation is collapsed to whitespace during normalization so a fragment
# quoted verbatim still matches when the model drops a trailing period, etc.
_PUNCT = str.maketrans(
    {'.': ' ', ',': ' ', ';': ' ', ':': ' ', '"': ' ', "'": ' ', "`": ' ', '!': ' ', '?': ' '}
)

_MONTHS = frozenset(
    {
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december",
    }
)

# Generic function words (English only — never author/domain specific) that
# are not treated as material detail.
_STOPWORDS = frozenset(
    {
        "the", "and", "with", "from", "that", "this", "for", "was", "were",
        "have", "been", "had", "has", "she", "her", "his", "their", "they",
        "them", "into", "upon", "after", "before", "when", "while", "which",
        "about", "also", "where", "there", "then", "through", "one", "two",
    }
)

_SENTENCE_END_RE = re.compile(r"[.!?…]$")


def normalize_evidence(text: str) -> str:
    """Casefold, strip punctuation, and collapse whitespace for matching."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.translate(_PUNCT)).strip().casefold()


def extract_detail_tokens(*texts: str) -> set[str]:
    """Distinctive claim terms (>=4 chars, not stopwords, not numbers).

    Used as the last-resort guard that an evidence fragment supports the
    claim's own wording rather than being some unrelated text found in the
    source. Years are excluded here (handled by the date requirement).
    """
    tokens: set[str] = set()
    for text in texts:
        if not text:
            continue
        for raw in re.findall(r"[^\W_]+", text, flags=re.UNICODE):
            token = raw.casefold()
            if len(token) >= 4 and token not in _STOPWORDS and not token.isdigit():
                tokens.add(token)
    return tokens


def _significant_tokens(text: str | None, min_len: int = 3) -> frozenset[str]:
    """Significant tokens of one material phrase (place or entity)."""
    if not text:
        return frozenset()
    tokens: set[str] = set()
    for raw in re.findall(r"[^\W_]+", text, flags=re.UNICODE):
        token = raw.casefold()
        if len(token) >= min_len and token not in _STOPWORDS and not token.isdigit():
            tokens.add(token)
    return frozenset(tokens)


def _strip_word(word: str) -> str:
    return word.strip("'\"“”‘’.,;:!?()[]-–_")


def _entity_phrases(label: str, description: str | None) -> list[str]:
    """Named-entity phrases (works, persons, places-as-subject).

    Detects quoted spans and runs of consecutive capitalized words (proper
    nouns), skipping the first word of a sentence and month names so ordinary
    prose capitalization does not count as a material entity. Single-word runs
    are dropped; the claim's distinctive-token guard still catches them.

    Label and description are scanned separately so a capitalized run never
    merges across the label/description boundary (e.g. a work title followed
    by a sentence-initial name must not become one spurious entity phrase).
    """
    texts = [text for text in (label, description) if text]
    phrases: list[str] = []
    for text in texts:
        phrases.extend(match.group(1) for match in re.finditer(r"['\"]([^'\"]{2,})['\"]", text))
        words = re.split(r"\s+", text.strip()) if text.strip() else []
        current: list[str] = []
        sentence_start = True
        for word in words:
            bare = _strip_word(word)
            capitalized = (
                len(bare) > 1
                and bare[0].isupper()
                and bare.casefold() not in _MONTHS
            )
            if sentence_start:
                capitalized = False
            if capitalized:
                current.append(bare)
            else:
                if len(current) >= 2:
                    phrases.append(" ".join(current))
                current = []
            sentence_start = bool(_SENTENCE_END_RE.search(word))
        if len(current) >= 2:
            phrases.append(" ".join(current))
    return phrases


@dataclass(frozen=True)
class MaterialRequirements:
    """The smallest set of concrete details a claim asserts and that an
    evidence fragment must support for full grounding."""

    year: str | None = None
    extra_years: frozenset[str] = frozenset()
    place_tokens: frozenset[str] = frozenset()
    entity_tokens: frozenset[str] = frozenset()
    distinctive_tokens: frozenset[str] = frozenset()
    structured: bool = False


def build_material_requirements(
    *,
    label: str,
    description: str | None = None,
    place: str | None = None,
    date_value: str | None = None,
) -> MaterialRequirements:
    """Derive the material-detail requirements for one timeline claim."""
    year = None
    if date_value:
        match = _YEAR_RE.search(date_value)
        year = match.group(0) if match else None

    entity_tokens = frozenset()
    for phrase in _entity_phrases(label, description):
        entity_tokens |= _significant_tokens(phrase, min_len=3)

    return MaterialRequirements(
        year=year,
        place_tokens=_significant_tokens(place, min_len=3),
        entity_tokens=entity_tokens,
        distinctive_tokens=frozenset(extract_detail_tokens(label, description or "", place or "")),
    )


def build_field_material_requirements(
    *,
    label: str | None,
    description: str | None = None,
    value: str | None = None,
    place: str | None = None,
    date_values: tuple[str | None, str | None] | None = None,
) -> MaterialRequirements:
    """Derive material-detail requirements for a 0.4B field claim.

    Extends the timeline material model for the new value kinds:

      * ``value``      — the proposed field value contributes identity /
                         occupation / movement / name tokens;
      * ``date_values``— up to two asserted date values (e.g. active years,
                         citizenship/residence from/to dates) contribute
                         ``extra_years`` so both bounds must appear in the
                         evidence;
      * ``place``      — residence places contribute place tokens.

    Deterministic and author-independent; no provider calls.
    """
    primary_date = date_values[0] if date_values and date_values[0] else None
    material = build_material_requirements(
        label=label or "",
        description=description,
        place=place,
        date_value=primary_date,
    )

    extra_years: set[str] = set()
    if date_values:
        for date_value in date_values:
            if not date_value:
                continue
            match = _YEAR_RE.search(date_value)
            if match:
                extra_years.add(match.group(0))
    if material.year and material.year in extra_years:
        extra_years.discard(material.year)

    entity_tokens = material.entity_tokens
    distinctive_tokens = set(material.distinctive_tokens)
    if value:
        entity_tokens = entity_tokens | _significant_tokens(value, min_len=3)
        distinctive_tokens |= extract_detail_tokens(value)

    return MaterialRequirements(
        year=material.year,
        extra_years=frozenset(extra_years),
        place_tokens=material.place_tokens,
        entity_tokens=entity_tokens,
        distinctive_tokens=frozenset(distinctive_tokens),
        structured=date_values is not None,
    )


def _missing_tokens(tokens: frozenset[str], normalized_fragment: str) -> set[str]:
    return {token for token in tokens if not _token_in_text(token, normalized_fragment)}


@dataclass(frozen=True)
class EvidenceVerification:
    state: str
    reason: str
    source_span: str | None = None

    @property
    def is_grounded(self) -> bool:
        return self.state == GROUNDING_GROUNDED

    @property
    def is_persistable(self) -> bool:
        """Only source-derived spans may be persisted as evidence."""
        return bool(self.source_span) and self.state in {
            GROUNDING_GROUNDED,
            GROUNDING_PARTIAL,
        }

    @property
    def verification_state(self) -> str:
        if self.state == GROUNDING_GROUNDED:
            return EVIDENCE_DIRECT_GROUNDED
        if self.state == GROUNDING_PARTIAL:
            return EVIDENCE_PARTIAL
        return EVIDENCE_UNGROUNDED


def _source_span(fragment: str, citation: str) -> str | None:
    """Return exact immutable source text containing a normalized fragment."""
    target = normalize_evidence(fragment)
    if not target:
        return None
    spans = [part.strip() for part in re.split(r"(?<=[.!?…])\s+|[\r\n]+", citation)]
    for span in spans:
        if target in normalize_evidence(span):
            return span
    return citation.strip() if target in normalize_evidence(citation) else None


def _token_in_text(token: str, text: str) -> bool:
    return token in set(re.findall(r"[^\W_]+", text.casefold(), flags=re.UNICODE))


def verify_evidence(
    evidence: str | None,
    citation: str | None,
    *,
    material: MaterialRequirements | None = None,
) -> EvidenceVerification:
    """Verify a returned evidence fragment against the source's stored text.

    ``material`` carries the claim's material-detail requirements (produced by
    ``build_material_requirements``). If omitted, generic fragments that merely
    quote the source cannot qualify as fully grounded.
    """
    if not evidence or not evidence.strip():
        return EvidenceVerification(GROUNDING_NO_EVIDENCE, "no evidence fragment returned")

    fragment = evidence.strip()
    if len(fragment) < MIN_EVIDENCE_CHARS:
        return EvidenceVerification(
            GROUNDING_UNGROUNDED, "evidence fragment too short to verify"
        )
    if len(fragment) > MAX_EVIDENCE_CHARS:
        return EvidenceVerification(
            GROUNDING_UNGROUNDED, "evidence fragment exceeds maximum length"
        )
    if not citation or not citation.strip():
        return EvidenceVerification(
            GROUNDING_UNGROUNDED, "source text unavailable for verification"
        )

    normalized_fragment = normalize_evidence(fragment)
    source_span = _source_span(fragment, citation)
    if not normalized_fragment or not source_span:
        return EvidenceVerification(
            GROUNDING_UNGROUNDED, "evidence not present in the source text"
        )

    material = material if material is not None else MaterialRequirements()
    missing: list[str] = []

    if material.year and not _token_in_text(material.year, normalized_fragment):
        missing.append(f"claim year {material.year}")

    if material.extra_years:
        absent_years = sorted(year for year in material.extra_years if not _token_in_text(year, normalized_fragment))
        if absent_years:
            missing.append("date detail: " + ", ".join(absent_years))

    if material.place_tokens:
        absent_place = sorted(_missing_tokens(material.place_tokens, normalized_fragment))
        if absent_place:
            missing.append("place detail: " + ", ".join(absent_place))

    if material.entity_tokens:
        absent_entities = sorted(_missing_tokens(material.entity_tokens, normalized_fragment))
        if absent_entities:
            missing.append("named detail: " + ", ".join(absent_entities))

    if material.distinctive_tokens and not any(
        _token_in_text(token, normalized_fragment) for token in material.distinctive_tokens
    ):
        missing.append("distinctive claim detail")

    requirements_exist = bool(
        material.year
        or material.extra_years
        or material.place_tokens
        or material.entity_tokens
        or material.distinctive_tokens
    )

    if not requirements_exist:
        return EvidenceVerification(
            GROUNDING_PARTIAL, "evidence matches the source text but supports no material detail", source_span
        )
    if missing:
        return EvidenceVerification(
            GROUNDING_PARTIAL,
            "evidence matches the source text but leaves material detail unsupported: "
            + "; ".join(missing),
            source_span,
        )
    # Multiple dates or a place/date combination are structured assertions.
    # Lexical co-occurrence cannot prove their semantic relationship.
    if material.structured:
        return EvidenceVerification(
            GROUNDING_PARTIAL,
            "structured claim requires semantic review; lexical co-occurrence is insufficient",
            source_span,
        )
    return EvidenceVerification(
        GROUNDING_GROUNDED, "evidence supports all asserted material details", source_span
    )


def verify_field_explicit_evidence(
    value: str | None,
    citation: str | None,
) -> EvidenceVerification:
    """Deterministic explicit-statement check for Phase 2 fields.

    A proposed value is grounded for a source only when EVERY material token of
    the value appears in the source's FULL stored citation text. This is a
    stricter, value-level replacement for the fragment-based check: it never
    infers a value from a proxy (name, birthplace, nationality) — the value must
    be literally present in the trusted source text. Used only for fields in
    ``EXPLICIT_STATEMENT_FIELDS`` and only when fragment grounding failed.
    """
    if not value or not value.strip():
        return EvidenceVerification(GROUNDING_UNGROUNDED, "no claim value to verify")
    if not citation or not citation.strip():
        return EvidenceVerification(
            GROUNDING_UNGROUNDED, "source text unavailable for verification"
        )

    normalized_citation = normalize_evidence(citation)
    required = _significant_tokens(value, min_len=3)
    if not required:
        return EvidenceVerification(
            GROUNDING_UNGROUNDED, "value has no material tokens to verify"
        )

    missing = sorted(token for token in required if not _token_in_text(token, normalized_citation))
    if missing:
        return EvidenceVerification(
            GROUNDING_UNGROUNDED,
            "value not explicitly stated in the source text: " + ", ".join(missing),
        )
    # A fallback may locate supporting source text for human review, but it
    # cannot prove the semantics of a field that the model quote failed to
    # establish. Persist the actual source sentence, never the model quote.
    supporting_span = next(
        (
            span.strip()
            for span in re.split(r"(?<=[.!?…])\s+|[\r\n]+", citation)
            if all(_token_in_text(token, normalize_evidence(span)) for token in required)
        ),
        None,
    )
    if not supporting_span:
        return EvidenceVerification(
            GROUNDING_UNGROUNDED, "value tokens do not occur in one source span"
        )
    return EvidenceVerification(
        GROUNDING_PARTIAL,
        "value occurs in a source-derived span but field semantics require human review",
        supporting_span,
    )
