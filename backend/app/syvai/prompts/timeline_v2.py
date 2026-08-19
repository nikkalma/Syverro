"""Versioned timeline research prompt (v2).

``timeline_v1`` seeded the grounded-evidence contract (cite only trusted
sources, return structured JSON). ``timeline_v2`` adds the SyvAI 0.2C
claim-level evidence contract: each trusted source's stored evidence text
(``Source.citation``) is now shown to the model, and the model must return,
for every cited source, a short near-verbatim ``evidence`` fragment that
appears in that supplied text and supports the claim's date and label.

Nothing returned here is trusted on faith: ``app.syvai.evidence`` verifies the
fragment deterministically against the stored citation before any proposal can
be auto-approved.

Versioning rule: never edit ``timeline_v1`` in place for behavior changes —
create ``timeline_v3`` and switch the pipeline's active prompt.
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

VERSION = "timeline_v2"

# Cap on how much of each source's citation text is shown in the prompt. The
# stored citation may be longer; the verifier always compares against the full
# stored text, so any fragment quoted from the visible portion will verify.
MAX_SOURCE_EVIDENCE_CHARS = 600

SYSTEM_PROMPT = """You are an editorial assistant for the Sapphire knowledge base. Generate a chronological list of historically verified milestones for the given author, grounded strictly in the provided sources and the evidence text quoted from them.

## Rules
- Output only milestones that can be confirmed from the provided source list and their evidence text.
- Do NOT use outside knowledge and do NOT fabricate facts, dates, sources, or evidence.
- Every event MUST cite at least one source from the provided list.
- Prefer publication history (first editions, landmark works).
- Include literary awards with year and awarding body.
- Include important life events that directly influenced the author's work (birth, death, emigration, exile, major career shifts).
- Exclude speculative, anecdotal, or unverifiable events.
- Keep each entry concise: one line per milestone.
- Provide an approximate date when the exact date is unavailable.
- Maintain strict chronological order from earliest to latest.
- For each event's "sources" array, only use titles/URLs that appear in the provided source list.

## Evidence contract
For EVERY cited source, include an "evidence" field inside that source object:
- It must be a short, near-verbatim extract (5 to 120 words) taken WORD FOR WORD from that source's provided evidence text.
- It must explicitly support the claim's date and label.
- It must contain at least one concrete detail: a year/date, a name, a place, or a work title.
- Do NOT paraphrase, summarize, or add wording that is not present in the source text.
- If the supplied evidence text does not support the claim, do NOT cite that source and do NOT invent evidence.

## Output Schema
Return ONLY a JSON object with an "events" array. Do not include any text outside the JSON object. Each item:

{
  "event_type": "publication | award | milestone | birth | death | education | correspondence | career | personal",
  "label": "Short event name",
  "description": "One-sentence summary (optional)",
  "date_value": "YYYY-MM-DD or YYYY-MM or YYYY",
  "date_precision": "full | month | year | approximate",
  "place": "Location string (optional)",
  "sources": [{"title": "Source title", "source_type": "encyclopedia | archive | biography | ...", "url": "https://...", "language": "en", "evidence": "verbatim extract from that source's provided text"}],
  "extraction_source": "ai"
}"""


def _bounded_evidence(citation: str | None, limit: int = MAX_SOURCE_EVIDENCE_CHARS) -> str:
    """Clip the source's stored citation text for prompt display."""
    if not citation:
        return ""
    text = citation.strip()
    if len(text) <= limit:
        return text
    cut = text[:limit]
    boundary = cut.rfind(". ")
    if boundary > limit // 2:
        cut = cut[: boundary + 1]
    return cut + " …"


def build_timeline_prompt(research: dict) -> tuple[str, str]:
    """Return ``(system_prompt, user_prompt)`` for one structured call."""
    author = research.get("author", {})
    sources = research.get("sources", [])

    source_lines = []
    for index, source in enumerate(sources, start=1):
        url = source.get("url")
        url_part = f" url={url}" if url else ""
        evidence = _bounded_evidence(source.get("citation"))
        evidence_part = f"\n     evidence: {evidence}" if evidence else ""
        source_lines.append(
            f"{index}. [{source.get('title', '')}] type={source.get('source_type', '')}"
            f" language={source.get('language', '')} reliability={source.get('reliability_score', '')}"
            f"{url_part}{evidence_part}"
        )
    source_block = "\n".join(source_lines) if source_lines else "(none available)"

    user_prompt = f"""Author: {author.get('name', '')}
Birth date: {author.get('birth_date') or 'unknown'}
Death date: {author.get('death_date') or 'unknown'}

## Trusted sources
Only the following sources are available. Cite at least one of them per event.
For each cited source, quote the required "evidence" verbatim from its provided evidence text.
{source_block}

Return the JSON object described in the system prompt."""
    return SYSTEM_PROMPT, user_prompt
