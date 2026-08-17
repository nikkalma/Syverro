"""Bounded geographic research context (SyvAI 0.3E).

Geography is derived ONLY from existing structured Author fields. Free-form
prose is never scanned and unknown values never infer a country — the safe
Beta default is "no geography", which still receives GLOBAL supplementation.
"""

from __future__ import annotations

from app.syvai.registry.geography import (
    coerce_country_code,
    geographic_context,
    ordered_geo_context,
)
from app.syvai.registry.routing import author_research_domains


class _Place:
    def __init__(self, country):
        self.country = country


class _Residence:
    def __init__(self, country):
        self.place = _Place(country)


class _Citizenship:
    def __init__(self, state_name):
        self.state_name = state_name


def _author(**kwargs):
    defaults = {"name": "Author", "display_name": "Author"}
    defaults.update(kwargs)
    return type("A", (), defaults)()


def test_british_nationality_maps_to_gb():
    author = _author(nationality="British")
    assert geographic_context(author) == ("GB", "GLOBAL")


def test_legacy_country_field_supported():
    assert geographic_context(_author(country="United Kingdom")) == ("GB", "GLOBAL")


def test_birth_place_final_geographic_label_maps_to_gb():
    author = _author(birth_place="Thornton, Yorkshire, England")
    assert geographic_context(author) == ("GB", "GLOBAL")


def test_prose_is_never_scanned_for_geography():
    author = _author(bio="She travelled widely across Europe and lived in many countries.")
    assert geographic_context(author) == ("GLOBAL",)


def test_multi_geography_via_citizenships_and_places():
    author = _author(
        nationality="German",
        citizenships=[_Citizenship("United States")],
        residences=[_Residence("United States")],
    )
    assert geographic_context(
        author,
        citizenships=author.citizenships,
        residences=author.residences,
    ) == ("DE", "US", "GLOBAL")


def test_unknown_nationality_yields_only_global():
    author = _author(nationality="Japanese")
    assert geographic_context(author) == ("GLOBAL",)


def test_empty_author_yields_only_global():
    assert geographic_context(_author()) == ("GLOBAL",)


def test_coerce_country_code_exact_and_place_label():
    assert coerce_country_code("British") == "GB"
    assert coerce_country_code(" Germany ") == "DE"
    assert coerce_country_code("Berlin, Germany") == "DE"
    assert coerce_country_code("a wandering life abroad") is None
    assert coerce_country_code(None) is None
    assert coerce_country_code("") is None


def test_ordered_geo_context_places_global_last():
    assert ordered_geo_context({"US", "DE", "GLOBAL"}) == ("DE", "US", "GLOBAL")


def test_research_domains_map_to_existing_fields():
    author = _author(
        birth_date="1820-01-17",
        nationality="British",
        native_name="Anne Brontë",
        pen_names=["Acton Bell"],
        literary_movements=["Victorian literature"],
    )
    domains = author_research_domains(author)
    assert "BIOGRAPHY" in domains
    assert "IDENTITY" in domains
    assert "BIBLIOGRAPHY" not in domains


def test_research_domains_respect_domain_order():
    author = _author(
        birth_date="1820-01-17",
        notable_works=["Agnes Grey"],
        literary_movements=["Victorian literature"],
    )
    assert author_research_domains(author) == ("BIOGRAPHY", "BIBLIOGRAPHY", "LITERARY_CONTEXT")


def test_research_domains_relational_flags():
    author = _author()
    assert author_research_domains(author, has_publications=True, has_awards=True) == (
        "BIBLIOGRAPHY",
        "AWARDS",
    )