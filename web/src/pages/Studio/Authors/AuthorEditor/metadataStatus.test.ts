import { describe, expect, it } from 'vitest';
import { validateStatusPromotion } from './metadataStatus';
import type { AdminAuthor } from '../../../../types/admin';

describe('author metadata readiness', () => {
  it('does not require biography or work-derived taxonomy', () => {
    const author = {
      birth_name: 'Mary Ann Evans',
      sort_name: 'Eliot, George',
      birth_date: '1819-11-22',
      nationality: 'British',
      occupations: ['Novelist'],
      languages: ['English'],
      publications_count: 1,
      photo: 'https://example.com/portrait.jpg',
      official_website: 'https://example.com',
      portrait_caption: 'Portrait',
      author_intro_quote: 'Novelist and essayist',
      bio: null,
      genres: [],
      literary_movements: [],
    } as unknown as AdminAuthor;

    expect(validateStatusPromotion(author, 'golden')).toEqual({ valid: true, errors: [] });
  });
});
