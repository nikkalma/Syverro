import json

import pytest

from app.syvai.errors import StructuredOutputError
from app.syvai.timeline_claims import parse_timeline_claims

GOOD_EVENT = {
    "event_type": "education",
    "date_value": "1824",
    "date_precision": "year",
    "label": "Cowan Bridge school",
    "description": "Attended the Clergy Daughters' School.",
    "sources": [{"title": "Encyclopaedia Britannica", "source_type": "encyclopedia"}],
}


def test_parses_valid_object_output():
    raw = json.dumps({"events": [GOOD_EVENT]})
    claims = parse_timeline_claims(raw)
    assert len(claims) == 1
    assert claims[0].label == "Cowan Bridge school"
    assert claims[0].event_type == "education"


def test_parses_bare_array_output():
    raw = json.dumps([GOOD_EVENT])
    claims = parse_timeline_claims(raw)
    assert len(claims) == 1
    assert claims[0].date_value == "1824"


def test_strips_markdown_fence():
    raw = "```json\n" + json.dumps({"events": [GOOD_EVENT]}) + "\n```"
    claims = parse_timeline_claims(raw)
    assert len(claims) == 1


def test_rejects_non_json():
    with pytest.raises(StructuredOutputError, match="not valid JSON"):
        parse_timeline_claims("just words, no json")


def test_rejects_wrong_shape():
    with pytest.raises(StructuredOutputError, match="events"):
        parse_timeline_claims(json.dumps({"not_events": []}))


def test_rejects_malformed_claim():
    bad = dict(GOOD_EVENT)
    bad["event_type"] = "not-a-type"
    with pytest.raises(StructuredOutputError, match="schema validation"):
        parse_timeline_claims(json.dumps({"events": [bad]}))


def test_rejects_missing_required_field():
    bad = dict(GOOD_EVENT)
    del bad["label"]
    with pytest.raises(StructuredOutputError, match="schema validation"):
        parse_timeline_claims(json.dumps({"events": [bad]}))


def test_normalizes_month_year_precision():
    event = dict(GOOD_EVENT)
    event["date_precision"] = "month_year"
    claims = parse_timeline_claims(json.dumps({"events": [event]}))
    assert claims[0].date_precision == "month"
