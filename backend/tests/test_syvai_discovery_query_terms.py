"""Deterministic query-variant generation for discovery (offline unit tests)."""

from __future__ import annotations

from types import SimpleNamespace

from app.syvai.discovery.query_terms import (
    MAX_VARIANTS,
    normalize_name,
    search_variants,
    strip_qualifier,
)


def _author(name=None, display_name=None):
    return SimpleNamespace(name=name, display_name=display_name)


class TestNormalizeName:
    def test_nfkc_and_whitespace(self):
        assert normalize_name("  Дуглас  Адамс ") == "Дуглас Адамс"

    def test_unifies_apostrophes(self):
        # U+2019 (curly), U+02BC (modifier), U+2018, U+201B all -> ASCII '
        assert normalize_name("Л’Энгль") == "Л'Энгль"
        assert normalize_name("ЛʼЭнгль") == "Л'Энгль"
        assert normalize_name("Л‘Энгль") == "Л'Энгль"
        assert normalize_name("Л‛Энгль") == "Л'Энгль"

    def test_empty_inputs(self):
        assert normalize_name(None) == ""
        assert normalize_name("") == ""
        assert normalize_name("   ") == ""


class TestStripQualifier:
    def test_strips_editorial_qualifier(self):
        assert strip_qualifier("Дюма, Александр (отец)") == "Дюма, Александр"

    def test_strips_all_qualifiers(self):
        assert strip_qualifier("Иванов, Иван (отец) (младший)") == "Иванов, Иван"

    def test_no_qualifier_unchanged(self):
        assert strip_qualifier("Войнич, Этель Лилиан") == "Войнич, Этель Лилиан"


class TestSearchVariants:
    def test_adams_single_form(self):
        assert search_variants(_author(name="Дуглас Адамс")) == ["Дуглас Адамс"]

    def test_voynich_inversion_added(self):
        assert search_variants(_author(name="Войнич, Этель Лилиан")) == [
            "Войнич, Этель Лилиан",
            "Этель Лилиан Войнич",
        ]

    def test_dumas_pere_qualifier_chain(self):
        # Exactly the approved contract: original -> stripped -> inversion of
        # the stripped form; the qualifier never leaks into inversions.
        assert search_variants(_author(name="Дюма, Александр (отец)")) == [
            "Дюма, Александр (отец)",
            "Дюма, Александр",
            "Александр Дюма",
        ]

    def test_l_engle_apostrophe_normalized(self):
        author = _author(name="Л\u2019Энгль, Мадлен")
        assert search_variants(author) == [
            "Л'Энгль, Мадлен",
            "Мадлен Л'Энгль",
        ]

    def test_han_kang_unchanged(self):
        assert search_variants(_author(name="Хан Ган")) == ["Хан Ган"]

    def test_display_name_takes_priority(self):
        author = _author(display_name="Douglas Adams", name="Адамс, Дуглас")
        assert search_variants(author)[0] == "Douglas Adams"
        assert "Адамс, Дуглас" in search_variants(author)

    def test_bounded_and_deduplicated(self):
        author = _author(
            display_name="A, B (x)",
            name="B, A (y)",
        )
        variants = search_variants(author)
        assert len(variants) <= MAX_VARIANTS
        assert len(variants) == len(set(variants))

    def test_deterministic(self):
        author = _author(name="Дюма, Александр (отец)")
        assert search_variants(author) == search_variants(author)

    def test_no_names(self):
        assert search_variants(_author()) == []
