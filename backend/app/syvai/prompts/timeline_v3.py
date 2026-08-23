"""Curated-corpus timeline prompt contract."""

from app.syvai.prompts.timeline_v2 import build_timeline_prompt as _v2

VERSION = "timeline_v3"

_CORPUS_RULES = """
## Curated corpus boundary
- The supplied documents are the complete permitted corpus for this call.
- Do not search for, recall, or introduce facts from any other source or model memory.
- Capability labels are routing metadata only and are never factual evidence.
- Cite the stable source_id supplied with each document.
- If the corpus cannot support an event, omit it. INSUFFICIENT_CORPUS is an acceptable empty outcome.
"""


def build_timeline_prompt(research: dict) -> tuple[str, str]:
    system, user = _v2(research)
    for source in research.get("sources", []):
        marker = f"[{source.get('title', '')}]"
        user = user.replace(marker, f"[source_id={source.get('id', '')} title={source.get('title', '')}]", 1)
    return system + _CORPUS_RULES, user
