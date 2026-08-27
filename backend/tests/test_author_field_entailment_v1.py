from uuid import uuid4

import pytest

from app.syvai.author_entailment import (
    CLAIM_SCHEMA_VERSION,
    VERIFIER_VERSION,
    VerificationState,
    controlled_subject_aliases,
    extract_evidence_spans,
    normalize_wikidata_time,
    verify_wikidata_claim,
    verify_wikipedia_text_claim,
)


AUTHOR_ID = str(uuid4())
QID = "Q310732"
SOURCE_ID = str(uuid4())


def structured_claim(
    field, value, relation, property_id, raw, *, qid=QID, rank="normal",
    statement_id="Q310732$statement", qualifiers=None,
):
    return {
        "schema_version": CLAIM_SCHEMA_VERSION,
        "target_author_id": AUTHOR_ID,
        "field_name": field,
        "value": value,
        "subject": {"type": "Author", "author_id": AUTHOR_ID, "wikidata_qid": qid},
        "relation": relation,
        "source": {
            "source_id": SOURCE_ID, "wikidata_qid": qid, "property_id": property_id,
        },
        "evidence": {
            "statement_id": statement_id, "rank": rank,
            "qualifiers": qualifiers or {}, "retrieved_datavalue": raw,
            "resolved_entity_label": (
                value.get("value")
                if isinstance(value, dict) and isinstance(raw, dict) and raw.get("id")
                else None
            ),
        },
        "acquisition_method": "WIKIDATA_STRUCTURED",
        "acquisition_version": "catalog_bootstrap_acquisition_v1",
    }


def text_claim(field, value, relation, source_text, span_text=None, *, qid=QID):
    span_text = span_text or source_text
    start = source_text.index(span_text)
    return {
        "schema_version": CLAIM_SCHEMA_VERSION,
        "target_author_id": AUTHOR_ID,
        "field_name": field,
        "value": value,
        "subject": {"type": "Author", "author_id": AUTHOR_ID, "wikidata_qid": qid},
        "relation": relation,
        "source": {"source_id": SOURCE_ID, "wikidata_qid": qid},
        "evidence": {
            "span": {"text": span_text, "start": start, "end": start + len(span_text)},
        },
        "acquisition_method": "WIKIPEDIA_TEXT",
        "acquisition_version": "catalog_bootstrap_acquisition_v1",
    }


def verify_text(claim, source_text, aliases=("Ray Bradbury",)):
    return verify_wikipedia_text_claim(
        claim, target_author_id=AUTHOR_ID, target_qid=QID,
        aliases=aliases, source_text=source_text,
    )


def test_verifier_is_versioned_and_date_precision_exact():
    assert VERIFIER_VERSION == "author_field_entailment_v1"
    assert normalize_wikidata_time({"time": "+1920-00-00T00:00:00Z", "precision": 9}) == {
        "value": "1920", "precision": "year", "wikidata_precision": 9,
    }
    assert normalize_wikidata_time({"time": "+1920-08-00T00:00:00Z", "precision": 10}) == {
        "value": "1920-08", "precision": "month", "wikidata_precision": 10,
    }


@pytest.mark.parametrize("property_id,field,relation,value,raw", [
    ("P569", "birth_date", "AUTHOR_BORN_ON", {"value": "1920", "precision": "year", "wikidata_precision": 9}, {"time": "+1920-00-00T00:00:00Z", "precision": 9}),
    ("P19", "birth_place", "AUTHOR_BORN_IN", {"value": "Waukegan", "wikidata_qid": "Q486479"}, {"id": "Q486479"}),
    ("P106", "occupations", "AUTHOR_OCCUPATION", {"value": "screenwriter", "wikidata_qid": "Q28389"}, {"id": "Q28389"}),
    ("P27", "citizenship", "AUTHOR_CITIZENSHIP", {"value": "United States", "wikidata_qid": "Q30"}, {"id": "Q30"}),
    ("P1559", "native_name", "AUTHOR_NATIVE_NAME", {"value": "Рэй Брэдбери", "language": "ru"}, {"text": "Рэй Брэдбери", "language": "ru"}),
])
def test_structured_subject_relation_value_positive(property_id, field, relation, value, raw):
    result = verify_wikidata_claim(
        structured_claim(field, value, relation, property_id, raw),
        target_author_id=AUTHOR_ID, target_qid=QID,
    )
    assert result.verification_state == VerificationState.DIRECT_GROUNDED


def test_p27_entails_citizenship_but_never_nationality():
    result = verify_wikidata_claim(
        structured_claim(
            "nationality", "American", "AUTHOR_NATIONALITY", "P27", {"id": "Q30"},
        ), target_author_id=AUTHOR_ID, target_qid=QID,
    )
    assert result.verification_state == VerificationState.UNGROUNDED
    assert result.reason == "property_relation_mismatch"


