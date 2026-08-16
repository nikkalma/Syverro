"""Authority-tier registry for discovery candidates.

Tiers are coarse, deterministic, and applied to the candidate URL's domain:

  * ``high``   — curated reference institutions (encyclopedias, national
    libraries, archives, scholarly registers). Auto-approvable.
  * ``medium`` — academic/education/government domains, established
    news/institutional outlets, and aggregators such as Wikipedia that are
    genuinely useful for discovery and corroboration but are never
    auto-approved without a human. Needs review.
  * ``low``    — personal blogs and social profiles. Needs review.
  * ``unknown``— everything else. Needs review (never auto-approved).

This is an allow-list of high-authority domains plus suffix rules, not a
block-list; unknown is the safe default.
"""

from __future__ import annotations

from urllib.parse import urlparse

from app.syvai.discovery.urls import registrable_domain

# Registrable domains treated as high authority (curated reference sources).
HIGH_AUTHORITY_DOMAINS = {
    "worldcat.org",
    "loc.gov",
    "bnf.fr",
    "bl.uk",
    "britishlibrary.com",
    "archive.org",
    "stanford.edu",
    "oxfordreference.com",
    "openlibrary.org",
    "wikisource.org",
    "gutenberg.org",
    "encyclopedia.com",
    "newadvent.org",
    "treccani.it",
    "biography.com",
    "poetryfoundation.org",
    "britishmuseum.org",
    "npg.org.uk",
    "britannica.com",
}

# Registrable domains treated as medium authority: useful for discovery and
# corroboration, but never eligible for auto-approval. Wikipedia is deliberately
# here — it aggregates curated references but is not itself a curated
# institutional source, so it must keep human review.
MEDIUM_DOMAINS = {
    "wikipedia.org",
    "wikimedia.org",
}

# Personal/social spaces treated as low authority.
LOW_AUTHORITY_DOMAINS = {
    "blogspot.com",
    "wordpress.com",
    "medium.com",
    "substack.com",
    "tumblr.com",
    "facebook.com",
    "twitter.com",
    "x.com",
    "instagram.com",
    "reddit.com",
    "tripadvisor.com",
    "quora.com",
    "patreon.com",
}

# Label suffixes for academic/government/institutional domains. A host matches
# when it is exactly the label or ends with a label boundary (".label").
MEDIUM_SUFFIX_LABELS = ("edu", "ac.uk", "gov", "gov.uk", "mil", "org.uk")


def _host_matches_suffix(host: str, label: str) -> bool:
    return host == label or host.endswith("." + label)


def authority_tier_for_url(url: str) -> str:
    """Return the authority tier for ``url`` (host-based, deterministic)."""
    family = registrable_domain(url)
    if family in HIGH_AUTHORITY_DOMAINS:
        return "high"
    if family in MEDIUM_DOMAINS:
        return "medium"
    if family in LOW_AUTHORITY_DOMAINS:
        return "low"
    host = urlparse(url).hostname or ""
    host = host.lower()
    if host.startswith("www."):
        host = host[4:]
    if any(_host_matches_suffix(host, label) for label in MEDIUM_SUFFIX_LABELS):
        return "medium"
    return "unknown"
