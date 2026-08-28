import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../../shared/api/client';
import BootstrapAuthorMetadata from './BootstrapAuthorMetadata';

vi.mock('../../../../../shared/api/client', () => ({ apiClient: { post: vi.fn() } }));

const copy = {
  action: 'Bootstrap Author metadata', title: 'Bootstrap Author metadata', loading: 'Building deterministic preview…',
  previewFailed: 'Could not build preview', confirmFailed: 'Could not create proposals', retry: 'Retry preview',
  proposed: 'Proposed value', current: 'Current canonical value', source: 'Source', reused: 'Pending proposal will be reused',
  empty: 'No results', noActionable: 'There are no proposals to create or reuse.', complete: 'Proposals ready',
  created: 'Created', reusedCount: 'Reused', alreadyPresent: 'Already present', skipped: 'Skipped',
  reviewNotice: 'Nothing was accepted, applied, or published.', reviewProposals: 'Review proposals', cancel: 'Cancel',
  confirming: 'Creating…', confirm: 'Create proposals',
  safetyNotice: 'Verified does not mean accepted, applied, published, or canonical truth.',
  groups: { verified: 'Verified', conflicts: 'Conflicts — human review required', already_present: 'Already present', skipped: 'Skipped / unavailable' },
  fields: { birth_date: 'Birth date', death_date: 'Death date', occupations: 'Occupation', languages: 'Languages' },
  reasons: { already_present_in_canonical_author: 'Already canonical', preserve_existing: 'Preserved' },
};

const preview = {
  preview: true, run_id: null, status: 'completed', proposal_ids: ['p1', 'p2'],
  automatic_approval: false, automatic_apply: false,
  counts: { created: 2, reused: 1, already_present: 1, skipped: 2 },
  categories: {
    verified: [
      { field: 'birth_date', proposed_value: { date_value: '1920-08-22' }, verification_status: 'verified', disposition: 'reused', provenance: { wikidata_qid: 'Q310732', property_id: 'P569' } },
      { field: 'birth_place', proposed_value: { place: 'Waukegan' }, verification_status: 'verified', disposition: 'created', provenance: { wikidata_qid: 'Q310732', property_id: 'P19' } },
    ],
    conflicts: [{ field: 'death_date', proposed_value: { date_value: '2012-06-05' }, current_value: { date_value: '2011' }, verification_status: 'verified', disposition: 'created' }],
    already_present: [{ field: 'occupations', reason: 'already_present_in_canonical_author' }],
    skipped: [{ field: 'languages', reason: 'preserve_existing' }, { field: 'native_name', reason: 'localized_label_not_explicit_native_name' }],
  },
};

describe('Catalog Bootstrap Author preview', () => {
  beforeEach(() => vi.mocked(apiClient.post).mockReset());

  it('shows action, loading, grouped editorial results, and no acceptance semantics', async () => {
    let resolvePreview: (value: any) => void = () => undefined;
    vi.mocked(apiClient.post).mockReturnValueOnce(new Promise((resolve) => { resolvePreview = resolve; }) as any);
    render(<BootstrapAuthorMetadata authorId="author-1" copy={copy} onConfirmed={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: copy.action }));
    expect(screen.getByText(copy.loading)).toBeInTheDocument();
    resolvePreview({ data: preview });

    expect(await screen.findByRole('heading', { name: 'Verified (2)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Conflicts — human review required (1)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Already present (1)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Skipped / unavailable (2)' })).toBeInTheDocument();
    expect(screen.getByText(/1920-08-22/)).toBeInTheDocument();
    expect(screen.getByText(/Waukegan/)).toBeInTheDocument();
    expect(screen.getByText(/localized label not explicit native name/)).toBeInTheDocument();
    expect(screen.getByText(/Current canonical value: 2011/)).toBeInTheDocument();
    expect(screen.getByText(copy.safetyNotice)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /apply|accept/i })).not.toBeInTheDocument();
  });

  it('retries a failed preview', async () => {
    vi.mocked(apiClient.post)
      .mockRejectedValueOnce({ response: { data: { detail: { reason: 'Identity unavailable' } } } })
      .mockResolvedValueOnce({ data: preview });
    render(<BootstrapAuthorMetadata authorId="author-1" copy={copy} onConfirmed={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: copy.action }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Identity unavailable');
    fireEvent.click(screen.getByRole('button', { name: copy.retry }));
    expect(await screen.findByRole('heading', { name: 'Verified (2)' })).toBeInTheDocument();
    expect(apiClient.post).toHaveBeenCalledTimes(2);
  });

  it('confirms through persistence endpoint and reports created/reused counts', async () => {
    const confirmed = vi.fn();
    vi.mocked(apiClient.post)
      .mockResolvedValueOnce({ data: preview })
      .mockResolvedValueOnce({ data: { ...preview, preview: false, run_id: 'run-1', counts: { created: 1, reused: 1, already_present: 1, skipped: 1 } } });
    render(<BootstrapAuthorMetadata authorId="author-1" copy={copy} onConfirmed={confirmed} />);
    fireEvent.click(screen.getByRole('button', { name: copy.action }));
    fireEvent.click(await screen.findByRole('button', { name: copy.confirm }));

    expect(await screen.findByRole('status')).toHaveTextContent('Created: 1');
    expect(screen.getByRole('status')).toHaveTextContent('Reused: 1');
    expect(apiClient.post).toHaveBeenNthCalledWith(1, '/admin/authors/author-1/bootstrap/preview');
    expect(apiClient.post).toHaveBeenNthCalledWith(2, '/admin/authors/author-1/bootstrap');
    await waitFor(() => expect(confirmed).toHaveBeenCalledOnce());
  });

  it('shows an empty non-actionable state without a confirm control', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {
      ...preview, proposal_ids: [], counts: { created: 0, reused: 0, already_present: 0, skipped: 0 },
      categories: { verified: [], conflicts: [], already_present: [], skipped: [] },
    } });
    render(<BootstrapAuthorMetadata authorId="author-1" copy={copy} onConfirmed={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: copy.action }));
    expect(await screen.findByText(copy.empty)).toBeInTheDocument();
    expect(screen.getByText(copy.noActionable)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: copy.confirm })).not.toBeInTheDocument();
  });
});