def test_p742_cannot_narrow_to_pen_name_or_native_name():
    raw = {"text": "George Eliot", "language": "en"}
    for field, relation in (("pen_names", "AUTHOR_PEN_NAME"), ("native_name", "AUTHOR_NATIVE_NAME")):
        result = verify_wikidata_claim(
            structured_claim(field, {"value": "George Eliot", "language": "en"}, relation, "P742", raw),
            target_author_id=AUTHOR_ID, target_qid=QID,
        )
        assert result.verification_state == VerificationState.UNGROUNDED


@pytest.mark.parametrize("mutation,reason", [
    (lambda c: c["subject"].update(wikidata_qid="Q999"), "target_qid_mismatch"),
    (lambda c: c["source"].update(wikidata_qid="Q999"), "invalid_source_identity"),
    (lambda c: c["evidence"].update(rank="deprecated"), "deprecated_statement"),
    (lambda c: c["evidence"].update(statement_id=None), "missing_structured_reference"),
])
def test_structured_impossible_envelopes_fail_closed(mutation, reason):
    claim = structured_claim(
        "birth_date", {"value": "1920", "precision": "year", "wikidata_precision": 9},
        "AUTHOR_BORN_ON", "P569", {"time": "+1920-00-00T00:00:00Z", "precision": 9},
    )
    mutation(claim)
    result = verify_wikidata_claim(claim, target_author_id=AUTHOR_ID, target_qid=QID)
    assert result.verification_state == VerificationState.UNGROUNDED
    assert result.reason == reason


def test_structured_entity_qid_and_time_precision_must_match_exactly():
    place = verify_wikidata_claim(
        structured_claim(
            "birth_place", {"value": "Waukegan", "wikidata_qid": "Q999"},
            "AUTHOR_BORN_IN", "P19", {"id": "Q486479"},
        ), target_author_id=AUTHOR_ID, target_qid=QID,
    )
    date = verify_wikidata_claim(
        structured_claim(
            "birth_date", {"value": "1920-01-01", "precision": "day", "wikidata_precision": 11},
            "AUTHOR_BORN_ON", "P569", {"time": "+1920-00-00T00:00:00Z", "precision": 9},
        ), target_author_id=AUTHOR_ID, target_qid=QID,
    )
    assert place.reason == "structured_value_mismatch"
    assert date.reason == "structured_value_mismatch"


def test_contradictory_same_property_qualifier_fails_closed():
    qualifier = {"datavalue": {"value": {"id": "Q999"}}}
    result = verify_wikidata_claim(
        structured_claim(
            "birth_place", {"value": "Waukegan", "wikidata_qid": "Q486479"},
            "AUTHOR_BORN_IN", "P19", {"id": "Q486479"}, qualifiers={"P19": [qualifier]},
        ), target_author_id=AUTHOR_ID, target_qid=QID,
    )
    assert result.reason == "contradictory_qualifier"


def test_ray_bradbury_nationality_and_occupations_text_positive():
    text = "Ray Bradbury was an American author and screenwriter."
    cases = (
        ("nationality", "American", "AUTHOR_NATIONALITY"),
        ("occupations", "author", "AUTHOR_OCCUPATION"),
        ("occupations", "screenwriter", "AUTHOR_OCCUPATION"),
    )
    for field, value, relation in cases:
        result = verify_text(text_claim(field, value, relation, text), text)
        assert result.verification_state == VerificationState.DIRECT_GROUNDED


@pytest.mark.parametrize("text,field,value,relation", [
    ("Language: Russian.", "occupations", "Russian", "AUTHOR_OCCUPATION"),
    ("Fahrenheit 451 was published in 1953.", "birth_date", {"value": "1953", "precision": "year", "wikidata_precision": 9}, "AUTHOR_BORN_ON"),
    ("Narrated by John Smith.", "occupations", "narrator", "AUTHOR_OCCUPATION"),
    ("Рэй Брэдбери.", "native_name", "Рэй Брэдбери", "AUTHOR_NATIVE_NAME"),
    ("Fahrenheit 451 is set in Illinois.", "birth_place", "Illinois", "AUTHOR_BORN_IN"),
    ("The book was published in New York.", "death_place", "New York", "AUTHOR_DIED_IN"),
])
def test_ray_adversarial_text_never_direct_grounds(text, field, value, relation):
    result = verify_text(text_claim(field, value, relation, text), text)
    assert result.verification_state != VerificationState.DIRECT_GROUNDED


def test_document_language_label_cannot_support_author_languages():
    text = "Language: Russian."
    result = verify_text(text_claim(
        "languages", "Russian", "AUTHOR_SPOKE_OR_USED_LANGUAGE", text,
    ), text)
    assert result.verification_state == VerificationState.UNGROUNDED
    assert result.reason == "text_relation_mismatch"


