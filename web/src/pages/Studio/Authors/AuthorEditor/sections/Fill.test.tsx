import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Fill from './Fill';
import { apiClient } from '../../../../../shared/api/client';

vi.mock('../AuthorEditorContext', () => ({ useAuthorEditor: () => ({ author: { id: 'author-1' }, refreshSummary: vi.fn() }) }));
vi.mock('../../../../../shared/api/client', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }));

describe('Author Fill guardrails', () => {
  beforeEach(() => { vi.mocked(apiClient.get).mockReset(); vi.mocked(apiClient.post).mockReset(); });
  it('enables only corpus-available domains and never runs automatically', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url) => String(url).endsWith('/ai/runs')
      ? { data: { data: [] } }
      : { data: {
        author_id: 'author-1', verified_sources: [{ id: 's1', title: 'Source', trust_state: 'HUMAN_VERIFIED', content_capabilities: ['IDENTITY'], stored_content_capabilities: ['IDENTITY'], capability_evidence: {}, current_inspector_version: 'v2', reinspection_required: false }],
        needs_review_count: 1, rejected_count: 0, legacy_auto_unverified_count: 1, capability_coverage: {},
        domains: { identity: { available: true }, biography: { available: false, reason: 'No verified capable source' }, literary_context: { available: false, reason: 'No verified capable source' }, timeline: { available: false, reason: 'No verified capable source' } },
      } });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { message: 'identity research completed', proposals: [] } } as any);
    render(<Fill />);
    const identity = await screen.findByRole('button', { name: 'Run Identity' });
    expect(identity).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Run Biography' })).toBeDisabled();
    expect(apiClient.post).not.toHaveBeenCalled();
    fireEvent.click(identity);
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/admin/authors/author-1/ai/fill', { domain: 'identity' }));
  });
});
