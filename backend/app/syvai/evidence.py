"""Deterministic claim-level evidence verification.

For every ``SourceRef.evidence`` the model returns, we verify *before* any
proposal is persisted that the fragment genuinely comes from the trusted
source's stored citation text (``Source.citation``). This is the SyvAI 0.2C
grounding boundary: auto-approval never rests on the model's word alone.

States
------
``grounded``            fragment appears in the source text AND carries material
                        detail (a year/date, or a distinctive claim term)
``partially_grounded``  fragment appears verbatim in the source text but is
                        generic (no year and no distinctive claim term)
``ungrounded``          fragment does not appear in the source text, or is empty
                        or outside length bounds, or the source has no stored
                        text to verify against
``no_evidence``         the model returned no evidence fragment at all

This module is pure and deterministic — no LLM calls.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

GROUNDING_GROUNDED = "grounded"
GROUNDING_PARTIAL = "partially_grounded"
GROUNDING_UNGROUNDED = "ungrounded"
GROUNDING_NO_EVIDENCE = "no_evidence"

MIN_EVIDENCE_CHARS = 6
MAX_EVIDENCE_CHARS = 700

# Years in a sensible historical range; used as one material-detail signal.
_YEAR_RE = re.compile(r"(?<!\d)(?:1[0-9]{3}|20[0-2][0-9])(?!\d)")

# Punctuation is collapsed to whitespace during normalization so a fragment
# quoted verbatim still matches when the model drops a trailing period, etc.
_PUNCT = str.maketrans(
    {'.': ' ', ',': ' ', ';': ' ', ':': ' ', '"': ' ', "'": ' ', "`": ' ', '!': ' ', '?': ' '}
)

# Terms too generic to count as "material detail" anchoring a claim.
_STOPWORDS = frozenset(
    {
        "the", "and", "with", "from", "that", "this", "for", "was", "were",
        "have", "been", "had", "has", "she", "her", "his", "their", "they",
        "them", "into", "upon", "after", "before", "when", "while", "which",
        "about", "also", "where", "there", "then", "through", "one", "two",
    }
)


def normalize_evidence(text: str) -> str:
    """Casefold, strip punctuation, and collapse whitespace for matching."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.translate(_PUNCT)).strip().casefold()


def extract_detail_tokens(*texts: str) -> set[str]:
    """Distinctive terms from the claim (label + description) used to test
    whether an evidence fragment actually supports the claim rather than just
    being some text found in the source."""
    tokens: set[str] = set()
    for text in texts:
        if not text:
            continue
        for raw in re.split(r"[^A-Za-z0-9]+", text):
            token = raw.casefold()
            if len(token) >= 4 and token not in _STOPWORDS and not token.isdigit():
                tokens.add(token)
    return tokens


@dataclass(frozen=True)
class EvidenceVerification:
    state: str
    reason: str

    @property
    def is_grounded(self) -> bool:
        return self.state == GROUNDING_GROUNDED

    @property
    def is_persistable(self) -> bool:
        """Fragments we are willing to store as the verified snippet."""
        return self.state in {GROUNDING_GROUNDED, GROUNDING_PARTIAL}


def verify_evidence(
    evidence: str | None,
    citation: str | None,
    *,
    detail_tokens: set[str] | None = None,
) -> EvidenceVerification:
    """Verify a returned evidence fragment against the source's stored text."""
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
    normalized_citation = normalize_evidence(citation)
    if not normalized_fragment or normalized_fragment not in normalized_citation:
        return EvidenceVerification(
            GROUNDING_UNGROUNDED, "evidence not present in the source text"
        )

    has_year = _YEAR_RE.search(fragment) is not None
    detail_overlap = bool(detail_tokens) and any(
        token in normalized_fragment for token in detail_tokens
    )
    if has_year or detail_overlap:
        return EvidenceVerification(
            GROUNDING_GROUNDED, "evidence matches the source text with material detail"
        )
    return EvidenceVerification(
        GROUNDING_PARTIAL, "evidence matches the source text but lacks material detail"
    )
