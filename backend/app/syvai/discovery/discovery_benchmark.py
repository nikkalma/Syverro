"""Multi-authority discovery benchmark — frozen, offline, deterministic.

SyvAI 0.3A objective: bounded discovery across an exact three-provider set
(Wikipedia + Library of Congress + Internet Archive) feeding the existing
dedupe/family-cap and deterministic assessment pipeline, with per-provider
failure isolation. This module measures that pipeline against a FROZEN fixture
corpus of three authors (one 19th-century, one further 19th-century, one
20th-century) using the SAME provider configuration and the SAME generic
relevance/assessment logic for every author.

No author-specific rules, provider queries, allow-list exceptions, or
thresholds exist anywhere in this benchmark. The fixtures below are the only
per-author input; the pipeline (dedupe + family cap + authority + assessment)
is the production code, unchanged.

Metric definitions (all deterministic, no provider calls):

  * candidates_total          — kept candidates after dedupe + family cap
  * relevant_candidates       — candidates whose fixture ground truth is
                                relevant to the author
  * relevant_candidate_rate   — relevant / total (reported; not a gate)
  * wrong_entity_candidates   — candidates whose fixture ground truth is a
                                different real person/entity
  * wrong_entity_auto_approved— wrong-entity candidates auto-approved. Target 0.
  * distinct_source_families  — distinct registrable domains among kept
  * wikipedia_candidates      — kept candidates from the wikipedia.org family
  * high_authority_candidates — kept candidates assessed with tier == high
  * auto_usable_count / needs_review_count / rejected_count — assessment buckets
  * human_review_rate         — needs_review / total
  * auto_usable_rate          — auto_usable / total
  * provider_failures         — providers injected as failed in this run
  * failure_resilience_outcome— "resilient" when >=2 distinct families survive
                                an injected provider failure, else "degraded"

Aggregates:

  * mean_relevant_candidate_rate
  * total_wrong_entity_auto_approved   (target 0)
  * min_distinct_families              (per-author minimum, target >= 2)
  * duplicate_family_inflation         (same-family duplicates beyond the first
                                        per family, target 0)
  * provider_failure_resilience        (fraction of authors resilient to an
                                        injected single-provider failure)

Acceptance invariants (asserted by the test suite):

  * distinct_source_families >= 2 for every fixture author;
  * wrong_entity_auto_approved == 0;
  * duplicate_family_inflation == 0;
  * no author-specific tuning (single shared pipeline + identical config);
  * at least one independent high-authority family beyond Wikipedia per author;
  * Wikipedia remains needs_review (never auto-approved);
  * LOC/Archive follow the unchanged authority assessment policy.

The benchmark is comparative regression behavior, not a claim of real-world
accuracy.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.config import settings
from app.syvai.discovery.assessment import (
    ASSESSMENT_AUTO_USABLE,
    ASSESSMENT_NEEDS_REVIEW,
    ASSESSMENT_REJECTED,
    assess_candidate,
)
from app.syvai.discovery.authority import authority_tier_for_url
from app.syvai.discovery.dedupe import RawCandidate, dedupe_candidates
from app.syvai.discovery.urls import registrable_domain

# Provider family labels used only for fixture provenance / reporting.
PROVIDER_FAMILIES = {
    "wikipedia": "wikipedia.org",
    "loc": "loc.gov",
    "archive": "archive.org",
}


@dataclass(frozen=True)
class FixtureCandidate:
    """A frozen candidate with ground truth for the benchmark.

    ``provider`` is the simulated discoverer (wikipedia/loc/archive); the URL is
    the realistic candidate the real adapter would emit. ``metadata_fields``
    optionally carries the provider's item/metadata record (creator, title,
    date) so the benchmark exercises the 0.3C enrichment assessment path.
    """

    provider: str
    url: str
    title: str | None
    source_type: str | None
    evidence: str | None
    relevant: bool
    wrong_entity: bool = False
    metadata_fields: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class AuthorFixture:
    name: str
    era: str
    candidates: list[FixtureCandidate]


# ---------------------------------------------------------------------------
# Frozen corpus — exactly three authors: Anne Brontë (19th-c), George Eliot
# (additional 19th-c), Virginia Woolf (20th-c).
# ---------------------------------------------------------------------------

BENCHMARK_FIXTURE_AUTHORS: list[AuthorFixture] = [
    AuthorFixture(
        name="Anne Brontë",
        era="19th century",
        candidates=[
            FixtureCandidate(
                provider="wikipedia",
                url="https://en.wikipedia.org/wiki/Anne_Bront%C3%AB",
                title="Anne Brontë",
                source_type="encyclopedia",
                evidence=(
                    "Anne Brontë was an English novelist and poet, the youngest member "
                    "of the Brontë literary family. She wrote Agnes Grey and The Tenant "
                    "of Wildfell Hall, and died of tuberculosis in Scarborough in 1849."
                ),
                relevant=True,
            ),
            FixtureCandidate(
                provider="loc",
                url="https://www.loc.gov/item/anne-bronte-letters/",
                title="Anne Brontë: letters and papers",
                source_type="manuscript",
                evidence=(
                    "Library of Congress holdings related to Anne Brontë, including "
                    "letters, poetry drafts, and editions of Agnes Grey and The Tenant "
                    "of Wildfell Hall."
                ),
                relevant=True,
            ),
            FixtureCandidate(
                provider="archive",
                url="https://archive.org/details/tenantofwildfellhall_anne",
                title="The Tenant of Wildfell Hall",
                source_type="text",
                evidence=(
                    "Digitized first edition of The Tenant of Wildfell Hall by Anne "
                    "Brontë (1848), scanned by an Internet Archive partner library."
                ),
                relevant=True,
            ),
            FixtureCandidate(
                provider="archive",
                url="https://anne-bronte-impersonator.blogspot.com/",
                title="An evening with the Brontës (impersonator)",
                source_type="blog",
                evidence=(
                    "Blog of a stage performer who impersonates the Brontë sisters; "
                    "the author of this content is not Anne Brontë."
                ),
                relevant=False,
                wrong_entity=True,
            ),
            FixtureCandidate(
                provider="wikipedia",
                url="https://www.example.com/anne-bronte-actress/",
                title="Anne Brontë (actress) profile",
                source_type="website",
                evidence=(
                    "Profile of a stage actress who adopted the name 'Anne Brontë'; "
                    "a different person from the novelist."
                ),
                relevant=False,
                wrong_entity=True,
            ),
            FixtureCandidate(
                provider="loc",
                url="https://anne-bronte-ebooks.xyz/welcome",
                title="Free Anne Brontë ebooks download",
                source_type="website",
                evidence=None,
                relevant=False,
                wrong_entity=False,
            ),
        ],
    ),
    AuthorFixture(
        name="George Eliot",
        era="19th century",
        candidates=[
            FixtureCandidate(
                provider="wikipedia",
                url="https://en.wikipedia.org/wiki/George_Eliot",
                title="George Eliot",
                source_type="encyclopedia",
                evidence=(
                    "Mary Ann Evans, known by her pen name George Eliot, was an "
                    "English novelist, poet, and journalist. She wrote Middlemarch "
                    "and Adam Bede."
                ),
                relevant=True,
            ),
            FixtureCandidate(
                provider="loc",
                url="https://www.loc.gov/item/george-eliot-papers/",
                title="George Eliot: manuscripts and correspondence",
                source_type="manuscript",
                evidence=(
                    "Library of Congress holdings on Mary Ann Evans (George Eliot), "
                    "including manuscript drafts and correspondence from the 1850s."
                ),
                relevant=True,
            ),
            FixtureCandidate(
                provider="archive",
                url="https://archive.org/details/middlemarchstudy0000elio",
                title="Middlemarch",
                source_type="text",
                evidence=(
                    "Digitized edition of Middlemarch by George Eliot (1871), with "
                    "prefatory matter and textual notes from a partner library scan."
                ),
                relevant=True,
            ),
            FixtureCandidate(
                provider="wikipedia",
                url="https://george-eliot-memorial.blogspot.com/",
                title="George Eliot (impersonator) tribute",
                source_type="blog",
                evidence=(
                    "A tribute blog run by a performer who impersonates George Eliot; "
                    "not the novelist's own writing."
                ),
                relevant=False,
                wrong_entity=True,
            ),
            FixtureCandidate(
                provider="archive",
                url="https://www.example.com/mary-ann-evans-botanist/",
                title="Mary Ann Evans (botanist) biography",
                source_type="website",
                evidence=(
                    "Biography of Mary Ann Evans, a 20th-century botanist; a different "
                    "person from the novelist who used the pen name George Eliot."
                ),
                relevant=False,
                wrong_entity=True,
            ),
            FixtureCandidate(
                provider="loc",
                url="https://george-eliot-ebooks.top/download",
                title="Download George Eliot ebooks",
                source_type="website",
                evidence=None,
                relevant=False,
                wrong_entity=False,
            ),
        ],
    ),
    AuthorFixture(
        name="Virginia Woolf",
        era="20th century",
        candidates=[
            FixtureCandidate(
                provider="wikipedia",
                url="https://en.wikipedia.org/wiki/Virginia_Woolf",
                title="Virginia Woolf",
                source_type="encyclopedia",
                evidence=(
                    "Adeline Virginia Woolf was an English writer, a key figure of "
                    "modernism, author of Mrs Dalloway, To the Lighthouse, and A Room "
                    "of One's Own."
                ),
                relevant=True,
            ),
            FixtureCandidate(
                provider="loc",
                url="https://www.loc.gov/item/virginia-woolf-mss/",
                title="Virginia Woolf manuscripts",
                source_type="manuscript",
                evidence=(
                    "Library of Congress manuscript holdings of Virginia Woolf, "
                    "including drafts of Mrs Dalloway and diary volumes."
                ),
                relevant=True,
            ),
            FixtureCandidate(
                provider="archive",
                url="https://archive.org/details/mrsdalloway0000wool",
                title="Mrs Dalloway",
                source_type="text",
                evidence=(
                    "Digitized edition of Mrs Dalloway by Virginia Woolf (1925), "
                    "scanned by an Internet Archive partner library."
                ),
                relevant=True,
            ),
            FixtureCandidate(
                provider="wikipedia",
                url="https://virginia-woolf-fans.blogspot.com/",
                title="Virginia Woolf (astrologer) readings",
                source_type="blog",
                evidence=(
                    "Blog of a contemporary astrologer named Virginia Woolf; a "
                    "different person from the modernist writer."
                ),
                relevant=False,
                wrong_entity=True,
            ),
            FixtureCandidate(
                provider="archive",
                url="https://www.example.com/leonard-woolf/",
                title="Leonard Woolf biography",
                source_type="website",
                evidence=(
                    "Biography of Leonard Sidney Woolf, husband of Virginia Woolf; "
                    "a different person from the subject of this discovery run."
                ),
                relevant=False,
                wrong_entity=True,
            ),
            FixtureCandidate(
                provider="loc",
                url="https://virginia-woolf-ebooks.click/download",
                title="Download Virginia Woolf books",
                source_type="website",
                evidence=None,
                relevant=False,
                wrong_entity=False,
            ),
        ],
    ),
]


# ---------------------------------------------------------------------------
# Per-author pipeline (shared, no author-specific logic)
# ---------------------------------------------------------------------------


def _run_author(
    fixture: AuthorFixture,
    *,
    injected_failure: str | None = None,
    max_per_family: int | None = None,
) -> dict:
    """Run the real discovery pipeline over one frozen fixture.

    Mirrors ``run_discovery``: fan-out per provider (a provider failure isolates
    by dropping its candidates, exactly as the service does), deterministic
    merge, dedupe + family cap, then deterministic assessment.
    """
    max_per_family = (
        max_per_family
        if max_per_family is not None
        else settings.SYVAI_DISCOVERY_MAX_PER_FAMILY
    )

    active = [
        candidate
        for candidate in fixture.candidates
        if candidate.provider != injected_failure
    ]

    raw = [
        RawCandidate(
            url=candidate.url,
            title=candidate.title,
            source_type=candidate.source_type,
            origin=f"{candidate.provider}_search",
            evidence=candidate.evidence,
            metadata_fields=candidate.metadata_fields,
        )
        for candidate in active
    ]

    kept, _summary = dedupe_candidates(raw, max_per_family=max_per_family)
    kept_urls = {k.url for k in kept}

    terms = [fixture.name]
    rows: list[dict] = []
    for candidate in fixture.candidates:
        if candidate.url not in kept_urls:
            continue
        tier = authority_tier_for_url(candidate.url)
        assessment = assess_candidate(
            url=candidate.url,
            title=candidate.title,
            evidence=candidate.evidence,
            authority_tier=tier,
            query_terms=terms,
            metadata_fields=candidate.metadata_fields,
        )
        rows.append(
            {
                "url": candidate.url,
                "provider": candidate.provider,
                "family": registrable_domain(candidate.url),
                "tier": tier,
                "assessment": assessment.assessment,
                "relevant": candidate.relevant,
                "wrong_entity": candidate.wrong_entity,
            }
        )

    total = len(rows)
    relevant = sum(1 for r in rows if r["relevant"])
    wrong_entity = [r for r in rows if r["wrong_entity"]]
    families = {r["family"] for r in rows}
    auto_usable = sum(1 for r in rows if r["assessment"] == ASSESSMENT_AUTO_USABLE)
    needs_review = sum(1 for r in rows if r["assessment"] == ASSESSMENT_NEEDS_REVIEW)
    rejected = sum(1 for r in rows if r["assessment"] == ASSESSMENT_REJECTED)
    wrong_entity_auto_approved = sum(
        1 for r in wrong_entity if r["assessment"] == ASSESSMENT_AUTO_USABLE
    )

    return {
        "author": fixture.name,
        "era": fixture.era,
        "candidates_total": total,
        "relevant_candidates": relevant,
        "relevant_candidate_rate": round(relevant / total, 4) if total else 0.0,
        "wrong_entity_candidates": len(wrong_entity),
        "wrong_entity_auto_approved": wrong_entity_auto_approved,
        "distinct_source_families": len(families),
        "wikipedia_candidates": sum(
            1 for r in rows if registrable_domain(r["url"]) == "wikipedia.org"
        ),
        "high_authority_candidates": sum(1 for r in rows if r["tier"] == "high"),
        "auto_usable_count": auto_usable,
        "needs_review_count": needs_review,
        "rejected_count": rejected,
        "human_review_rate": round(needs_review / total, 4) if total else 0.0,
        "auto_usable_rate": round(auto_usable / total, 4) if total else 0.0,
        "provider_failures": [injected_failure] if injected_failure else [],
        "failure_resilience_outcome": (
            "resilient" if len(families) >= 2 else "degraded"
        ),
        "_rows": rows,
    }


@dataclass
class DiscoveryBenchmarkReport:
    per_author: list[dict] = field(default_factory=list)
    mean_relevant_candidate_rate: float = 0.0
    total_wrong_entity_auto_approved: int = 0
    min_distinct_families: int = 0
    duplicate_family_inflation: int = 0
    provider_failure_resilience: float = 0.0
    config: dict = field(default_factory=dict)


def run_discovery_benchmark() -> DiscoveryBenchmarkReport:
    """Run the frozen corpus through the real pipeline (normal + failure runs)."""
    per_author: list[dict] = []
    inflation = 0
    resilient = 0

    for fixture in BENCHMARK_FIXTURE_AUTHORS:
        normal = _run_author(fixture)

        # Injected single-provider failure: drop the Wikipedia provider (the
        # only medium-authority family) and re-run to observe resilience.
        injected = _run_author(fixture, injected_failure="wikipedia")
        normal["provider_failures"] = injected["provider_failures"]
        normal["failure_resilience_outcome"] = injected["failure_resilience_outcome"]
        if injected["failure_resilience_outcome"] == "resilient":
            resilient += 1

        # Same-family duplicates beyond the first per family, within this author.
        author_family_counts: dict[str, int] = {}
        for row in normal["_rows"]:
            family = row["family"]
            author_family_counts[family] = author_family_counts.get(family, 0) + 1
        inflation += sum(max(0, count - 1) for count in author_family_counts.values())

        per_author.append(normal)

    mean_relevant = round(
        sum(a["relevant_candidate_rate"] for a in per_author) / len(per_author), 4
    )
    total_wrong_entity_auto = sum(
        a["wrong_entity_auto_approved"] for a in per_author
    )
    min_families = min(a["distinct_source_families"] for a in per_author)

    return DiscoveryBenchmarkReport(
        per_author=per_author,
        mean_relevant_candidate_rate=mean_relevant,
        total_wrong_entity_auto_approved=total_wrong_entity_auto,
        min_distinct_families=min_families,
        duplicate_family_inflation=inflation,
        provider_failure_resilience=round(resilient / len(per_author), 4),
        config={
            "providers": settings.SYVAI_DISCOVERY_PROVIDERS,
            "max_per_family": settings.SYVAI_DISCOVERY_MAX_PER_FAMILY,
            "max_candidates": settings.SYVAI_DISCOVERY_MAX_CANDIDATES,
        },
    )


def format_discovery_benchmark_report(report: DiscoveryBenchmarkReport) -> str:
    lines = [
        "=== Discovery benchmark: frozen multi-authority corpus ===",
        f"config: providers={report.config['providers']}, "
        f"max_per_family={report.config['max_per_family']}, "
        f"max_candidates={report.config['max_candidates']}",
        "--- per author ---",
    ]
    for a in report.per_author:
        lines.append(f"  [{a['era']}] {a['author']}")
        lines.append(
            f"    candidates_total={a['candidates_total']}, "
            f"relevant={a['relevant_candidates']} "
            f"(rate={a['relevant_candidate_rate']:.1%})"
        )
        lines.append(
            f"    wrong_entity={a['wrong_entity_candidates']} "
            f"(auto-approved={a['wrong_entity_auto_approved']})"
        )
        lines.append(
            f"    distinct_families={a['distinct_source_families']}, "
            f"wikipedia={a['wikipedia_candidates']}, high={a['high_authority_candidates']}"
        )
        lines.append(
            f"    auto_usable={a['auto_usable_count']}, "
            f"needs_review={a['needs_review_count']}, rejected={a['rejected_count']}"
        )
        lines.append(
            f"    human_review_rate={a['human_review_rate']:.1%}, "
            f"auto_usable_rate={a['auto_usable_rate']:.1%}"
        )
        lines.append(
            f"    injected_failure={a['provider_failures'] or 'none'}, "
            f"resilience={a['failure_resilience_outcome']}"
        )
    lines.append("--- aggregate ---")
    lines.append(f"mean relevant candidate rate: {report.mean_relevant_candidate_rate:.1%}")
    lines.append(
        f"wrong-entity auto-approved total: {report.total_wrong_entity_auto_approved} (target 0)"
    )
    lines.append(
        f"min distinct families per author: {report.min_distinct_families} (target >= 2)"
    )
    lines.append(
        f"duplicate family inflation: {report.duplicate_family_inflation} (target 0)"
    )
    lines.append(
        f"provider failure resilience: {report.provider_failure_resilience:.0%}"
    )
    return "\n".join(lines)


def run_discovery_benchmark_report() -> str:
    return format_discovery_benchmark_report(run_discovery_benchmark())


def main() -> None:
    print(run_discovery_benchmark_report())


if __name__ == "__main__":
    main()
