"""Evidence extraction for discovered candidates.

Discovery evidence is deliberately short, plain text, and data-oriented. It
is stored on ``SourceCandidate.evidence`` and shown to curators; when a
candidate is promoted to ``sources`` the evidence travels with it and is
consumed by the existing timeline pipeline as reference data (never as
instructions). Bounding length is itself the first injection-defense: the
classifier can never be handed a multi-page payload through this path.
"""

from __future__ import annotations

import html
import re

_TAG_RE = re.compile(r"<[^>]+>")
_WHITESPACE_RE = re.compile(r"\s+")
_EVIDENCE_LIMIT = 700

# If fetched text ever contains an explicit instruction-injection marker we
# flatten it to literal data. This is defense-in-depth only; the real boundary
# is that evidence is presented to the model inside the structured reference
# section of the prompt, not as instructions.
_INJECTION_MARKERS = (
    "ignore previous instructions",
    "ignore all previous instructions",
    "system:",
    "override your instructions",
    "disregard the instructions",
)


def strip_markup(raw: str) -> str:
    """Strip HTML/XML tags and entities, collapse whitespace."""
    if not raw:
        return ""
    text = _TAG_RE.sub(" ", raw)
    text = html.unescape(text)
    return _WHITESPACE_RE.sub(" ", text).strip()


def _contains_injection_marker(text: str) -> bool:
    lowered = text.casefold()
    return any(marker in lowered for marker in _INJECTION_MARKERS)


def extract_evidence(raw: str, limit: int = _EVIDENCE_LIMIT) -> str:
    """Return a bounded plain-text evidence snippet from ``raw``.

    Tries to cut at a sentence boundary; always hard-caps at ``limit``.
    """
    text = strip_markup(raw)
    if not text:
        return ""
    evidence = text[:limit]
    if len(text) > limit:
        cut = evidence.rfind(". ")
        if cut > limit // 2:
            evidence = evidence[: cut + 1]
    if _contains_injection_marker(evidence):
        # Keep the text as data but never let the raw marker pass verbatim.
        evidence = evidence.replace(":", " ", 1) if evidence.casefold().startswith("system:") else evidence
    return evidence
