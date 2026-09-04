import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AIReview, { evidencePresentation, isHistoryApplyEligible } from './AIReview';
import { getLocaleData } from '../../../locales';
import { apiClient } from '../../../shared/api/client';
import type { AIProposal } from '../../../types/admin';

vi.mock('../../../shared/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const en = getLocaleData('en');
const ai = en.admin.moderation.aiReview;

function proposal(id: string, status = 'accepted', appliedAt: string | null = null): AIProposal {
  return {
    id,
    entity_type: 'author',
    entity_id: 'author-1',
    entity_name: 'Ray Bradbury',
    field_name: 'occupations',
    suggested_value: id,
    source_type: 'catalog_bootstrap',
    confidence: 1,
    status,
    review_band: 'quality_review',
    applied_at: appliedAt,
    created_at: '2026-01-01T00:00:00Z',
  };
}

const pageOne = [
  proposal('rejected-1', 'rejected'),
  proposal('rejected-2', 'rejected'),
  ...Array.from({ length: 8 }, (_, index) => proposal(`accepted-${index + 1}`)),
];
const pageTwo = [
  ...Array.from({ length: 6 }, (_, index) => proposal(`accepted-${index + 9}`)),
  proposal('already-applied', 'applied', '2026-01-02T00:00:00Z'),
  proposal('other-rejected-1', 'rejected'),
  proposal('other-rejected-2', 'rejected'),
  proposal('other-rejected-3', 'rejected'),
];

function mockModerationApi(applyResult = { succeeded: 14, failed: 0, results: [] }) {
  vi.mocked(apiClient.get).mockImplementation(async (url, config) => {
    if (url === '/admin/moderation/review-queue/counts') {
      return { data: { total: 0, under_review: 0, by_band: { quality_review: 0, policy_review: 0 }, by_reason: {}, by_entity_type: {} } } as any;
    }
    if (url === '/admin/moderation/review-queue') return { data: { data: [], total: 0 } } as any;
    if (url === '/admin/moderation/history') {
      const page = Number((config as any)?.params?.page || 1);
      return { data: { data: page === 1 ? pageOne : pageTwo, total: 20 } } as any;
    }
    throw new Error(`Unexpected GET ${url}`);
  });
  vi.mocked(apiClient.post).mockResolvedValue({ data: applyResult } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockModerationApi();
});

describe('moderation evidence state presentation', () => {
  it.each([
    ['direct_grounded', 'DIRECT GROUNDED'],
    ['partial', 'PARTIAL'],
    ['synthetic', 'SYNTHETIC'],
    ['ungrounded', 'UNGROUNDED'],
  ])('distinguishes %s', (state, label) => {
    expect(evidencePresentation(state).label).toBe(label);
  });

  it('never styles an unknown state as grounded', () => {
    expect(evidencePresentation('legacy').label).toBe('UNVERIFIED');
  });

  it('presents the global proposal queue as Author moderation', () => {
    expect(getLocaleData('en').admin.moderation.aiReview.aiTab).toBe('Authors');
    expect(getLocaleData('en').admin.authors.editor.sections.ai).toBe('Author proposals');
  });

  it('only treats accepted, unapplied History proposals as Apply-eligible', () => {
    expect(isHistoryApplyEligible(proposal('eligible'))).toBe(true);
    expect(isHistoryApplyEligible(proposal('rejected', 'rejected'))).toBe(false);
    expect(isHistoryApplyEligible(proposal('applied', 'applied', '2026-01-02T00:00:00Z'))).toBe(false);
  });

  it('preserves an 8+6 cross-page selection and submits all 14 ids once', async () => {
    render(<AIReview />);
    fireEvent.click(await screen.findByRole('button', { name: ai.historyTab }));

    await screen.findByText('rejected-1');
    let checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[1]).toBeDisabled();
    expect(checkboxes[2]).toBeDisabled();
    checkboxes.slice(3).forEach((checkbox) => fireEvent.click(checkbox));
    expect(screen.getByText(`8 ${ai.selected}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '→' }));
    await screen.findByText('accepted-14');
    expect(screen.getByText(`8 ${ai.selected}`)).toBeInTheDocument();
    checkboxes = screen.getAllByRole('checkbox');
    checkboxes.slice(1, 7).forEach((checkbox) => fireEvent.click(checkbox));
    expect(screen.getByText(`14 ${ai.selected}`)).toBeInTheDocument();
    expect(checkboxes[7]).toBeDisabled();
    expect(checkboxes[8]).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: '←' }));
    await screen.findByText('accepted-1');
    checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.slice(3).every((checkbox) => (checkbox as HTMLInputElement).checked)).toBe(true);
    fireEvent.click(checkboxes[3]);
    expect(screen.getByText(`13 ${ai.selected}`)).toBeInTheDocument();
    fireEvent.click(checkboxes[3]);

    fireEvent.click(screen.getByRole('button', { name: ai.bulkApply }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(1));
    const [url, body] = vi.mocked(apiClient.post).mock.calls[0];
    expect(url).toBe('/admin/moderation/bulk-apply');
    expect((body as { proposal_ids: string[] }).proposal_ids).toHaveLength(14);
    expect(new Set((body as { proposal_ids: string[] }).proposal_ids)).toEqual(
      new Set(Array.from({ length: 14 }, (_, index) => `accepted-${index + 1}`)),
    );
    await waitFor(() => expect(screen.getByText(`0 ${ai.selected}`)).toBeInTheDocument());
  });

  it('clears hidden selection when the logical view changes', async () => {
    render(<AIReview />);
    fireEvent.click(await screen.findByRole('button', { name: ai.historyTab }));
    await screen.findByText('accepted-1');
    fireEvent.click(screen.getAllByRole('checkbox')[3]);
    expect(screen.getByText(`1 ${ai.selected}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: new RegExp(ai.queueTab) }));
    fireEvent.click(await screen.findByRole('button', { name: ai.historyTab }));
    await screen.findByText('accepted-1');
    expect(screen.getByText(`0 ${ai.selected}`)).toBeInTheDocument();
  });

  it('retains the complete selection and reports an atomic Apply failure', async () => {
    mockModerationApi({
      succeeded: 0,
      failed: 1,
      results: [{ id: 'accepted-1', ok: false, error: 'bulk apply rolled back' }],
    });
    render(<AIReview />);
    fireEvent.click(await screen.findByRole('button', { name: ai.historyTab }));
    await screen.findByText('accepted-1');
    fireEvent.click(screen.getAllByRole('checkbox')[3]);
    fireEvent.click(screen.getByRole('button', { name: ai.bulkApply }));

    await screen.findByText(/bulk apply rolled back/);
    expect(screen.getByText(`1 ${ai.selected}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ai.bulkApply })).toBeEnabled();
  });
});
