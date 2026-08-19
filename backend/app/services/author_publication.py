"""Canonical Author publication boundary (draft -> golden).

This module is the single source of truth for two things:

* ``author_golden_readiness`` — whether an Author's applied canonical data is
  good enough to appear on the public read path.
* ``promote_author_to_golden`` — the ONLY backend action that moves an Author
  from a pre-publication status to ``metadata_status="golden"``.

Apply != Publish
----------------
Applying AI-derived metadata (``app.syvai.apply_author``) never touches
``metadata_status``. Publishing an Author remains an explicit, audited,
editorial action performed through ``promote_author_to_golden``.

Readiness rules
---------------
The required (blocking) fields are the canonical identity/biography core that
the SyvAI fill loop can produce and that the public Author read path renders:
``sort_name``, ``nationality``, birth date/year, ``languages``,
``occupations`` and ``bio``.

Media, bibliography and external-link polish (photo, portrait caption, intro
quote, publications, Wikipedia/website URLs) are intentionally manual/editorial
enrichments: they are surfaced as non-blocking ``warnings`` so Beta authors can
reach the public read path without SyvAI-unproducible fields, without weakening
the identity/biography core.
"""

from __future__ import annotations

from app.models.author import Author
from app.services.security_audit import add_security_event

AUTHOR_STATUS_PIPELINE = (
    "draft",
    "identity_complete",
    "editorial_complete",
    "knowledge_complete",
    "review_ready",
    "golden",
)

#: Label shown for each blocking field in readiness reports.
_FIELD_LABELS = {
    "sort_name": "Sort name",
    "nationality": "Nationality",
    "birth": "Birth date or birth year",
    "languages": "Languages",
    "occupations": "Occupations",
    "bio": "Biography",
}

_TAXONOMY_BLOCK_KEYS = (
    "genres",
    "themes",
    "motifs",
    "concepts",
    "atmospheres",
    "literary_movements",
    "writing_languages",
)


class AuthorPublicationBlocked(Exception):
    """Raised when a promote attempt is refused because readiness failed."""

    def __init__(self, readiness: dict):
        self.readiness = readiness
        reasons = readiness.get("blocking_reasons") or []
        super().__init__(
            "Author is not ready for publication: " + "; ".join(reasons)
            if reasons
            else "Author is not ready for publication"
        )


def _is_present(value) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, tuple, set)):
        return len(value) > 0
    return True


def author_golden_readiness(author: Author, *, publications_count: int = 0) -> dict:
    """Evaluate whether ``author`` is ready to be promoted to ``golden``.

    Returns structured results — never raises:
    ``ready``, ``metadata_status``, ``missing_required_fields``,
    ``blocking_reasons``, ``warnings``.
    """
    missing_required_fields: list[str] = []
    blocking_reasons: list[str] = []

    checks = {
        "sort_name": (
            author.sort_name
            or author.display_name
            or author.name
        ),
        "nationality": (author.nationality or author.country),
        "birth": (author.birth_date or author.birth_year),
        "languages": author.languages,
        "occupations": author.occupations,
        "bio": author.bio,
    }

    for key, value in checks.items():
        if not _is_present(value):
            missing_required_fields.append(_FIELD_LABELS[key])
            blocking_reasons.append(f"Missing required field: {_FIELD_LABELS[key]}")

    taxonomy_populated = any(
        _is_present(getattr(author, key, None))
        for key in _TAXONOMY_BLOCK_KEYS
    )

    warnings: list[str] = []
    if not _is_present(author.photo):
        warnings.append("No portrait photo (manual/editorial)")
    if not (_is_present(author.wikipedia_url) or _is_present(author.official_website)):
        warnings.append("No external links (Wikipedia / official website)")
    if not _is_present(author.portrait_caption):
        warnings.append("No portrait caption (manual/editorial)")
    if not _is_present(author.author_intro_quote):
        warnings.append("No intro quote (manual/editorial)")
    if publications_count <= 0:
        warnings.append("No known publications (bibliography is a separate editorial surface)")
    if not taxonomy_populated:
        warnings.append(
            "No literary-context taxonomy (genres/themes/motifs) — taxonomy "
            "incompleteness may leave these empty"
        )

    return {
        "ready": not blocking_reasons,
        "metadata_status": author.metadata_status or "draft",
        "missing_required_fields": missing_required_fields,
        "blocking_reasons": blocking_reasons,
        "warnings": warnings,
    }


async def promote_author_to_golden(
    db,
    *,
    author: Author,
    actor_id,
    request=None,
    endpoint: str,
    publications_count: int = 0,
) -> dict:
    """Explicitly publish one Author (metadata_status -> golden).

    * refuses (``AuthorPublicationBlocked``) when readiness fails;
    * is idempotent when the Author is already golden;
    * writes an audit event;
    * never publishes Books and never changes unrelated Author fields;
    * never mutates ``metadata_status`` of any other Author.

    The caller commits the transaction.
    """
    if (author.metadata_status or "draft") == "golden":
        return {
            "already_golden": True,
            "metadata_status": "golden",
            "readiness": author_golden_readiness(
                author, publications_count=publications_count
            ),
        }

    readiness = author_golden_readiness(author, publications_count=publications_count)
    if not readiness["ready"]:
        raise AuthorPublicationBlocked(readiness)

    author.metadata_status = "golden"

    add_security_event(
        db,
        event_type="author_promote_golden",
        endpoint=endpoint,
        method="POST",
        status_code=200,
        actor_id=actor_id,
        target_id=author.id,
        request=request,
        details={"metadata_status": "golden"},
    )

    return {
        "already_golden": False,
        "metadata_status": "golden",
        "readiness": readiness,
    }