"""Deterministic query-variant generation for source discovery.

Editorial canonical names (Russian, inverted order, parenthesized qualifiers)
are not search strings. This module turns an author's stored name forms into a
bounded, ordered set of normalized query variants that every provider and the
ru.wikipedia identity bootstrap consume verbatim.

Pure functions only: no I/O, no network, no LLM, no author-specific rules.
The same author always produces the same variants.
"""

from __future__ import annotations

import re
import unicodedata

# Curly/modifier apostrophes unified to ASCII ' so "Л’Энгль" and "Л'Энгль"
# are the same string internally (matching, dedupe). External surfaces still
# need both spellings: MediaWiki exact-title lookup does NOT unify these
# families and ru titles canonically use ’ ("Л’Энгль, Мадлен").
_APOSTROPHE_CHARS = {"\u2019", "\u02bc", "\u2018", "\u201b"}

# Both spellings emitted for every variant containing an apostrophe.
_APOSTROPHE_FORMS = ("'", "\u2019")

# Editorial qualifiers such as "(отец)" / "(сын)" are search noise; they are
# stripped for SEARCH VARIANTS only and never mutate canonical data.
_QUALIFIER_RE = re.compile(r"\s*\([^()]*\)")

# Hard bound on generated variants (provider fan-out multiplies by this).
MAX_VARIANTS = 4


def normalize_name(raw: str | None) -> str:
    """NFKC-normalize, unify apostrophes, collapse whitespace."""
    if not raw or not isinstance(raw, str):
        return ""
    text = unicodedata.normalize("NFKC", raw)
    text = "".join("'" if ch in _APOSTROPHE_CHARS else ch for ch in text)
    return " ".join(text.split()).strip()


def strip_qualifier(text: str) -> str:
    """Remove every parenthetical qualifier ("Дюма, Александр (отец)" ->
    "Дюма, Александр"). Search-only transform; input must already be normalized."""
    if not text:
        return ""
    return " ".join(_QUALIFIER_RE.sub("", text).split()).strip()


def _inverted(text: str) -> str:
    """Swap the first comma segment to natural order ("Войнич, Этель" ->
    "Этель Войнич"). Empty when no clean two-part inversion exists."""
    if "," not in text:
        return ""
    last, _, rest = text.partition(",")
    last = last.strip()
    rest = rest.strip()
    if not last or not rest:
        return ""
    return f"{rest} {last}"


def _apostrophe_forms(text: str) -> list[str]:
    """Emit a variant in every apostrophe spelling ("Л'Энгль" ->
    ["Л'Энгль", "Л’Энгль"]). Identity when no apostrophe is present."""
    if "'" not in text:
        return [text]
    return [text.replace("'", form) for form in _APOSTROPHE_FORMS]


def search_variants(author) -> list[str]:
    """Ordered, deduplicated, bounded query variants for one author.

    Order mirrors ``_author_query_terms`` priority (display_name first, then
    name); for each base form: normalized form, then qualifier-stripped form,
    then natural-order inversion of the stripped form. Every variant that
    contains an apostrophe is finally expanded to both spellings, so the
    editorial ’ form survives normalization for exact-title lookups.
    """
    bases: list[str] = []
    for name in (getattr(author, "display_name", None), getattr(author, "name", None)):
        normalized = normalize_name(name)
        if normalized and normalized not in bases:
            bases.append(normalized)

    variants: list[str] = list(bases)
    for base in bases:
        stripped = strip_qualifier(base)
        if stripped and stripped != base and stripped not in variants:
            variants.append(stripped)
        inverted = _inverted(stripped)
        if inverted and inverted not in variants:
            variants.append(inverted)

    expanded: list[str] = []
    for variant in variants:
        for form in _apostrophe_forms(variant):
            if form not in expanded:
                expanded.append(form)

    return expanded[:MAX_VARIANTS]
