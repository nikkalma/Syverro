"""Versioned timeline research prompt.

``timeline_v1`` is seeded from the repository's ``prompts/timeline-autofill.md``
editorial rules, extended with the grounded-evidence contract required by
SyvAI 0.1A: claims must cite only the provided trusted sources and must return
the machine-readable JSON object the pipeline expects.

Versioning rule: never edit this file in place for behavior changes — create
``timeline_v2`` and switch the pipeline's active prompt. Schema-compatible
tweaks to wording are acceptable.
"""

from __future__ import annotations

import json
import logging

logger = logging.getLogger(__name__)

VERSION = "timeline_v1"

SYSTEM_PROMPT = """You are an editorial assistant for the Sapphire knowledge base. Generate a chronological list of historically verified milestones for the given author, grounded strictly in the provided sources.

## Rules
- Output only milestones that can be confirmed from the provided source list.
- Do NOT use outside knowledge and do NOT fabricate facts, dates, or sources.
- Every event MUST cite at least one source from the provided list.
- Prefer publication history (first editions, landmark works).
- Include literary awards with year and awarding body.
- Include important life events that directly influenced the author's work (birth, death, emigration, exile, major career shifts).
- Exclude speculative, anecdotal, or unverifiable events.
- Keep each entry concise: one line per milestone.
- Provide an approximate date when the exact date is unavailable.
- Maintain strict chronological order from earliest to latest.
- For each event's "sources" array, only use titles/URLs that appear in the provided source list.

## Output Schema
Return ONLY a JSON object with an "events" array. Do not include any text outside the JSON object. Each item:

{
  "event_type": "publication | award | milestone | birth | death | education | correspondence | career | personal",
  "label": "Short event name",
  "description": "One-sentence summary (optional)",
  "date_value": "YYYY-MM-DD or YYYY-MM or YYYY",
  "date_precision": "full | month | year | approximate",
  "place": "Location string (optional)",
  "sources": [{"title": "Source title", "source_type": "encyclopedia | archive | biography | ...", "url": "https://...", "language": "en"}],
  "extraction_source": "ai"
}"""


def build_timeline_prompt(research: dict) -> tuple[str, str]:
    """Return ``(system_prompt, user_prompt)`` for one structured call."""
    author = research.get("author", {})
    sources = research.get("sources", [])

    source_lines = []
    for index, source in enumerate(sources, start=1):
        url = source.get("url")
        url_part = f" url={url}" if url else ""
        source_lines.append(
            f"{index}. [{source.get('title', '')}] type={source.get('source_type', '')}"
            f" language={source.get('language', '')} reliability={source.get('reliability_score', '')}"
            f"{url_part}"
        )
    source_block = "\n".join(source_lines) if source_lines else "(none available)"

    user_prompt = f"""Author: {author.get('name', '')}
Birth date: {author.get('birth_date') or 'unknown'}
Death date: {author.get('death_date') or 'unknown'}

## Trusted sources
Only the following sources are available. Cite at least one of them per event.
{source_block}

Return the JSON object described in the system prompt."""
    return SYSTEM_PROMPT, user_prompt
