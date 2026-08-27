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
from enum import StrEnum

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

# B0 safety gate: these Author properties do not yet have deterministic
# subject + relation + value entailment. Lexical value occurrence may support
# a proposal for human review, but must never authorize auto-approval.
SEMANTIC_REVIEW_REQUIRED_FIELDS = frozenset(
    {
        "native_name",
        "birth_name",
        "pen_names",
        "pseudonyms",
        "nationality",
        "languages",
        "gender",
        "occupations",
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


class BootstrapPolicy(StrEnum):
    PRESERVE_EXISTING = "preserve_existing"
    DETERMINISTIC = "deterministic"
    DIRECT_RELATION_REVIEW_REQUIRED = "direct_relation_review_required"
    SYNTHESIZED_REVIEW_REQUIRED = "synthesized_review_required"
    TIMELINE_ENTAILMENT = "timeline_entailment_v1"
    DEFERRED = "deferred"


class EvidenceRelation(StrEnum):
    AUTHOR_CANONICAL_NAME = "AUTHOR_CANONICAL_NAME"
    AUTHOR_NATIVE_NAME = "AUTHOR_NATIVE_NAME"
    AUTHOR_BIRTH_NAME = "AUTHOR_BIRTH_NAME"
    AUTHOR_PEN_NAME = "AUTHOR_PEN_NAME"
    AUTHOR_PSEUDONYM = "AUTHOR_PSEUDONYM"
    AUTHOR_NATIONALITY = "AUTHOR_NATIONALITY"
    AUTHOR_CITIZENSHIP = "AUTHOR_CITIZENSHIP"
    AUTHOR_SPOKE_OR_USED_LANGUAGE = "AUTHOR_SPOKE_OR_USED_LANGUAGE"
    AUTHOR_WROTE_ORIGINAL_WORK_IN_LANGUAGE = "AUTHOR_WROTE_ORIGINAL_WORK_IN_LANGUAGE"
    AUTHOR_GENDER = "AUTHOR_GENDER"
    AUTHOR_OCCUPATION = "AUTHOR_OCCUPATION"
    AUTHOR_BORN_ON = "AUTHOR_BORN_ON"
    AUTHOR_DIED_ON = "AUTHOR_DIED_ON"
    AUTHOR_BORN_IN = "AUTHOR_BORN_IN"
    AUTHOR_DIED_IN = "AUTHOR_DIED_IN"
    AUTHOR_RESIDED_IN = "AUTHOR_RESIDED_IN"
    AUTHOR_ACTIVE_DURING = "AUTHOR_ACTIVE_DURING"
    VERIFIED_AUTHOR_FACT_SET = "VERIFIED_AUTHOR_FACT_SET"
    TIMELINE_EVENT = "TIMELINE_EVENT"


class VerificationPolicy(StrEnum):
    DETERMINISTIC = "deterministic"
    AUTHOR_FIELD_ENTAILMENT_V1 = "author_field_entailment_v1_required"
    SYNTHESIZED_FACT_SET = "verified_fact_set_review_required"
    TIMELINE_ENTAILMENT_V1 = "timeline_entailment_v1"
    DEFERRED = "deferred"


@dataclass(frozen=True)
class AuthorFieldPolicy:
    name: str
    definition: str
    storage: str
    value_type: str
    bootstrap_policy: BootstrapPolicy
    allowed_relations: tuple[EvidenceRelation, ...] = ()
    verification: VerificationPolicy = VerificationPolicy.DEFERRED
    apply_destination: str = "deferred"
    human_review_required: bool = False
    deterministic: bool = False
    synthesis_allowed: bool = False
    forbidden_relations: tuple[str, ...] = ()

    @property
    def deferred(self) -> bool:
        return self.bootstrap_policy == BootstrapPolicy.DEFERRED


def _policy(name, definition, storage, value_type, policy, relations=(), verification=VerificationPolicy.AUTHOR_FIELD_ENTAILMENT_V1, apply="deferred", review=False, deterministic=False, synthesis=False, forbidden=()):
    return AuthorFieldPolicy(name, definition, storage, value_type, policy, relations, verification, apply, review, deterministic, synthesis, forbidden)


# Authoritative, machine-readable Bootstrap contract. Existing Research Fill
# specs above remain runtime-compatible views for their three current domains.
AUTHOR_FIELD_REGISTRY: dict[str, AuthorFieldPolicy] = {
    "name": _policy("name", "Stable catalog-facing canonical Author name; not necessarily native-script.", "Author.name", VALUE_TYPE_SCALAR, BootstrapPolicy.PRESERVE_EXISTING, (EvidenceRelation.AUTHOR_CANONICAL_NAME,), apply="Author.name", review=True, forbidden=("localized label", "related-person name")),
    "native_name": _policy("native_name", "Explicitly established original/native-script name.", "Author.native_name", VALUE_TYPE_SCALAR, BootstrapPolicy.DIRECT_RELATION_REVIEW_REQUIRED, (EvidenceRelation.AUTHOR_NATIVE_NAME,), apply="Author.native_name", review=True, forbidden=("localized label", "birth name", "legal name", "pseudonym")),
    "birth_name": _policy("birth_name", "Name explicitly documented as assigned at birth or legal birth name.", "Author.birth_name", VALUE_TYPE_SCALAR, BootstrapPolicy.DIRECT_RELATION_REVIEW_REQUIRED, (EvidenceRelation.AUTHOR_BIRTH_NAME,), apply="Author.birth_name", review=True, forbidden=("native name", "pen name")),
    "pen_names": _policy("pen_names", "Names deliberately used by the Author for authorship.", "Author.pen_names", VALUE_TYPE_LIST, BootstrapPolicy.DIRECT_RELATION_REVIEW_REQUIRED, (EvidenceRelation.AUTHOR_PEN_NAME,), apply="Author.pen_names merge", review=True),
    "pseudonyms": _policy("pseudonyms", "Non-primary assumed names; ambiguous pen-name relationships require review or omission.", "Author.pseudonyms", VALUE_TYPE_LIST, BootstrapPolicy.DIRECT_RELATION_REVIEW_REQUIRED, (EvidenceRelation.AUTHOR_PSEUDONYM,), apply="Author.pseudonyms merge", review=True),
    "sort_name": _policy("sort_name", "Deterministic catalog sorting key.", "Author.sort_name", VALUE_TYPE_SCALAR, BootstrapPolicy.DETERMINISTIC, verification=VerificationPolicy.DETERMINISTIC, apply="Author.sort_name if empty", deterministic=True),
    "slug": _policy("slug", "Stable URL identifier derived from canonical catalog identity.", "Author.slug", VALUE_TYPE_SCALAR, BootstrapPolicy.DETERMINISTIC, verification=VerificationPolicy.DETERMINISTIC, apply="Author.slug if empty", deterministic=True),
    "nationality": _policy("nationality", "Explicit national identity associated with the Author.", "Author.nationality", VALUE_TYPE_SCALAR, BootstrapPolicy.DIRECT_RELATION_REVIEW_REQUIRED, (EvidenceRelation.AUTHOR_NATIONALITY,), apply="Author.nationality", review=True, forbidden=("birthplace", "residence", "publication country", "document country", "language", "citizenship unless explicitly equated")),
    "citizenship": _policy("citizenship", "Explicit legal citizenship/state membership, optionally time-bounded.", "AuthorCitizenship", VALUE_TYPE_ENTITY, BootstrapPolicy.DIRECT_RELATION_REVIEW_REQUIRED, (EvidenceRelation.AUTHOR_CITIZENSHIP,), apply="AuthorCitizenship", review=True, forbidden=("nationality", "birthplace", "publication country")),
    "languages": _policy("languages", "Languages explicitly spoken or personally used by the Author.", "Author.languages", VALUE_TYPE_LIST, BootstrapPolicy.DIRECT_RELATION_REVIEW_REQUIRED, (EvidenceRelation.AUTHOR_SPOKE_OR_USED_LANGUAGE,), apply="Author.languages merge", review=True, forbidden=("document language", "edition language", "translation language", "narration language", "UI language", "localized title language")),
    "writing_languages": _policy("writing_languages", "Languages in which the Author explicitly authored original work.", "Author.writing_languages", VALUE_TYPE_LIST, BootstrapPolicy.DIRECT_RELATION_REVIEW_REQUIRED, (EvidenceRelation.AUTHOR_WROTE_ORIGINAL_WORK_IN_LANGUAGE,), apply="Author.writing_languages merge", review=True, forbidden=("document language", "edition language", "translation language")),
    "gender": _policy("gender", "Explicitly stated gender classification.", "Author.gender", VALUE_TYPE_SCALAR, BootstrapPolicy.DIRECT_RELATION_REVIEW_REQUIRED, (EvidenceRelation.AUTHOR_GENDER,), apply="Author.gender", review=True, forbidden=("name", "pronouns alone", "title", "grammatical gender", "image")),
    "occupations": _policy("occupations", "Occupations or professional roles explicitly held by the target Author.", "Author.occupations", VALUE_TYPE_LIST, BootstrapPolicy.DIRECT_RELATION_REVIEW_REQUIRED, (EvidenceRelation.AUTHOR_OCCUPATION,), apply="Author.occupations merge", review=True, forbidden=("narrator", "translator", "editor", "publisher", "related-person occupation")),
    "birth_date": _policy("birth_date", "Actual Author birth date retaining source precision.", "Author.birth_date/birth_year/birth_date_precision", VALUE_TYPE_ENTITY, BootstrapPolicy.DIRECT_RELATION_REVIEW_REQUIRED, (EvidenceRelation.AUTHOR_BORN_ON,), apply="Author birth date fields", review=True, forbidden=("publication date", "January 1 normalization")),
    "death_date": _policy("death_date", "Actual Author death date retaining source precision.", "Author.death_date/death_year/death_date_precision", VALUE_TYPE_ENTITY, BootstrapPolicy.DIRECT_RELATION_REVIEW_REQUIRED, (EvidenceRelation.AUTHOR_DIED_ON,), apply="Author death date fields", review=True, forbidden=("publication date", "January 1 normalization")),
    "birth_place": _policy("birth_place", "Actual place of Author birth.", "Author.birth_place/birth_place_id", VALUE_TYPE_ENTITY, BootstrapPolicy.DIRECT_RELATION_REVIEW_REQUIRED, (EvidenceRelation.AUTHOR_BORN_IN,), apply="Author birth place fields", review=True, forbidden=("residence", "work setting", "publication place", "document location")),
    "death_place": _policy("death_place", "Actual place of Author death.", "Author.death_place/death_place_id", VALUE_TYPE_ENTITY, BootstrapPolicy.DIRECT_RELATION_REVIEW_REQUIRED, (EvidenceRelation.AUTHOR_DIED_IN,), apply="Author death place fields", review=True, forbidden=("residence", "work setting", "publication place", "document location")),
    "residence": _policy("residence", "Place where the Author explicitly lived or resided.", "AuthorResidence", VALUE_TYPE_ENTITY, BootstrapPolicy.DIRECT_RELATION_REVIEW_REQUIRED, (EvidenceRelation.AUTHOR_RESIDED_IN,), apply="AuthorResidence", review=True, forbidden=("birth", "death", "travel", "work setting", "publication place", "nationality")),
    "active_years": _policy("active_years", "Explicitly documented period of professional activity.", "Author.active_from_year/active_to_year", VALUE_TYPE_ENTITY, BootstrapPolicy.DEFERRED, (EvidenceRelation.AUTHOR_ACTIVE_DURING,), apply="deferred", review=True, forbidden=("lifespan", "first/last publication", "arbitrary timeline dates")),
    "bio": _policy("bio", "Bounded human-facing summary composed only from verified Author facts.", "Author.bio", VALUE_TYPE_TEXT, BootstrapPolicy.SYNTHESIZED_REVIEW_REQUIRED, (EvidenceRelation.VERIFIED_AUTHOR_FACT_SET,), VerificationPolicy.SYNTHESIZED_FACT_SET, "Author.bio", True, synthesis=True),
    "timeline_event": _policy("timeline_event", "Structured Author/work event governed by timeline_entailment_v1.", "TimelineEvent", VALUE_TYPE_ENTITY, BootstrapPolicy.TIMELINE_ENTAILMENT, (EvidenceRelation.TIMELINE_EVENT,), VerificationPolicy.TIMELINE_ENTAILMENT_V1, "TimelineEvent", True),
    "publications": _policy("publications", "Canonical bibliography of works/publications; separate from editions.", "AuthorPublication", VALUE_TYPE_ENTITY, BootstrapPolicy.DEFERRED, verification=VerificationPolicy.DEFERRED, apply="deferred"),
}

for _field in ("literary_movements", "genres", "themes", "motifs", "concepts", "atmospheres", "notable_works"):
    AUTHOR_FIELD_REGISTRY[_field] = _policy(_field, "Current Author literary/taxonomy storage; broad Bootstrap population is deferred.", f"Author.{_field}", VALUE_TYPE_LIST, BootstrapPolicy.DEFERRED)


def author_field_policy(field_name: str) -> AuthorFieldPolicy | None:
    return AUTHOR_FIELD_REGISTRY.get(field_name)