def test_birth_date_and_place_text_require_event_relation_and_preserve_precision():
    text = "Ray Bradbury was born on 22 August 1920 in Waukegan."
    date = verify_text(text_claim(
        "birth_date", {"value": "1920-08-22", "precision": "day", "wikidata_precision": 11},
        "AUTHOR_BORN_ON", text,
    ), text)
    place = verify_text(text_claim("birth_place", "Waukegan", "AUTHOR_BORN_IN", text), text)
    assert date.verification_state == VerificationState.DIRECT_GROUNDED
    # The ontology intentionally requires the direct "born in" construction;
    # this span says "born on ... in" and therefore remains partial.
    assert place.verification_state == VerificationState.PARTIAL


def test_direct_birth_place_construction_is_positive():
    text = "Ray Bradbury was born in Waukegan."
    result = verify_text(text_claim(
        "birth_place", "Waukegan", "AUTHOR_BORN_IN", text,
    ), text)
    assert result.verification_state == VerificationState.DIRECT_GROUNDED


def test_citizenship_does_not_transform_into_nationality():
    text = "Ray Bradbury was a citizen of the United States."
    citizenship = verify_text(text_claim(
        "citizenship", "United States", "AUTHOR_CITIZENSHIP", text,
    ), text)
    nationality = verify_text(text_claim(
        "nationality", "American", "AUTHOR_NATIONALITY", text,
    ), text)
    assert citizenship.verification_state == VerificationState.DIRECT_GROUNDED
    assert nationality.verification_state == VerificationState.UNGROUNDED


def test_birth_name_native_name_and_pen_name_relations_stay_distinct():
    birth_text = "George Eliot's birth name was Mary Ann Evans."
    birth = verify_text(text_claim(
        "birth_name", "Mary Ann Evans", "AUTHOR_BIRTH_NAME", birth_text,
    ), birth_text, aliases=("George Eliot",))
    native = verify_text(text_claim(
        "native_name", "Mary Ann Evans", "AUTHOR_NATIVE_NAME", birth_text,
    ), birth_text, aliases=("George Eliot",))
    pen_text = "Mary Ann Evans wrote under the pen name George Eliot."
    pen = verify_text(text_claim(
        "pen_names", "George Eliot", "AUTHOR_PEN_NAME", pen_text,
    ), pen_text, aliases=("Mary Ann Evans",))
    assert birth.verification_state == VerificationState.DIRECT_GROUNDED
    assert native.verification_state == VerificationState.PARTIAL
    assert pen.verification_state == VerificationState.DIRECT_GROUNDED


def test_related_person_occupation_does_not_bind_to_target():
    text = "Ray Bradbury was an author and his editor John Smith was a screenwriter."
    result = verify_text(text_claim(
        "occupations", "screenwriter", "AUTHOR_OCCUPATION", text,
    ), text)
    assert result.verification_state != VerificationState.DIRECT_GROUNDED


def test_controlled_aliases_are_identity_only_and_deterministic():
    assert controlled_subject_aliases("Fyodor Dostoevsky", "Fyodor Dostoevsky", {
        "site": "ruwiki", "title": "Фёдор Достоевский",
    }) == ("Fyodor Dostoevsky", "Фёдор Достоевский")
    assert controlled_subject_aliases("Han Kang", "Han Kang") == ("Han Kang",)
    assert "Хан Ган" not in controlled_subject_aliases("Han Kang", "Han Kang")


@pytest.mark.parametrize("text,aliases,field,value,relation", [
    ("Jane Austen was born in Steventon.", ("Jane Austen",), "birth_place", "Steventon", "AUTHOR_BORN_IN"),
    ("Fyodor Dostoevsky was a Russian novelist.", ("Fyodor Dostoevsky", "Фёдор Достоевский"), "occupations", "novelist", "AUTHOR_OCCUPATION"),
    ("Han Kang was a South Korean author.", ("Han Kang", "한강"), "nationality", "South Korean", "AUTHOR_NATIONALITY"),
])
def test_multi_author_exact_identity_positive_controls(text, aliases, field, value, relation):
    result = verify_text(text_claim(field, value, relation, text), text, aliases=aliases)
    assert result.verification_state == VerificationState.DIRECT_GROUNDED


def test_spans_are_verbatim_bounded_and_location_stable():
    text = "Intro. Ray Bradbury was an American author and screenwriter. Next."
    spans = extract_evidence_spans(text)
    target = next(span for span in spans if "American author" in span.text)
    assert text[target.start:target.end] == target.text
    assert len(target.text) <= 500


def test_non_verbatim_or_wrong_relation_text_envelope_fails_closed():
    text = "Ray Bradbury was an American author."
    claim = text_claim("nationality", "American", "AUTHOR_NATIONALITY", text)
    claim["evidence"]["span"]["text"] = "Ray Bradbury was an Canadian author."
    assert verify_text(claim, text).reason == "non_verbatim_evidence_span"

    claim = text_claim("nationality", "American", "AUTHOR_CITIZENSHIP", text)
    assert verify_text(claim, text).reason == "field_relation_not_allowed"
