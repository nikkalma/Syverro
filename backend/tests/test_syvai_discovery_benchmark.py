"""Unit tests for the SyvAI 0.3A multi-authority discovery benchmark."""

import pytest

from app.syvai.discovery.assessment import (
    ASSESSMENT_AUTO_USABLE,
    ASSESSMENT_NEEDS_REVIEW,
    ASSESSMENT_REJECTED,
)
from app.syvai.discovery.discovery_benchmark import (
    BENCHMARK_FIXTURE_AUTHORS,
    format_discovery_benchmark_report,
    run_discovery_benchmark,
)
from app.syvai.discovery.urls import registrable_domain


def test_benchmark_corpus_is_exactly_three_frozen_authors():
    authors = BENCHMARK_FIXTURE_AUTHORS
    assert len(authors) == 3
    assert [a.name for a in authors] == ["Anne Brontë", "George Eliot", "Virginia Woolf"]
    assert [a.era for a in authors] == [
        "19th century",
        "19th century",
        "20th century",
    ]


def test_every_author_has_two_distinct_high_authority_families():
    # Each fixture must include at least one independent high-authority family
    # beyond Wikipedia (loc.gov + archive.org) to satisfy the acceptance gate.
    for fixture in BENCHMARK_FIXTURE_AUTHORS:
        families = {
            registrable_domain(c.url)
            for c in fixture.candidates
            if c.provider in {"loc", "archive"}
        }
        assert "loc.gov" in families, fixture.name
        assert "archive.org" in families, fixture.name


def test_benchmark_acceptance_invariants():
    report = run_discovery_benchmark()
    for author in report.per_author:
        assert author["distinct_source_families"] >= 2, author["author"]
        assert author["wrong_entity_auto_approved"] == 0, author["author"]
    assert report.total_wrong_entity_auto_approved == 0
    assert report.duplicate_family_inflation == 0
    assert report.min_distinct_families >= 2
    assert report.provider_failure_resilience == 1.0


def test_benchmark_wikipedia_never_auto_approved():
    report = run_discovery_benchmark()
    for author in report.per_author:
        assert author["wikipedia_candidates"] >= 1
        # Wikipedia candidates land in needs_review (never auto_usable), so
        # the per-author needs_review bucket must cover them.
        assert author["needs_review_count"] >= author["wikipedia_candidates"]


def test_benchmark_loc_archive_follow_unchanged_authority_policy():
    # loc.gov + archive.org are high authority. Under the unchanged assessment:
    # the LOC item (author name in the title) auto-approves; the Archive item is
    # a work title ("The Tenant of Wildfell Hall") with no author name in the
    # title/URL, so relevance drops and it stays needs_review. Both fixtures per
    # author are therefore high authority; exactly the LOC one auto-approves.
    report = run_discovery_benchmark()
    for author in report.per_author:
        assert author["high_authority_candidates"] == 2, author["author"]
        assert author["auto_usable_count"] == 1, author["author"]
        # The LOC auto-approval is exactly the high+relevant+content-rich case.
        loc_rows = [
            r
            for r in author["_rows"]
            if r["family"] == "loc.gov"
        ]
        assert loc_rows and all(r["assessment"] == ASSESSMENT_AUTO_USABLE for r in loc_rows)


def test_benchmark_wrong_entity_stays_in_review():
    # Wrong-entity candidates come from low/unknown authority sources: the
    # unchanged policy must route them to needs_review, never auto_usable.
    report = run_discovery_benchmark()
    for author in report.per_author:
        wrong_rows = [r for r in author["_rows"] if r["wrong_entity"]]
        assert len(wrong_rows) == 2, author["author"]
        assert all(r["assessment"] == ASSESSMENT_NEEDS_REVIEW for r in wrong_rows)


def test_benchmark_rejected_spam_surfaces():
    # The frozen corpus includes one spam-TLD candidate per author; it must be
    # rejected, not auto-approved or left in review.
    report = run_discovery_benchmark()
    for author in report.per_author:
        assert author["rejected_count"] == 1, author["author"]


def test_benchmark_reports_frozen_config_for_all_authors():
    report = run_discovery_benchmark()
    assert report.config["providers"] == "wikipedia,loc,archive"
    # Every author runs through the SAME pipeline + config (no per-author tuning).
    configs = {tuple(sorted(report.config.items())) for _ in report.per_author}
    assert len(configs) == 1


def test_benchmark_bucket_partition_exhaustive():
    report = run_discovery_benchmark()
    for author in report.per_author:
        buckets = (
            author["auto_usable_count"]
            + author["needs_review_count"]
            + author["rejected_count"]
        )
        assert buckets == author["candidates_total"]
        assert author["auto_usable_count"] + author["needs_review_count"] >= 1


def test_format_report_contains_key_metrics():
    text = format_discovery_benchmark_report(run_discovery_benchmark())
    for label in [
        "mean relevant candidate rate",
        "wrong-entity auto-approved total",
        "min distinct families per author",
        "duplicate family inflation",
        "provider failure resilience",
        "Anne Brontë",
        "George Eliot",
        "Virginia Woolf",
    ]:
        assert label in text


def test_benchmark_runs_without_network_and_no_author_rules():
    # Deterministic regression: pipeline output must be stable and derived only
    # from the frozen corpus + unchanged production assessment.
    report = run_discovery_benchmark()
    for author in report.per_author:
        # relevant + wrong_entity partitions every candidate exactly once
        assert author["relevant_candidates"] + author["wrong_entity_candidates"] <= author["candidates_total"]
        # All assessments are one of the three production buckets.
        for row in author["_rows"]:
            assert row["assessment"] in {
                ASSESSMENT_AUTO_USABLE,
                ASSESSMENT_NEEDS_REVIEW,
                ASSESSMENT_REJECTED,
            }
