import { describe, expect, it } from 'vitest';
import type { AdminBook } from '../../../../types/admin';
import { buildBookReport } from './editorialIntelligence';

describe('book editorial intelligence', () => {
  it('does not evaluate edition-specific page count', () => {
    const report = buildBookReport({
      title: 'A Book', authors: [{ id: 'a1', name: 'Author' }], cover: 'cover.jpg',
      description: 'Description', genre_ids: ['g1'], total_pages: null,
    } as unknown as AdminBook, {
      name: 'Name', author: 'Author', cover: 'Cover', genres: 'Genres', description: 'Description',
    });

    expect(report.groups.map((group) => group.id)).toEqual(['identity', 'content']);
    expect(report.groups.flatMap((group) => group.steps).some((step) => step.key === 'pages')).toBe(false);
  });
});
