import type { AdminBook } from '../../../types/admin';

export type BookModerationStatus = 'pending' | 'approved' | 'rejected';
export type BookModerationFilter = BookModerationStatus | 'all';
export type BookModerationAction = 'approve' | 'reject' | 'personal-only';

export const BOOK_MODERATION_FILTERS: readonly BookModerationFilter[] = [
  'pending',
  'approved',
  'rejected',
  'all',
];

export const BOOK_MODERATION_ENDPOINTS: Record<BookModerationAction, string> = {
  approve: 'approve',
  reject: 'reject',
  'personal-only': 'personal-only',
};

export function bookModerationActions(
  book: Pick<AdminBook, 'moderation_status' | 'publication_type'>,
): BookModerationAction[] {
  if (book.moderation_status !== 'pending') return [];
  return book.publication_type === 'unofficial'
    ? ['reject', 'personal-only', 'approve']
    : ['reject', 'approve'];
}
