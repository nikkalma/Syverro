import { describe, expect, it } from 'vitest';
import { mapPublicBookDetail } from './bookDetailApi';

describe('mapPublicBookDetail', () => {
  it('preserves nullable fields, multiple authors, structured genres, and knowledge', () => {
    const detail = mapPublicBookDetail({
      id: 'book-1', slug: 'book', title: 'Book', subtitle: 'Subtitle', original_title: 'Original',
      description: null, cover: null, publication_id: 'publication-1', publication_year: 1847,
      original_language: 'English', country_of_origin: 'United Kingdom', total_pages: null,
      publication_type: 'official', series_name: 'Series', series_position: 2,
      authors: [
        { id: 'a1', name: 'One', display_name: 'Author One', slug: 'one', role: null, is_primary: null },
        { id: 'a2', name: 'Two', display_name: null, slug: 'two', role: 'translator', is_primary: false },
      ],
      publication: {
        id: 'publication-1', author_id: 'a1', title: 'Work', original_title: 'Original Work',
        publication_year: 1847, publication_date: null, publication_type: 'novel',
        description: null, pen_name: null, wikipedia_url: null, source_id: null,
      },
      genres: [{ id: 'g1', name: 'Gothic Novel', slug: 'gothic-novel', type: 'literary' }],
      knowledge: [{
        node_id: 'n1', name: 'Identity', slug: 'identity', node_type: 'concept',
        relation_type: 'explores', confidence: 0.9, source: 'curator',
        metadata: { slug: 'identity', node_type: 'concept' },
      }],
    });

    expect(detail.totalPages).toBeNull();
    expect(detail.slug).toBe('book');
    expect(detail.authors).toHaveLength(2);
    expect(detail.authors[0].displayName).toBe('Author One');
    expect(detail.genres[0]).toEqual({ id: 'g1', name: 'Gothic Novel', slug: 'gothic-novel', type: 'literary' });
    expect(detail.knowledge[0]).toMatchObject({ nodeId: 'n1', nodeType: 'concept', relationType: 'explores' });
    expect(detail.publication?.publicationYear).toBe(1847);
  });
});
