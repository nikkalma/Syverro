"""SyvAI 0.4B — Author core fill domain contract.

The smallest generic contract shared by the IDENTITY, BIOGRAPHY and
LITERARY_CONTEXT fill consumers. One structured claim schema
(``app.syvai.field_claims.FieldClaim``), one orchestrator
(``app.syvai.core_fill.run_domain_research``), and one deterministic
field registry defined here.

A ``FieldSpec`` maps a target Author model field/entity to the domain that
may propose it, its value shape, and its human-readable contract. No new
Author model fields are invented; legacy array storage semantics are
preserved (no model migration in 0.4B).
"""

from __future__ import annotations

from dataclasses import dataclass

# Lite-version fill domains (lowercase, mirrors pipeline.DOMAIN convention).
DOMAIN_IDENTITY = "identity"
DOMAIN_BIOGRAPHY = "biography"
DOMAIN_LITERARY_CONTEXT = "literary_context"

FILL_DOMAINS = (DOMAIN_IDENTITY, DOMAIN_BIOGRAPHY, DOMAIN_LITERARY_CONTEXT)

# The registry route-domain counterpart used for the routing gate.
REGISTRY_DOMAIN = {
    DOMAIN_IDENTITY: "IDENTITY",
    DOMAIN_BIOGRAPHY: "BIOGRAPHY",
    DOMAIN_LITERARY_CONTEXT: "LITERARY_CONTEXT",
}

VALUE_TYPE_SCALAR = "scalar_text"
VALUE_TYPE_LIST = "list_text"
VALUE_TYPE_TEXT = "big_text"
VALUE_TYPE_ENTITY = "entity"

# Literary-context fields whose proposed labels are matched against the
# existing canonical ``genres`` table. Unmatched concepts stay in human
# review (Phase 4 rule: never silently create taxonomy nodes).
TAXONOMY_FIELDS = frozenset(
    {
        "literary_movements",
        "genres",
        "themes",
        "motifs",
        "concepts",
        "atmospheres",
    }
)

# SyvAI 0.6B — fields whose proposed values must be EXPLICITLY STATED in the
# trusted source text (never inferred from a proxy like name, birthplace or
# nationality). For these fields grounding may supplement the model's returned
# fragment with a deterministic explicit-statement check against the full
# stored citation. Values that are not literally present stay in human review.
# Dates/places (active_years, citizenship, residence) keep the existing
# material-detail rules and are intentionally NOT in this set.
EXPLICIT_STATEMENT_FIELDS = frozenset(
    {
        "gender",
        "languages",
        "occupations",
        "nationality",
        "native_name",
        "birth_name",
        "pen_names",
        "pseudonyms",
        "writing_languages",
    }
)


@dataclass(frozen=True)
class FieldSpec:
    domain: str
    name: str
    value_type: str
    target: str
    max_text_length: int | None = None
    min_text_length: int | None = None
    # Optional hint describing the expected value shape (rendered in prompts).
    value_hint: str | None = None


