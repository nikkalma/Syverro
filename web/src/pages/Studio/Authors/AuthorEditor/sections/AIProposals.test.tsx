import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AIProposals from './AIProposals';
import { apiClient } from '../../../../../shared/api/client';

const author = { id: '2c623b15-6138-449e-8741-3a10fb163b03', name: 'Джейн Остин' };

vi.mock('../AuthorEditorContext', () => ({
  useAuthorEditor: () => ({ author, loading: false, refresh: vi.fn(), refreshSummary: vi.fn() }),
}));

vi.mock('../../../../../shared/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

describe('Author proposal epistemic explanation', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.put).mockReset();
  });

  it('shows partial state, supported span, unsupported components, and provenance', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (String(url).endsWith('/ai/runs')) return { data: { data: [] } };
      return {
        data: {
          data: [{
            id: 'proposal-1', entity_type: 'author', field_name: 'timeline_event',
            suggested_value: JSON.stringify({ label: 'Publication of Emma', date_value: '1815-12-01' }),
            source_type: 'ai', confidence: 0.65, status: 'proposed',
            validation_state: 'validated', conflict_state: 'new', review_band: 'quality_review',
            review_reason: 'ungrounded',
            sources: [{
              id: 'source-1', title: 'Emma (novel)', source_type: 'encyclopedia',
              reliability_score: '4', reliability_tier: 'high',
              snippet: 'The novel was first published in December 1815.',
              verification_state: 'partial',
              verification_reason: 'evidence matches the source text but leaves material detail unsupported: place detail: england, highbury, surrey',
              provenance_type: 'source_span', synthesis_involved: false,
            }],
          }],
        },
      };
    });

    render(<AIProposals />);

    expect(await screen.findByText('Proposals & history')).toBeInTheDocument();
    expect(await screen.findByText('PARTIAL')).toBeInTheDocument();
    expect(screen.getByText(/Supported source span:/)).toBeInTheDocument();
    expect(screen.getByText(/Unsupported components:/)).toBeInTheDocument();
    expect(screen.getByText(/place detail: england, highbury, surrey/)).toBeInTheDocument();
    expect(screen.getByText(/Provenance: source span · Synthetic: no/)).toBeInTheDocument();
    expect(screen.queryByText(/^ungrounded$/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith(
      '/admin/moderation/review-queue/proposal-1/action', { action: 'approve' },
    ));
  });
});
