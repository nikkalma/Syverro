import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Publications from './Publications';
import { apiClient } from '../../../../../shared/api/client';

const author = { id: 'author-1', name: 'Canonical Author' };

vi.mock('../AuthorEditorContext', () => ({
  useAuthorEditor: () => ({ author }),
}));

vi.mock('../../../../../shared/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

describe('Author canonical Works bibliography', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it('shows canonical identity, ordered credit, and linked Book representations', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: [{
          id: 'work-1', author_id: author.id, title: 'Canonical Work',
          original_title: 'Original Work', publication_year: 1953,
          publication_date: null, publication_type: 'novel', description: null,
          pen_name: 'Credited Name', wikipedia_url: null, source_id: null,
          created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
          authors: [{ author_id: author.id, position: 1, credited_name: 'Credited Name', canonical_name: author.name }],
          linked_books: [{ id: 'book-1', title: 'Localized Edition' }], linked_book_count: 1,
        }],
      },
    });

    render(<Publications />);

    expect(await screen.findByText('Canonical Work · work-1')).toBeInTheDocument();
    expect(screen.getByText(/1\. Credited Name \(Canonical Author\)/)).toBeInTheDocument();
    expect(screen.getByText(/Localized Edition/)).toBeInTheDocument();
  });
});