FIELD_SPECS: dict[str, FieldSpec] = {
    # --- IDENTITY ---
    "native_name": FieldSpec(
        DOMAIN_IDENTITY, "native_name", VALUE_TYPE_SCALAR,
        "Author's name in the original language (only when sources state it)",
    ),
    "birth_name": FieldSpec(
        DOMAIN_IDENTITY, "birth_name", VALUE_TYPE_SCALAR,
        "Name given at birth / legal name (only when sources state it)",
    ),
    "pen_names": FieldSpec(
        DOMAIN_IDENTITY, "pen_names", VALUE_TYPE_LIST,
        "Pen names / one entry per item (only when sources list them)",
    ),
    "pseudonyms": FieldSpec(
        DOMAIN_IDENTITY, "pseudonyms", VALUE_TYPE_LIST,
        "Pseudonyms / one entry per item (only when sources list them)",
    ),
    "nationality": FieldSpec(
        DOMAIN_IDENTITY, "nationality", VALUE_TYPE_SCALAR,
        "Nationality (never inferred from birthplace; only when stated explicitly)",
    ),
    "languages": FieldSpec(
        DOMAIN_IDENTITY, "languages", VALUE_TYPE_LIST,
        "Languages spoken or written in / one entry per item (never inferred from nationality)",
    ),
    "gender": FieldSpec(
        DOMAIN_IDENTITY, "gender", VALUE_TYPE_SCALAR,
        "Gender (never inferred from name or pronouns; omit unless stated explicitly)",
    ),
    # --- BIOGRAPHY ---
    "occupations": FieldSpec(
        DOMAIN_BIOGRAPHY, "occupations", VALUE_TYPE_LIST,
        "Occupations / one entry per item (only when stated explicitly)",
    ),
    "active_years": FieldSpec(
        DOMAIN_BIOGRAPHY, "active_years", VALUE_TYPE_ENTITY,
        "Active years (only when dates are stated in evidence)",
        value_hint='{"from_year": 1940, "to_year": 1971}',
    ),
    "bio": FieldSpec(
        DOMAIN_BIOGRAPHY, "bio", VALUE_TYPE_TEXT,
        "Short evidence-backed biographical summary (30-300 words; every claim attributed)",
        min_text_length=1, max_text_length=800,
    ),
    "citizenship": FieldSpec(
        DOMAIN_BIOGRAPHY, "citizenship", VALUE_TYPE_ENTITY,
        "Citizenship (state_name only when stated explicitly, never inferred from birthplace)",
        value_hint='{"state_name": "British", "from_date": "1940", "to_date": null}',
    ),
    "residence": FieldSpec(
        DOMAIN_BIOGRAPHY, "residence", VALUE_TYPE_ENTITY,
        "One residence (only when a source states residence; never from publication location)",
        value_hint='{"place": "London, England", "from_date": "1924", "to_date": "1939"}',
    ),
    # --- LITERARY_CONTEXT ---
    "literary_movements": FieldSpec(
        DOMAIN_LITERARY_CONTEXT, "literary_movements", VALUE_TYPE_LIST,
        "Literary movements / one entry per item (only labels stated in evidence)",
    ),
    "genres": FieldSpec(
        DOMAIN_LITERARY_CONTEXT, "genres", VALUE_TYPE_LIST,
        "Genres / one entry per item (only labels stated in evidence)",
    ),
    "themes": FieldSpec(
        DOMAIN_LITERARY_CONTEXT, "themes", VALUE_TYPE_LIST,
        "Themes / one entry per item (only labels stated in evidence)",
    ),
    "motifs": FieldSpec(
        DOMAIN_LITERARY_CONTEXT, "motifs", VALUE_TYPE_LIST,
        "Motifs / one entry per item (only labels stated in evidence)",
    ),
    "concepts": FieldSpec(
        DOMAIN_LITERARY_CONTEXT, "concepts", VALUE_TYPE_LIST,
        "Concepts / one entry per item (only labels stated in evidence)",
    ),
    "atmospheres": FieldSpec(
        DOMAIN_LITERARY_CONTEXT, "atmospheres", VALUE_TYPE_LIST,
        "Atmospheres / one entry per item (only labels stated in evidence)",
    ),
    "writing_languages": FieldSpec(
        DOMAIN_LITERARY_CONTEXT, "writing_languages", VALUE_TYPE_LIST,
        "Languages written in / one entry per item (never inferred from nationality)",
    ),
}

_SPEC_BY_DOMAIN: dict[str, tuple[FieldSpec, ...]] = {
    domain: tuple(spec for spec in FIELD_SPECS.values() if spec.domain == domain)
    for domain in FILL_DOMAINS
}


def specs_for_domain(domain: str) -> tuple[FieldSpec, ...]:
    """All target field specs belonging to one fill domain."""
    return _SPEC_BY_DOMAIN.get(domain, ())


def spec_for_field(field_name: str) -> FieldSpec | None:
    """Resolve a target field to its spec, or None when unsupported."""
    return FIELD_SPECS.get(field_name)