import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '../../../../../locales';
import type { AdminBook } from '../../../../../types/admin';
import Identity from './Identity';

const saveBook = vi.fn();
const saveEnrichment = vi.fn();
const refresh = vi.fn();

const book = {
  id: 'book-1',
  title: 'Existing title',
  subtitle: null,
  original_title: 'Original title',
  cover: 'cover.jpg',
  original_publication_year: 1847,
  original_language: 'English',
  country_of_origin: 'United Kingdom',
  total_pages: 672,
  publication_type: 'official',
  series_name: null,
  series_position: null,
  authors: [],
} as unknown as AdminBook;

vi.mock('../BookWorkspaceContext', () => ({
  useBookWorkspace: () => ({
    book,
    publicDetail: null,
    saving: false,
    saveError: null,
    saveBook,
    saveEnrichment,
    refresh,
  }),
}));

vi.mock('../../../../../shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: { data: [] } }), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

describe('Book Workspace identity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveBook.mockResolvedValue(undefined);
    saveEnrichment.mockResolvedValue(undefined);
  });

  it('hides the page-count editor', () => {
    render(<Identity />);
    expect(screen.queryByText(en.admin.books.pages)).not.toBeInTheDocument();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
  });

  it('preserves stored page count when saving other identity fields', async () => {
    render(<Identity />);
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Updated title' } });
    fireEvent.click(screen.getByRole('button', { name: en.admin.common.save }));

    await waitFor(() => expect(saveBook).toHaveBeenCalled());
    const payload = saveBook.mock.calls[0][0];
    expect(payload).toEqual({ title: 'Updated title', publication_type: 'official' });
    expect(payload).not.toHaveProperty('total_pages');
  });
});
