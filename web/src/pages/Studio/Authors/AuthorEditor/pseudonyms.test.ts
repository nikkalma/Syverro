import { describe, expect, it } from 'vitest';
import { normalizePseudonyms } from './pseudonyms';

describe('normalizePseudonyms', () => {
  it('merges compatibility fields and deduplicates case-insensitively', () => {
    expect(normalizePseudonyms(['Currer Bell', '  George Eliot '], ['currer bell', 'George Eliot'])).toEqual([
      'Currer Bell',
      'George Eliot',
    ]);
  });

  it('filters generated placeholders without changing real names', () => {
    expect(normalizePseudonyms(['Pen Name 1', 'Pseudonym 2', 'Mark Twain'], null)).toEqual(['Mark Twain']);
  });
});
