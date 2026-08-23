"""Adversarial matrix for component-level Timeline entailment."""

import pytest

from app.syvai.timeline_claims import TimelineClaim
from app.syvai.timeline_entailment import verify_timeline_evidence
from app.syvai.evidence import (
    build_field_material_requirements,
    verify_evidence,
    verify_field_explicit_evidence,
)


def claim(**updates):
    values = {
        "event_type": "publication",
        "date_value": "1815-12",
        "date_precision": "month",
        "label": "Publication of Emma",
        "description": None,
        "place": None,
        "sources": [],
    }
    values.update(updates)
    return TimelineClaim.model_validate(values)


def verify(evidence, *, source_title="Emma (novel)", **updates):
    return verify_timeline_evidence(
        claim(**updates), evidence, evidence, source_title=source_title
    )


@pytest.mark.parametrize("label", ["Publication of Emma", "Publication of Emma"])
def test_t1_t2_work_scoped_pronoun_and_display_label_are_direct(label):
    result, components = verify(
        "The novel was first published in December 1815.", label=label
    )
    assert result.verification_state == "direct_grounded"
    assert components.subject and components.relation and components.date


def test_t3_bounded_noun_relation_is_direct_for_work_scoped_source():
    result, _ = verify("Publication followed in December 1815.")
    assert result.verification_state == "direct_grounded"


def test_t4_wrong_date_is_not_direct():
    result, components = verify("The novel was first published in December 1816.")
    assert result.verification_state == "partial"
    assert not components.date


def test_contrasting_title_page_date_does_not_ground_publication_date():
    evidence = "The novel was first published in December 1815, although the title page is dated 1816."
    result, components = verify(evidence, date_value="1816", date_precision="year")
    assert result.verification_state == "partial"
    assert not components.date


@pytest.mark.parametrize(
    "evidence,place",
    [
        ("The novel is set in Highbury. It was first published in December 1815.", "Highbury"),
        ("Jane Austen lived in Hampshire. The novel was first published in December 1815.", "Hampshire"),
    ],
)
def test_t5_t6_unrelated_place_is_not_publication_place(evidence, place):
    result, components = verify(evidence, place=place)
    assert result.verification_state == "partial"
    assert components.place is False


def test_setting_place_in_same_sentence_is_not_publication_place():
    evidence = "The novel is set in Highbury and was first published in December 1815."
    result, components = verify(evidence, place="Highbury")
    assert result.verification_state == "partial"
    assert components.place is False


def test_t7_lifespan_tokens_do_not_ground_career_relation():
    result, components = verify_timeline_evidence(
        claim(event_type="career", date_value="1775", date_precision="year", label="Career of Jane Austen"),
        "Jane Austen was born in 1775 and died in 1817.",
        "Jane Austen was born in 1775 and died in 1817.",
        source_title="Jane Austen",
    )
    assert result.verification_state == "partial"
    assert not components.relation


def test_t8_multi_work_wrong_date_cannot_cross_sentences():
    evidence = "Sense and Sensibility was first published in 1811. Emma appeared in 1815."
    result, _ = verify(evidence, date_value="1811", date_precision="year", source_title="Survey of novels")
    assert result.verification_state == "partial"


def test_t9_ambiguous_pronoun_in_multi_work_source_is_not_direct():
    evidence = "Emma and Mansfield Park were discussed together. The novel was first published in December 1815."
    result, components = verify(evidence, source_title="Austen novels")
    assert result.verification_state == "partial"
    assert not components.subject


def test_t10_no_publication_relation_is_not_direct():
    result, components = verify("Emma was completed in December 1815.")
    assert result.verification_state == "partial"
    assert not components.relation


def test_t11_wrong_work_is_not_direct():
    result, components = verify(
        "Mansfield Park was first published in December 1815.", source_title="Mansfield Park (novel)"
    )
    assert result.verification_state == "partial"
    assert not components.subject


def test_t12_invented_day_is_not_direct():
    result, components = verify(
        "The novel was first published in December 1815.",
        date_value="1815-12-01", date_precision="full",
    )
    assert result.verification_state == "partial"
    assert not components.date


def test_t13_unsupported_description_is_not_direct():
    result, components = verify(
        "The novel was first published in December 1815.",
        description="The publication transformed the English canon.",
    )
    assert result.verification_state == "partial"
    assert components.description is False


def test_t14_cyrillic_publication_entailment_is_direct():
    evidence = "Роман был впервые опубликован в декабре 1877 года."
    result, components = verify_timeline_evidence(
        claim(date_value="1877-12", label="Publication of Анна Каренина"),
        evidence,
        evidence,
        source_title="Анна Каренина (роман)",
    )
    assert result.verification_state == "direct_grounded"
    assert components.all_supported


def test_exact_jane_replay_is_direct_but_historical_place_is_not():
    evidence = "The novel was first published in December 1815, although the title page is dated 1816."
    direct, components = verify(evidence)
    unsafe, unsafe_components = verify(evidence, place="Highbury, Surrey, England")
    assert direct.verification_state == "direct_grounded"
    assert components.all_supported
    assert unsafe.verification_state == "partial"
    assert unsafe_components.place is False


def test_t15_adams_lifespan_context_does_not_ground_citizenship_interval():
    citation = "Douglas Adams (1952–2001) was an English humorist and writer."
    material = build_field_material_requirements(
        label="Citizenship", value="English", date_values=("1952", "2001")
    )
    assert not verify_evidence(citation, citation, material=material).is_grounded


def test_t16_voynich_birth_and_edition_years_do_not_ground_active_interval():
    citation = "Ethel Voynich was born in 1864. A later edition was published in 1973."
    material = build_field_material_requirements(
        label="Active years", date_values=("1864", "1973")
    )
    assert not verify_evidence(citation, citation, material=material).is_grounded


def test_t17_character_nationality_does_not_directly_ground_author_nationality():
    citation = "In the novel, a Korean character confronts political violence."
    result = verify_field_explicit_evidence("Korean", citation)
    assert not result.is_grounded
