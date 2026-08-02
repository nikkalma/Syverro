// Editorial Intelligence — shared, entity-agnostic model.
// Pure types, no React. Intended to be reused across every future entity workspace
// (Author, Book, Knowledge entity, Place, Character, Series) without redesign.

export type EditorialStatus = 'completed' | 'attention' | 'missing' | 'unavailable';

export type EditorialGroupId = 'identity' | 'content' | 'research' | 'quality';

/** A single editorial concern: a curated fact, an open research field, or a verification flag. */
export interface EditorialStep {
  /** Stable machine key used by per-entity rule graph to deduplicate / reorder. */
  key: string;
  /** Localized human label (resolved at the call site, never hardcoded). */
  label: string;
  status: EditorialStatus;
  /** Localized clarification, e.g. why something is unavailable. */
  details?: string;
}

export interface EditorialGroup {
  id: EditorialGroupId;
  steps: EditorialStep[];
}

/** Structured editorial progress — deliberately never a percentage or arbitrary score. */
export interface EditorialReport {
  /** Entity type label shown as context, e.g. "Author". */
  entityTypeLabel?: string;
  groups: EditorialGroup[];
}