from app.syvai.field_specs import (
    AUTHOR_FIELD_REGISTRY,
    BootstrapPolicy,
    EvidenceRelation,
    VerificationPolicy,
)


def test_native_and_birth_names_have_distinct_relations():
    assert AUTHOR_FIELD_REGISTRY["native_name"].allowed_relations == (EvidenceRelation.AUTHOR_NATIVE_NAME,)
    assert AUTHOR_FIELD_REGISTRY["birth_name"].allowed_relations == (EvidenceRelation.AUTHOR_BIRTH_NAME,)


def test_language_contracts_exclude_document_and_edition_semantics():
    spoken = AUTHOR_FIELD_REGISTRY["languages"]
    written = AUTHOR_FIELD_REGISTRY["writing_languages"]
    assert spoken.allowed_relations == (EvidenceRelation.AUTHOR_SPOKE_OR_USED_LANGUAGE,)
    assert written.allowed_relations == (EvidenceRelation.AUTHOR_WROTE_ORIGINAL_WORK_IN_LANGUAGE,)
    for policy in (spoken, written):
        assert "document language" in policy.forbidden_relations
        assert "edition language" in policy.forbidden_relations
        assert "translation language" in policy.forbidden_relations


def test_nationality_and_citizenship_are_distinct():
    assert AUTHOR_FIELD_REGISTRY["nationality"].allowed_relations != AUTHOR_FIELD_REGISTRY["citizenship"].allowed_relations
    assert AUTHOR_FIELD_REGISTRY["nationality"].storage == "Author.nationality"
    assert AUTHOR_FIELD_REGISTRY["citizenship"].storage == "AuthorCitizenship"


def test_places_residence_and_active_years_fail_closed():
    assert AUTHOR_FIELD_REGISTRY["birth_place"].allowed_relations == (EvidenceRelation.AUTHOR_BORN_IN,)
    assert AUTHOR_FIELD_REGISTRY["death_place"].allowed_relations == (EvidenceRelation.AUTHOR_DIED_IN,)
    assert AUTHOR_FIELD_REGISTRY["residence"].allowed_relations == (EvidenceRelation.AUTHOR_RESIDED_IN,)
    assert AUTHOR_FIELD_REGISTRY["active_years"].deferred
    assert "lifespan" in AUTHOR_FIELD_REGISTRY["active_years"].forbidden_relations
    assert "first/last publication" in AUTHOR_FIELD_REGISTRY["active_years"].forbidden_relations


def test_synthesis_bibliography_and_timeline_policies():
    bio = AUTHOR_FIELD_REGISTRY["bio"]
    assert bio.bootstrap_policy == BootstrapPolicy.SYNTHESIZED_REVIEW_REQUIRED
    assert bio.verification == VerificationPolicy.SYNTHESIZED_FACT_SET
    assert bio.synthesis_allowed and bio.human_review_required
    assert AUTHOR_FIELD_REGISTRY["publications"].deferred
    timeline = AUTHOR_FIELD_REGISTRY["timeline_event"]
    assert timeline.bootstrap_policy == BootstrapPolicy.TIMELINE_ENTAILMENT
    assert timeline.verification == VerificationPolicy.TIMELINE_ENTAILMENT_V1


def test_b0_fields_are_machine_readable_human_review_policies():
    for field in ("native_name", "birth_name", "pen_names", "pseudonyms", "nationality", "languages", "gender", "occupations", "writing_languages"):
        policy = AUTHOR_FIELD_REGISTRY[field]
        assert policy.bootstrap_policy == BootstrapPolicy.DIRECT_RELATION_REVIEW_REQUIRED
        assert policy.human_review_required
        assert policy.allowed_relations
