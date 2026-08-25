import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Fill from './Fill';
import { apiClient } from '../../../../../shared/api/client';

vi.mock('../AuthorEditorContext', () => ({ useAuthorEditor: () => ({ author: { id: 'author-1' }, refreshSummary: vi.fn() }) }));
vi.mock('../../../../../shared/api/client', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }));

const source = { id: 's1', title: 'Source', trust_state: 'HUMAN_VERIFIED', content_capabilities: ['IDENTITY'], stored_content_capabilities: ['IDENTITY'], capability_evidence: {}, current_inspector_version: 'v2', reinspection_required: false };
const domains = (identityAvailable = true, biographyReason = 'BIOGRAPHY_UNSUPPORTED') => ({
  identity: { available: identityAvailable, reason: identityAvailable ? null : 'IDENTITY_UNSUPPORTED' },
  biography: { available: false, reason: biographyReason },
  literary_context: { available: false, reason: 'LITERARY_CONTEXT_UNSUPPORTED' },
  timeline: { available: false, reason: 'FUTURE_UNKNOWN_CODE' },
});
const corpus = (domainState = domains()) => ({ data: { author_id: 'author-1', verified_sources: [source], needs_review_count: 1, rejected_count: 0, legacy_auto_unverified_count: 1, capability_coverage: {}, domains: domainState } });

function mockLoads(domainState = domains()) {
  vi.mocked(apiClient.get).mockImplementation(async (url) => String(url).endsWith('/ai/runs') ? { data: { data: [] } } : corpus(domainState));
}

describe('Author Fill guardrails', () => {
  beforeEach(() => { vi.mocked(apiClient.get).mockReset(); vi.mocked(apiClient.post).mockReset(); });

  it('uses editorial reason copy, retains raw codes only in details, and renders no unavailable action', async () => {
    mockLoads(); render(<Fill />);
    expect(await screen.findByText('None of the verified sources contains usable biography evidence.')).toBeInTheDocument();
    expect(screen.getByText('This Fill domain is currently unavailable.')).toBeInTheDocument();
    expect(screen.queryByText('BIOGRAPHY_UNSUPPORTED')).not.toBeInTheDocument();
    expect(screen.getByText('Reason code: BIOGRAPHY_UNSUPPORTED')).not.toBeVisible();
    const biographyCard = screen.getByText('Biography', { selector: 'strong' }).parentElement!;
    expect(within(biographyCard).queryByRole('button')).not.toBeInTheDocument();
    fireEvent.keyDown(biographyCard, { key: 'Enter' });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('renders the available Run Fill action and never runs automatically', async () => {
    mockLoads(); vi.mocked(apiClient.post).mockResolvedValue({ data: { message: 'identity research completed', proposals: [] } } as any);
    render(<Fill />);
    const identity = await screen.findByRole('button', { name: 'Run Identity Fill' });
    expect(identity).toHaveTextContent('Run Fill');
    expect(apiClient.post).not.toHaveBeenCalled();
    fireEvent.click(identity);
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/admin/authors/author-1/ai/fill', { domain: 'identity' }));
  });

  it('shows Run Fill after a refreshed corpus becomes eligible', async () => {
    mockLoads(domains(false));
    const first = render(<Fill />);
    await screen.findByText('None of the verified sources contains sufficient identity evidence.');
    expect(screen.queryByRole('button', { name: 'Run Identity Fill' })).not.toBeInTheDocument();
    first.unmount();
    mockLoads(domains(true));
    render(<Fill />);
    expect(await screen.findByRole('button', { name: 'Run Identity Fill' })).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
