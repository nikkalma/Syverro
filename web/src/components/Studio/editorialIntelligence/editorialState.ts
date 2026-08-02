// Editorial Intelligence — reusable, entity-agnostic state helpers.
// Pure functions: status derivation + honest counting. No percentages, no fake analytics.
// Component- and entity-type-agnostic so the same rules power Authors, Books, Nodes, etc.

import type { EditorialGroup, EditorialReport, EditorialStatus } from './types';

export function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

export function hasAny(source: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((k) => !isEmpty(source[k]));
}

/** Presence-based editors guidance, derived from structured evidence rather than guesswork. */
export function deriveStatus(input: {
  present: boolean;
  /** Verified by a source / cross-check, or merely entered raw. */
  explored?: boolean;
  /** Whether Studio can meaningfully assess this concern today. */
  applicable?: boolean;
}): EditorialStatus {
  if (input.applicable === false) return 'unavailable';
  if (!input.present) return 'missing';
  return input.explored === false ? 'attention' : 'completed';
}

/**
 * Truthful editorial state obtained by scanning the resulting groups.
 * Counts are reported as-is (facts), never normalized into a score or percentage.
 */
export function summarize(report: EditorialReport): Record<EditorialStatus, number> {
  const tally: Record<EditorialStatus, number> = {
    completed: 0,
    attention: 0,
    missing: 0,
    unavailable: 0,
  };
  for (const group of report.groups) {
    for (const step of group.steps) {
      tally[step.status] += 1;
    }
  }
  return tally;
}

export function buildGroup(id: EditorialGroup['id'], steps: EditorialGroup['steps']): EditorialGroup {
  return { id, steps };
}

export { buildGroup as group };

export const STATUS_ORDER: EditorialStatus[] = ['completed', 'attention', 'missing', 'unavailable'];