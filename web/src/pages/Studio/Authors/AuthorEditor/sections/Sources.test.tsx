import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Sources from './Sources';
import { apiClient } from '../../../../../shared/api/client';

vi.mock('../AuthorEditorContext', () => ({ useAuthorEditor: () => ({ author: { id: 'author-1' }, refreshSummary: vi.fn() }) }));
vi.mock('../../../../../shared/api/client', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

const corpus = (needsReview: number) => ({ author_id: 'author-1', verified_sources: [], needs_review_count: needsReview, rejected_count: 0, legacy_auto_unverified_count: 0, capability_coverage: {}, domains: {} });

function mockSources(needsReview: number) {
  vi.mocked(apiClient.get).mockImplementation(async (url) => String(url).endsWith('/research-corpus') ? { data: corpus(needsReview) } : { data: { data: [] } });
}

describe('Sources review discoverability', () => {
  beforeEach(() => {
    localStorage.setItem('syverro_locale', 'en');
    vi.mocked(apiClient.get).mockReset(); vi.mocked(apiClient.post).mockReset();
  });

  it('shows a pending decision banner linked to the existing review surface without mutating', async () => {
    mockSources(2);
    render(<MemoryRouter><Sources /></MemoryRouter>);
    expect(await screen.findByText('2 discovered sources need your decision.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review sources' })).toHaveAttribute('href', '/studio/authors/author-1/edit/discovery');
    expect(screen.queryByRole('button', { name: /approve|reject/i })).not.toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('omits the banner and review action when no decisions are pending', async () => {
    mockSources(0);
    render(<MemoryRouter><Sources /></MemoryRouter>);
    await screen.findByText('No sources yet');
    expect(screen.queryByRole('link', { name: 'Review sources' })).not.toBeInTheDocument();
    expect(screen.queryByText(/need your decision/)).not.toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
