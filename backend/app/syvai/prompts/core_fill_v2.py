"""Curated-corpus Fill prompt contract."""

from app.syvai.prompts.core_fill_v1 import build_domain_prompt as _v1

VERSION = "core_fill_v2"

_CORPUS_RULES = """
## Curated corpus boundary
- The supplied documents are the complete permitted corpus for this call.
- Do not search for, recall, or introduce facts from any other source or model memory.
- Capability labels are routing metadata only and are never factual evidence.
- Cite the stable source_id supplied with each document.
- If the corpus cannot support a field, omit it. INSUFFICIENT_CORPUS is an acceptable empty outcome.
"""


def build_domain_prompt(domain: str, research: dict) -> tuple[str, str]:
    system, user = _v1(domain, research)
    for source in research.get("sources", []):
        marker = f"[{source.get('title', '')}]"
        user = user.replace(marker, f"[source_id={source.get('id', '')} title={source.get('title', '')}]", 1)
    return system + _CORPUS_RULES, user
