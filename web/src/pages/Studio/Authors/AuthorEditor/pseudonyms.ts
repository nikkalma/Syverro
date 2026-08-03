// Studio exposes one canonical editor-facing concept: "Pseudonyms". The API
// still carries `pseudonyms` and the legacy alias `pen_names`, so callers write
// this normalized result back to both fields to preserve compatibility.
export function normalizePseudonyms(...lists: (string[] | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const list of lists) {
    for (const raw of list || []) {
      const value = (raw || '').trim();
      if (!value || /^(pen name|pseudonym)\s*\d+$/i.test(value)) continue;
      const comparisonKey = value.toLocaleLowerCase();
      if (seen.has(comparisonKey)) continue;
      seen.add(comparisonKey);
      normalized.push(value);
    }
  }

  return normalized;
}
