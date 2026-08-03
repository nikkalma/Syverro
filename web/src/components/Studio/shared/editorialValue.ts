// Localized editorial value resolver.
//
// Editorial content (places, cultural identity, taxonomy names, …) is stored in
// ONE canonical language. Localized rendering must come from *stored* variants,
// never from hardcoded translations in components and never from machine
// translation at render time.
//
// Contract: when the backend starts exposing per-locale variants, it must attach
// them as `localizations: { [localeCode]: string }` on the same payload that
// carries the canonical `value`. This resolver then prefers the active locale's
// variant and only falls back to the canonical stored text when no variant exists.
//
// Current state (as audited): no author field, Place or KnowledgeNode in the
// backend exposes such `localizations` yet. With today's data this function is a
// safe pass-through of the canonical value — it never mutates stored content and
// it never invents translations.

export interface EditorialLocalizedValue {
  value?: string | null;
  localizations?: Record<string, string | null | undefined>;
}

export function resolveEditorialValue(
  source: EditorialLocalizedValue | undefined | null,
  locale: string,
): string {
  if (!source) return '';
  const localized = source.localizations?.[locale];
  if (localized && localized.trim()) return localized;
  return source.value ?? '';
}
