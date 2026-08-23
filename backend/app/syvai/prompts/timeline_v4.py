"""Minimal structured-claim contract for curated-corpus timeline research."""

from app.syvai.prompts.timeline_v3 import build_timeline_prompt as _v3

VERSION = "timeline_v4"

_MINIMALITY_RULES = """
## Minimal structured claims
- Every optional component must be supported explicitly by a cited source span.
- Unknown optional components MUST be null or omitted; never complete an object from model memory.
- Preserve source precision: YYYY for year-only, YYYY-MM for month-only, and YYYY-MM-DD only when the day is explicit.
- Never normalize an unknown day to 01.
- Set place to null unless every asserted place component appears explicitly in the cited evidence.
- A country, region, or city may not be inferred from another place component or from Author context.
- A publication date is not a career date, and lifespan dates are not active years.
- Omit an unsupported description instead of paraphrasing beyond the evidence.
"""


def build_timeline_prompt(research: dict) -> tuple[str, str]:
    system, user = _v3(research)
    return system + _MINIMALITY_RULES, user
