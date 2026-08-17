"""SyvAI 0.2E — multi-source corroboration.

Distinguishes evidence grounding (0.2D, per-source material verification) from
independent corroboration (multiple *families* of grounded sources).

Semantics (all deterministic, no provider calls):

  * LINKED       — a SourceRef matched to a trusted source row.
  * GROUNDED     — linked AND claim-level evidence verified against the stored
                   citation (0.2D material-detail gate).
  * CORROBORATED — grounded by sources from at least two *independent families*.

Family rules (conservative by design):

  * a ``source_family`` is the registrable domain of the source's canonical
    (normalized) URL;
  * known same-family domains collapse into one family (e.g. all Wikipedia /
    Wiktionary / Wikisource language mirrors collapse under ``wikipedia.org``),
    so ``en.wikipedia.org`` + ``fr.wikipedia.org`` are NOT independent;
  * an unparseable / missing URL goes into a single ``UNKNOWN_FAMILY`` bucket,
    so unparseable sources can never manufacture corroboration;
  * if independence cannot be established, the source is NOT counted as an
    additional corroborator.

Corroboration never replaces the review gate: ``AUTO_APPROVED`` still requires
verified grounding (0.2D invariant). Corroboration only refines the confidence
signal so that "more linked sources" bonus requires verified, family-distinct
grounding. Complementary-evidence synthesis (two partials combining) is OUT OF
SCOPE: partial sources never enter the independent count.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import urlparse

STATE_NONE = "none"
STATE_SINGLE_SOURCE = "single_source"
STATE_CORROBORATED = "corroborated"

UNKNOWN_FAMILY = "unknown"

# Known same-family domains: every Wikimedia project mirror collapses into one
# family. This is an explicit, deterministic whitelist — NOT an ownership graph.
WIKIMEDIA_FAMILY = "wikipedia.org"
KNOWN_SAME_FAMILY_DOMAINS = {
    "wikipedia.org": WIKIMEDIA_FAMILY,
    "wikimedia.org": WIKIMEDIA_FAMILY,
    "wikisource.org": WIKIMEDIA_FAMILY,
    "wikidata.org": WIKIMEDIA_FAMILY,
    "wiktionary.org": WIKIMEDIA_FAMILY,
    "wikiquote.org": WIKIMEDIA_FAMILY,
    "wikibooks.org": WIKIMEDIA_FAMILY,
    "wikiversity.org": WIKIMEDIA_FAMILY,
    "wikinews.org": WIKIMEDIA_FAMILY,
}


def source_family(url: str | None, normalized_url: str | None = None) -> str:
    """Return the canonical family key for a source URL.

    Conservative: an unparseable or absent URL maps to ``UNKNOWN_FAMILY`` so it
    can never be combined with another source to inflate corroboration.

    Uses the same coarse registrable-domain heuristic as the discovery layer
    (``app.syvai.discovery.urls``) without importing the network-facing package.
    """
    target = (normalized_url or url or "").strip()
    if not target:
        return UNKNOWN_FAMILY
    domain = _registrable_domain(target)
    if not domain:
        return UNKNOWN_FAMILY
    return KNOWN_SAME_FAMILY_DOMAINS.get(domain, domain)


def _registrable_domain(value: str) -> str:
    """Coarse 'source family' domain for a URL (mirrors discovery.urls).

    Only http(s) hosts are meaningful families; anything else resolves to the
    unknown bucket so it can never inflate corroboration.
    """
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return ""
    host = parsed.hostname.lower()
    if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", host) or ":" in host:
        # Raw IP literals or host:port in hostname — never a registrable family.
        return ""
    parts = host.rsplit(".", 2)
    if len(parts) < 2:
        return ""
    return ".".join(parts[-2:])


def _family_of(source) -> str:
    """Extract the family key from a source row or dict."""
    if isinstance(source, dict):
        return source_family(source.get("url"), source.get("normalized_url"))
    return source_family(
        getattr(source, "url", None),
        getattr(source, "normalized_url", None),
    )


@dataclass(frozen=True)
class Corroboration:
    """Corroboration result for one claim.

    ``linked_source_count`` is the number of trusted sources matched to the
    claim. ``grounded_source_count`` is how many of those passed the 0.2D
    material-detail gate. ``independent_grounded_source_count`` is how many
    *distinct families* those grounded sources span — the only number that may
    strengthen confidence (0.2E).
    """

    linked_source_count: int = 0
    grounded_source_count: int = 0
    independent_grounded_source_count: int = 0

    @property
    def state(self) -> str:
        if self.independent_grounded_source_count == 0:
            return STATE_NONE
        if self.independent_grounded_source_count == 1:
            return STATE_SINGLE_SOURCE
        return STATE_CORROBORATED

    def to_dict(self) -> dict:
        return {
            "state": self.state,
            "linked_source_count": self.linked_source_count,
            "grounded_source_count": self.grounded_source_count,
            "independent_grounded_source_count": self.independent_grounded_source_count,
        }


def corroborate_sources(sources: list, grounded: list[bool]) -> Corroboration:
    """Classify corroboration from a list of sources and per-source grounding.

    ``grounded`` must be aligned with ``sources`` and only the GROUNDED sources
    contribute to the independent-family count (0.2E invariant).
    """
    families: set[str] = set()
    grounded_count = 0
    for source, is_grounded in zip(sources, grounded):
        if not is_grounded:
            continue
        grounded_count += 1
        families.add(_family_of(source))
    return Corroboration(
        linked_source_count=len(sources),
        grounded_source_count=grounded_count,
        independent_grounded_source_count=len(families),
    )