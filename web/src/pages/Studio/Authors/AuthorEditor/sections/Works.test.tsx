import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Works from './Works';
import { apiClient } from '../../../../../shared/api/client';

const author = {
  id: '070dd12a-783f-405c-b951-3a3685dba77b',
  name: 'Энн Бронте',
};

const linkedBook = {
  id: 'b8bb3297-fe7b-477b-9a8c-da2f52dd229f',
  slug: 'agnes-grey',
  title: 'Агнес Грей',
  author: 'Энн Бронте',
  publication_id: null,
  genres: [],
  publication_type: 'official',
  metadata_status: 'draft',
  is_published: true,
  moderation_status: 'approved',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  authors: [{ id: author.id, name: author.name }],
};

vi.mock('../AuthorEditorContext', () => ({
  useAuthorEditor: () => ({ author, loading: false }),
}));

vi.mock('../../../../../shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Author Workspace Works', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.delete).mockReset();
  });

  it('loads existing catalog books through canonical author_id filtering', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [linkedBook] } });

    render(<Works />);

    expect(await screen.findByText('Агнес Грей')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/admin/books', {
      params: { author_id: author.id, limit: 50 },
    });
    expect(screen.queryByText('Нет связанных книг')).not.toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('does not require or mix AuthorPublication records with linked books', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [linkedBook] } });

    render(<Works />);

    expect(await screen.findByText('Агнес Грей')).toBeInTheDocument();
    expect(vi.mocked(apiClient.get).mock.calls.some(([url]) => String(url).includes('/publications'))).toBe(false);
  });

  it('shows an API error instead of a false empty state', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('network'));

    render(<Works />);

    expect(await screen.findByText('Could not load linked books.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('No books connected')).not.toBeInTheDocument());
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
