"""SyvAI 0.3E — bounded geographic research context.

Builds the geographic context for an author EXCLUSIVELY from existing
structured author data. Free-form biography prose is never scanned; an
unrecognizable or missing country simply contributes nothing. ``GLOBAL`` is
always present so that global-registered supplements remain available.

Sources of structured geography (in priority order):

  * ``Author.country`` / ``Author.nationality`` (display strings)
  * ``Author.birth_place`` / ``Author.death_place`` — only via the place
    string's final geographic label (e.g. ``"Berlin, Germany"`` -> ``DE``);
    unstructured prose is never parsed for countries
  * caller-supplied citizenship rows (``state_name`` / ``country``)
  * caller-supplied residence rows (``place.country`` on the related Place)

The country vocabulary is a small, explicit allow-list; anything outside it
is ignored (no inference, no substring guessing beyond the final place label).
"""

from __future__ import annotations

from app.syvai.registry.catalog import GEO_SCOPE_GLOBAL

# Conservative, explicit structured-geography vocabulary. Keys are normalized
# (casefold, trimmed). Values are ISO-3166 alpha-2 codes.
_COUNTRY_ALIASES = {
    # GB / United Kingdom
    "gb": "GB",
    "uk": "GB",
    "united kingdom": "GB",
    "great britain": "GB",
    "britain": "GB",
    "british": "GB",
    "england": "GB",
    "english": "GB",
    "scotland": "GB",
    "scottish": "GB",
    "wales": "GB",
    "welsh": "GB",
    "northern ireland": "GB",
    # Germany
    "de": "DE",
    "germany": "DE",
    "german": "DE",
    # United States
    "us": "US",
    "usa": "US",
    "united states": "US",
    "america": "US",
    "american": "US",
    # Ireland
    "ie": "IE",
    "ireland": "IE",
    "irish": "IE",
    # France
    "fr": "FR",
    "france": "FR",
    "french": "FR",
    # Italy
    "it": "IT",
    "italy": "IT",
    "italian": "IT",
    # Spain
    "es": "ES",
    "spain": "ES",
    "spanish": "ES",
    # Netherlands
    "nl": "NL",
    "netherlands": "NL",
    "dutch": "NL",
    # Russia
    "ru": "RU",
    "russia": "RU",
    "russian": "RU",
}

# Place string parsing is limited to the FINAL comma-separated geographic label
# ("City, Region, Country" -> the last label is the country candidate). Prose
# is never scanned.
_MAX_PLACE_LABELS = 4


def _normalize(value: str) -> str:
    return value.strip().strip(".,; ").casefold()


def coerce_country_code(value) -> str | None:
    """Return an ISO-3166 alpha-2 code for a structured country string.

    Accepts an exact match of the trimmed/casefolded value, and — only for
    place-like strings — a match of the final geographic label. Returns ``None``
    when nothing is recognized (unknown geography is never inferred).
    """
    if value is None:
        return None
    cleaned = _normalize(str(value))
    if not cleaned:
        return None
    if cleaned in _COUNTRY_ALIASES:
        return _COUNTRY_ALIASES[cleaned]
    labels = [part.strip().casefold() for part in cleaned.split(",")]
    for label in labels[-_MAX_PLACE_LABELS:]:
        if label in _COUNTRY_ALIASES:
            return _COUNTRY_ALIASES[label]
    return None


def _first_code(*values) -> str | None:
    for value in values:
        code = coerce_country_code(value)
        if code:
            return code
    return None


def ordered_geo_context(scopes: set[str]) -> tuple[str, ...]:
    """Deterministic ordering: country codes sorted, then ``GLOBAL`` last."""
    country_codes = sorted(scope for scope in scopes if scope != GEO_SCOPE_GLOBAL)
    if GEO_SCOPE_GLOBAL in scopes:
        country_codes.append(GEO_SCOPE_GLOBAL)
    return tuple(country_codes)


def geographic_context(
    author,
    *,
    citizenships=None,
    residences=None,
) -> tuple[str, ...]:
    """Build the bounded geographic context for ``author`` (structured only).

    ``citizenships``/``residences`` optionally carry relational rows (ORM objects
    exposing ``state_name``/``country`` and ``place.country``). Read-only and
    deterministic; never touches the network or a database.
    """
    scopes: set[str] = set()

    for field in ("country", "nationality"):
        code = coerce_country_code(getattr(author, field, None))
        if code:
            scopes.add(code)

    for field in ("birth_place", "death_place"):
        code = coerce_country_code(getattr(author, field, None))
        if code:
            scopes.add(code)

    for row in citizenships or ():
        code = _first_code(
            getattr(row, "country", None),
            getattr(row, "state_name", None),
        )
        if code:
            scopes.add(code)

    for row in residences or ():
        place = getattr(row, "place", None)
        if place is not None:
            code = coerce_country_code(getattr(place, "country", None))
            if code:
                scopes.add(code)

    scopes.add(GEO_SCOPE_GLOBAL)
    return ordered_geo_context(scopes)