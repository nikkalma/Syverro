import type { AdminAuthor } from '../../../types/admin';

export const AUTHOR_METADATA_STATUSES = [
  'draft',
  'identity_complete',
  'editorial_complete',
  'knowledge_complete',
  'review_ready',
  'golden',
] as const;

export type AuthorSignal =
  | { kind: 'sources-needed' | 'corpus-ready'; count?: never }
  | { kind: 'sources-review' | 'proposals-review' | 'changes-ready' | 'changes-applied'; count: number };

export function authorEditorialSignals(author: AdminAuthor): AuthorSignal[] {
  const signals: AuthorSignal[] = [];
  if (author.corpus_ready) signals.push({ kind: 'corpus-ready' });
  else signals.push({ kind: 'sources-needed' });
  if ((author.pending_source_candidate_count || 0) > 0) signals.push({ kind: 'sources-review', count: author.pending_source_candidate_count! });
  if ((author.pending_proposal_count || 0) > 0) signals.push({ kind: 'proposals-review', count: author.pending_proposal_count! });
  if ((author.accepted_unapplied_proposal_count || 0) > 0) signals.push({ kind: 'changes-ready', count: author.accepted_unapplied_proposal_count! });
  if ((author.applied_proposal_count || 0) > 0) signals.push({ kind: 'changes-applied', count: author.applied_proposal_count! });
  return signals;
}

export function isResearchBlocked(author: AdminAuthor): boolean {
  return Boolean(author.last_syvai_run_reason && /^(INSUFFICIENT_CORPUS|NO_TRUSTED_SOURCE|SOURCE_POOL_MISSING)/.test(author.last_syvai_run_reason));
}

export function conciseBlockedReason(reason?: string | null): string | null {
  if (!reason) return null;
  const detail = reason.split(':').slice(1).join(':').replace(/_/g, ' ').toLowerCase();
  return detail || null;
}

export function formatMetadataStatus(status: string): string {
  return status.replace(/_/g, ' ').toUpperCase();
}

export function formatRelativeActivity(value: string, now = Date.now()): string {
  const elapsed = Math.max(0, now - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
