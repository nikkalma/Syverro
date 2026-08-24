import { describe, expect, it } from 'vitest';

import {
  BOOK_MODERATION_ENDPOINTS,
  BOOK_MODERATION_FILTERS,
  bookModerationActions,
} from './bookModeration';

describe('Book moderation contract', () => {
  it('exposes only backend-supported moderation states', () => {
    expect(BOOK_MODERATION_FILTERS).toEqual(['pending', 'approved', 'rejected', 'all']);
    expect(BOOK_MODERATION_FILTERS).not.toContain('draft');
    expect(BOOK_MODERATION_FILTERS).not.toContain('published');
    expect(BOOK_MODERATION_FILTERS).not.toContain('archived');
  });

  it('maps operator decisions to real backend actions', () => {
    expect(BOOK_MODERATION_ENDPOINTS).toEqual({
      approve: 'approve',
      reject: 'reject',
      'personal-only': 'personal-only',
    });
  });

  it('offers personal-only only for pending unofficial books', () => {
    expect(bookModerationActions({ moderation_status: 'pending', publication_type: 'unofficial' }))
      .toEqual(['reject', 'personal-only', 'approve']);
    expect(bookModerationActions({ moderation_status: 'pending', publication_type: 'official' }))
      .toEqual(['reject', 'approve']);
    expect(bookModerationActions({ moderation_status: 'approved', publication_type: 'unofficial' }))
      .toEqual([]);
    expect(bookModerationActions({ moderation_status: 'rejected', publication_type: 'official' }))
      .toEqual([]);
  });
});
