import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ResearchOverview from './ResearchOverview';
import { apiClient } from '../../../../../shared/api/client';

vi.mock('../AuthorEditorContext', () => ({ useAuthorEditor: () => ({ author: { id: 'author-1' }, summary: { pending_proposal_count: 0 } }) }));
vi.mock('../../../../../shared/api/client', () => ({ apiClient: { get: vi.fn() } }));

describe('Research overview corpus reasons', () => {
  it('uses the same editorial wording as Fill and keeps the code secondary', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { author_id: 'author-1', verified_sources: [], needs_review_count: 0, rejected_count: 0, legacy_auto_unverified_count: 0, capability_coverage: {}, domains: { biography: { available: false, reason: 'BIOGRAPHY_UNSUPPORTED' } } } } as any);
    render(<MemoryRouter><ResearchOverview /></MemoryRouter>);
    expect(await screen.findByText('None of the verified sources contains usable biography evidence.')).toBeInTheDocument();
    expect(screen.queryByText('BIOGRAPHY_UNSUPPORTED')).not.toBeInTheDocument();
    expect(screen.getByText('Reason code: BIOGRAPHY_UNSUPPORTED')).not.toBeVisible();
  });
});
