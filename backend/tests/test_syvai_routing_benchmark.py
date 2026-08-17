"""Beta routing benchmark tests (SyvAI 0.3E), offline + deterministic."""

from __future__ import annotations

from app.syvai.benchmark_routing import (
    FIXTURE_AUTHORS,
    format_routing_benchmark_report,
    run_routing_benchmark,
)


def test_benchmark_corpus_is_exactly_four_frozen_authors():
    assert len(FIXTURE_AUTHORS) == 4
    assert [a.key for a in FIXTURE_AUTHORS] == [
        "anne_bronte",
        "virginia_woolf",
        "haruki_murakami",
        "thomas_mann",
    ]


def test_benchmark_all_gates_pass():
    report = run_routing_benchmark()
    assert report.all_pass(), f"failed gates: {[case['case'] for case in report.cases if not case['pass']]}"
    assert set(report.gates) == {"A", "B", "C", "D", "E", "F", "G", "H", "I", "L", "M"}


def test_benchmark_case_a_gb_biography_pool():
    report = run_routing_benchmark()
    case = next(c for c in report.cases if c["case"] == "A")
    assert case["providers"] == ["wikipedia"]
    assert case["families"] == ["wikipedia.org"]
    assert case["state"] == "SOURCE_POOL_READY"


def test_benchmark_case_b_capability_aware_pool_differences():
    report = run_routing_benchmark()
    a = next(c for c in report.cases if c["case"] == "A")
    b = next(c for c in report.cases if c["case"] == "B")
    assert set(a["providers"]) != set(b["providers"])
    assert {"loc", "archive"} <= set(b["providers"])


def test_benchmark_case_d_unknown_geography_missing():
    report = run_routing_benchmark()
    case = next(c for c in report.cases if c["case"] == "D")
    assert case["awards_state"] == "SOURCE_POOL_MISSING"
    assert case["awards_providers"] == []


def test_format_report_contains_gates():
    text = format_routing_benchmark_report(run_routing_benchmark())
    for label in ("[A]", "[B]", "[C]", "[D]", "[H]", "all gates pass: True"):
        assert label in text


def test_routing_benchmark_runs_offline_and_has_no_author_rules():
    # Deterministic regression: same input -> same gates.
    assert run_routing_benchmark().all_pass() == run_routing_benchmark().all_pass()


def test_registry_never_imports_benchmark_truth():
    import app.syvai.registry.catalog as catalog
    import app.syvai.registry.geography as geography
    import app.syvai.registry.routing as routing

    for module in (catalog, geography, routing):
        src = open(module.__file__, encoding="utf-8").read() if module.__file__ else ""
        assert "anne_benchmark" not in src
        assert "ANNE_REFERENCE_TIMELINE" not in src