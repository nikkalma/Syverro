import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SourceDiscovery from './SourceDiscovery';
import { apiClient } from '../../../../../shared/api/client';

vi.mock('../AuthorEditorContext', () => ({ useAuthorEditor: () => ({ author: { id: 'author-1' }, refreshSummary: vi.fn() }) }));
vi.mock('../../../../../shared/api/client', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }));

const candidate = (id: string, corpus_state: string, status = 'reviewed') => ({
  id, author_id: 'author-1', url: `https://example.com/${id}`, normalized_url: `https://example.com/${id}`,
  title: id, authority_tier: 'medium', assessment: corpus_state === 'REJECTED' ? 'rejected' : 'needs_review',
  corpus_state, content_capabilities: [], capability_evidence: {}, status,
});

describe('canonical source candidate actions', () => {
  beforeEach(() => {
    localStorage.setItem('syverro_locale', 'en');
    vi.mocked(apiClient.get).mockReset(); vi.mocked(apiClient.post).mockReset();
  });

  it('renders Approve/Reject only for pending NEEDS_REVIEW candidates and performs no mount mutation', async () => {
    const candidates = [
      candidate('pending', 'NEEDS_REVIEW', 'pending'), candidate('auto', 'AUTO_VERIFIED'),
      candidate('human', 'HUMAN_VERIFIED'), candidate('rejected', 'REJECTED'),
      candidate('legacy', 'AUTO_VERIFIED_LEGACY'),
    ];
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      const path = String(url);
      if (path.endsWith('/discovery/status')) return { data: { configured: true, enabled: true, status: 'OK', provider: 'test' } };
      if (path.endsWith('/discovery/candidates')) return { data: { data: candidates } };
      if (path.endsWith('/discovery/runs')) return { data: { data: [] } };
      if (path.endsWith('/discovery/metrics')) return { data: { candidates_total: 5, candidates_pending: 1, auto_approved_sources: 1, human_actions_per_author: 0 } };
      return { data: { verified_sources: [], needs_review_count: 1, rejected_count: 1, legacy_auto_unverified_count: 1, domains: {} } };
    });
    render(<SourceDiscovery />);
    expect(await screen.findByText('pending')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Approve' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Reject' })).toHaveLength(1);
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
