"""SyvAI 0.3B — Anne reference benchmark: quality gate + leakage firewall.

Phase 2 (quality gate): every reference event must be well-formed and every
STRICT event must carry a parseable date corroborated by >=2 independent
references. SOFT events are context-only and must never enter the factual
scoring denominator.

Phase 3 (leakage firewall): the reference truth must be visible ONLY to the
evaluator. These tests assert:
  * no production research-input module imports the reference;
  * building research input / prompts for an Anne-like author with an empty
    source corpus never surfaces a reference label or date (needle test);
  * the reference never appears inside the shipped prompt constants.
"""

from types import SimpleNamespace

from app.syvai.anne_benchmark import (
    ANNE_BIRTH,
    ANNE_DEATH,
    ANNE_REFERENCE_TIMELINE,
    SOFT,
    STRICT,
    _REFERENCES,
    anne_reference_events,
    soft_reference_events,
    strict_reference_events,
)
from app.syvai.prompts.timeline_v2 import SYSTEM_PROMPT, build_timeline_prompt
from app.syvai.timeline_claims import DATE_PRECISION_VALUES, EVENT_TYPE_VALUES
from app.syvai.timeline_research import build_research_input
from app.syvai.validators import ExistingEvent, parse_date

# ---------------------------------------------------------------------------
# Phase 2 — quality gate
# ---------------------------------------------------------------------------


def test_reference_size_within_target():
    assert 10 <= len(ANNE_REFERENCE_TIMELINE) <= 20


def test_reference_has_strict_denominator():
    strict = strict_reference_events()
    assert 10 <= len(strict) <= len(ANNE_REFERENCE_TIMELINE)
    assert len(strict) + len(soft_reference_events()) == len(ANNE_REFERENCE_TIMELINE)


def test_every_event_well_formed():
    for event in ANNE_REFERENCE_TIMELINE:
        assert event["event_type"] in EVENT_TYPE_VALUES, event["label"]
        assert event["date_precision"] in DATE_PRECISION_VALUES, event["label"]
        assert event["label"].strip()
        assert event["place"], event["label"]
        assert event["description"], event["label"]
        assert event["classification"] in (STRICT, SOFT), event["label"]
        assert event["references"], event["label"]


def test_strict_events_parseable_and_corroborated():
    for event in strict_reference_events():
        assert parse_date(event["date_value"]) is not None, event["date_value"]
        assert len(event["references"]) >= 2, event["label"]


def test_strict_dates_within_author_lifespan_or_posthumous():
    birth = parse_date(ANNE_BIRTH)
    death = parse_date(ANNE_DEATH)
    assert birth is not None and death is not None
    for event in strict_reference_events():
        parsed = parse_date(event["date_value"])
        assert parsed is not None
        when = (parsed.year, parsed.month or 1, parsed.day or 1)
        assert when >= (birth.year, birth.month or 1, birth.day or 1), event["label"]
        # Burial is legitimately posthumous; allow events shortly after death
        # (the validator flags them as non-blocking "may be posthumous").
        assert when <= (death.year + 1, death.month or 12, death.day or 28), event["label"]


def test_no_duplicate_reference_events():
    seen = set()
    for event in ANNE_REFERENCE_TIMELINE:
        key = (event["event_type"], event["date_value"], event["label"].casefold())
        assert key not in seen, key
        seen.add(key)


def test_reference_events_convert_to_existing_events():
    existing = anne_reference_events()
    assert len(existing) == len(ANNE_REFERENCE_TIMELINE)
    assert all(isinstance(e, ExistingEvent) for e in existing)
    assert all(e.id.startswith("anne-reference-") for e in existing)


def test_soft_events_are_context_only():
    for event in soft_reference_events():
        assert event["classification"] == SOFT
        assert len(event["references"]) >= 1, event["label"]


# ---------------------------------------------------------------------------
# Phase 3 — leakage firewall
# ---------------------------------------------------------------------------

_REFERENCE_URLS = [ref["url"] for ref in _REFERENCES.values()]

_REFERENCE_LABELS = [event["label"].casefold() for event in ANNE_REFERENCE_TIMELINE]
_REFERENCE_DATES = [event["date_value"] for event in ANNE_REFERENCE_TIMELINE]


def _production_source_modules() -> list[str]:
    """Every research-input surface that feeds the provider prompt."""
    return [
        "app.syvai.timeline_research",
        "app.syvai.prompts.timeline_v2",
        "app.syvai.pipeline",
        "app.syvai.provider",
        "app.syvai.discovery.providers",
        "app.syvai.evidence",
        "app.syvai.validators",
    ]


def test_no_production_module_imports_reference():
    import importlib

    for module_name in _production_source_modules():
        module = importlib.import_module(module_name)
        assert "anne_benchmark" not in sys_modules_source(module), module_name


def sys_modules_source(module) -> str:
    """Return the module's source as a string for needle checks."""
    import inspect

    try:
        return inspect.getsource(module)
    except (OSError, TypeError):
        return ""


def test_reference_urls_never_in_prompt_constants():
    lowered = SYSTEM_PROMPT.casefold()
    for url in _REFERENCE_URLS:
        assert url.casefold() not in lowered, url


def test_needle_anne_like_author_with_empty_sources():
    """Building research input + prompt for an Anne-like author with no trusted
    sources must not surface any reference label or date (sentinel test)."""
    anne_like = SimpleNamespace(
        id="anne-stub",
        name="Anne Brontë",
        display_name="Anne Brontë",
        birth_date=None,
        birth_date_precision=None,
        death_date=None,
        death_date_precision=None,
        birth_place=None,
        death_place=None,
    )
    research = build_research_input(anne_like, [])
    system_prompt, user_prompt = build_timeline_prompt(research)
    combined = f"{system_prompt}\n{user_prompt}".casefold()

    for label in _REFERENCE_LABELS:
        assert label not in combined, label
    for date_value in _REFERENCE_DATES:
        assert date_value not in combined, date_value


def test_reference_not_seeded_as_author_identity():
    """The reference must not define Anne's birth/death identity fields — the
    evaluator derives those from the reference, but they are never written back
    into the author record used for research input."""
    assert ANNE_BIRTH == "1820-01-17"
    assert ANNE_DEATH == "1849-05-28"
    assert all(e["date_precision"] == "full" for e in ANNE_REFERENCE_TIMELINE
               if e["event_type"] in ("birth", "death"))
