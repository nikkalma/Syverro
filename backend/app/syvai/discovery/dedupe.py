"""Lightweight deduplication and source-family independence.

Two guards keep a discovery run bounded and the candidate set non-redundant:

  * exact URL dedupe (normalized form) against both existing ``sources`` and
    candidates already accepted earlier in the same run;
  * a per-run cap on candidates from the same source family (registrable
    domain), so one authority cannot drown the review queue with sub-pages.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.syvai.discovery.urls import normalize_url, registrable_domain


@dataclass(frozen=True)
class RawCandidate:
    """A candidate as returned by a provider, before normalization.

    ``metadata_fields`` optionally carries structured metadata pulled from the
    provider's own item/metadata record (title, creator/contributor, date,
    description...). Only fields identified as author-identifying are later
    consulted for relevance; it is never a free-form injection surface.
    """

    url: str
    title: str | None = None
    source_type: str | None = None
    origin: str | None = None
    evidence: str | None = None
    metadata_fields: dict[str, str] = field(default_factory=dict)


@dataclass
class DedupeSummary:
    total: int = 0
    kept: int = 0
    dropped_unparseable: int = 0
    dropped_existing_duplicate: int = 0
    dropped_run_duplicate: int = 0
    dropped_family_cap: int = 0
    family_counts: dict[str, int] = field(default_factory=dict)


def _existing_normalized(sources: list) -> set[str]:
    """Normalize the URL of existing Source rows (backward compatible with
    rows created before ``normalized_url`` existed)."""
    existing: set[str] = set()
    for source in sources:
        url = getattr(source, "normalized_url", None) or getattr(source, "url", None)
        if url:
            normalized = normalize_url(url)
            if normalized:
                existing.add(normalized)
    return existing


def dedupe_candidates(
    candidates: list[RawCandidate],
    *,
    existing_sources: list | None = None,
    existing_normalized: set[str] | None = None,
    max_per_family: int = 2,
) -> tuple[list[RawCandidate], DedupeSummary]:
    """Filter ``candidates`` to a bounded, independent set.

    Returns the kept candidates (order preserved) and a summary of what was
    dropped and why.
    """
    if existing_normalized is None:
        existing_normalized = _existing_normalized(existing_sources or [])
    seen = set(existing_normalized)
    family_counts: dict[str, int] = {}
    summary = DedupeSummary(total=len(candidates))
    kept: list[RawCandidate] = []

    for candidate in candidates:
        normalized = normalize_url(candidate.url)
        if not normalized:
            summary.dropped_unparseable += 1
            continue
        if normalized in seen:
            if normalized in existing_normalized:
                summary.dropped_existing_duplicate += 1
            else:
                summary.dropped_run_duplicate += 1
            continue

        family = registrable_domain(normalized)
        if family_counts.get(family, 0) >= max_per_family:
            summary.dropped_family_cap += 1
            continue

        seen.add(normalized)
        family_counts[family] = family_counts.get(family, 0) + 1
        kept.append(candidate)

    summary.kept = len(kept)
    summary.family_counts = family_counts
    return kept, summary
