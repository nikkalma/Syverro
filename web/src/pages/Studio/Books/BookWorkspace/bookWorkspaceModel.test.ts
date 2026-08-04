import { describe, expect, it } from 'vitest';
import type { AdminBook } from '../../../../types/admin';
import { getBookReadiness } from './bookWorkspaceModel';

describe('book workspace readiness', () => {
  it('requires only fields editable in the five-section workspace', () => {
    const book = {
      title: 'A Book', authors: [{ id: 'a1', name: 'Author' }], cover: 'cover.jpg',
      original_publication_year: 2001, total_pages: null, description: 'Description', genre_ids: ['g1'],
      series_name: null, subtitle: null, themes: [], motifs: [],
    } as unknown as AdminBook;
    expect(getBookReadiness(book)).toEqual([]);
  });

  it('maps missing fields to their editable section', () => {
    const book = { title: '', authors: [], cover: null, total_pages: null, original_publication_year: null, description: null, genre_ids: [] } as unknown as AdminBook;
    expect(getBookReadiness(book).map(({ key, section }) => `${section}:${key}`)).toEqual([
      'identity:title', 'identity:authors', 'identity:cover', 'identity:publication_year', 'editorial:description', 'knowledge:genres',
    ]);
  });

  it('does not make a book incomplete when only page count is absent', () => {
    const book = {
      title: 'A Book', authors: [{ id: 'a1', name: 'Author' }], cover: 'cover.jpg',
      original_publication_year: 2001, total_pages: null, description: 'Description', genre_ids: ['g1'],
    } as unknown as AdminBook;
    expect(getBookReadiness(book)).toEqual([]);
  });
});
