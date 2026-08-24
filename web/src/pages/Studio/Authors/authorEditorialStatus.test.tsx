import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AdminAuthor } from '../../../types/admin';
import { useAdminStore } from '../../../store/adminStore';
import AuthorsFilters from './AuthorsFilters';
import AuthorsTable from './AuthorsTable';
import { authorEditorialSignals, isResearchBlocked } from './authorEditorialStatus';

vi.mock('../../../store/adminStore', () => ({ useAdminStore: vi.fn() }));

function makeAuthor(overrides: Partial<AdminAuthor> = {}): AdminAuthor {
  return {
    id: 'author-1', name: 'Jane Austen', slug: 'jane-austen', sort_name: 'Austen, Jane',
    creation_type: 'individual_author', metadata_status: 'draft', book_count: 6,
    publications_count: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    verified_source_count: 0, pending_source_candidate_count: 0, rejected_source_candidate_count: 0,
    corpus_ready: false, pending_proposal_count: 0, accepted_unapplied_proposal_count: 0,
    applied_proposal_count: 0, publication_ready: false,
    missing_required_fields: ['Languages', 'Occupations'], last_syvai_run_at: null,
    ...overrides,
  };
}

describe('Author editorial status derivation', () => {
  it('keeps factual source, proposal, and Apply signals separate', () => {
    const signals = authorEditorialSignals(makeAuthor({
      corpus_ready: true, verified_source_count: 1, pending_source_candidate_count: 3,
      pending_proposal_count: 2, accepted_unapplied_proposal_count: 1, applied_proposal_count: 4,
    }));
    expect(signals).toEqual([
      { kind: 'corpus-ready' }, { kind: 'sources-review', count: 3 },
      { kind: 'proposals-review', count: 2 }, { kind: 'changes-ready', count: 1 },
      { kind: 'changes-applied', count: 4 },
    ]);
  });

  it('shows Sources needed only when no current eligible corpus exists', () => {
    expect(authorEditorialSignals(makeAuthor())).toContainEqual({ kind: 'sources-needed' });
    expect(authorEditorialSignals(makeAuthor({ corpus_ready: true }))).not.toContainEqual({ kind: 'sources-needed' });
  });

  it('recognizes only concise known research-blocking outcomes', () => {
    expect(isResearchBlocked(makeAuthor({ last_syvai_run_reason: 'INSUFFICIENT_CORPUS:BIOGRAPHY_UNSUPPORTED' }))).toBe(true);
    expect(isResearchBlocked(makeAuthor({ last_syvai_run_reason: 'SOURCE_POOL_MISSING' }))).toBe(true);
    expect(isResearchBlocked(makeAuthor({ last_syvai_run_reason: 'RAW_PROVIDER_EXCEPTION' }))).toBe(false);
  });
});

describe('AuthorsTable editorial work surface', () => {
  it('renders lifecycle, attention, readiness, activity, and separate navigation without a percentage', () => {
    const setPage = vi.fn();
    vi.mocked(useAdminStore).mockReturnValue({ setPage } as never);
    const onEdit = vi.fn();
    const author = makeAuthor({
      pending_source_candidate_count: 3, pending_proposal_count: 2,
      accepted_unapplied_proposal_count: 1, applied_proposal_count: 4,
      last_syvai_run_at: '2026-08-24T10:00:00Z', last_syvai_run_status: 'skipped',
      last_syvai_run_domain: 'biography', last_syvai_run_reason: 'INSUFFICIENT_CORPUS:BIOGRAPHY_UNSUPPORTED',
    });
    render(<AuthorsTable authors={[author]} loading={false} error={null} total={41} page={1} limit={20} canManage onEdit={onEdit} onDelete={vi.fn()} onRefresh={vi.fn()} />);

    expect(screen.getByText('DRAFT')).toBeInTheDocument();
    expect(screen.getByText('Sources needed')).toBeInTheDocument();
    expect(screen.getByText('3 sources to review')).toBeInTheDocument();
    expect(screen.getByText('2 proposals to review')).toBeInTheDocument();
    expect(screen.getByText('1 changes ready to apply')).toBeInTheDocument();
    expect(screen.getByText('4 AI changes applied')).toBeInTheDocument();
    expect(screen.getByText('Missing: Languages, Occupations')).toBeInTheDocument();
    expect(screen.getByText(/Research blocked: biography unsupported/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\d+%/);

    fireEvent.click(screen.getByRole('button', { name: 'Jane Austen' }));
    expect(onEdit).toHaveBeenCalledWith(author);
    expect(screen.getByLabelText('Public preview').closest('a')).toHaveAttribute('href', expect.stringContaining('/author/jane-austen'));

    fireEvent.click(screen.getAllByRole('button').find((button) => button.querySelector('svg.lucide-chevron-right'))!);
    expect(setPage).toHaveBeenCalledWith(2);
  });

  it('keeps publication readiness and missing-required presentation mutually consistent', () => {
    vi.mocked(useAdminStore).mockReturnValue({ setPage: vi.fn() } as never);
    render(<AuthorsTable authors={[makeAuthor({ publication_ready: true, missing_required_fields: [] })]} loading={false} error={null} total={1} page={1} limit={20} canManage={false} onEdit={vi.fn()} onDelete={vi.fn()} onRefresh={vi.fn()} />);
    expect(screen.getByText('Ready for editorial review')).toBeInTheDocument();
    expect(screen.queryByText(/^Missing:/)).not.toBeInTheDocument();
    expect(screen.getByText('No SyvAI activity')).toBeInTheDocument();
  });
});

describe('AuthorsFilters', () => {
  it('preserves search and country behavior while adding canonical lifecycle filtering', async () => {
    const setFilters = vi.fn();
    const setSearchQuery = vi.fn();
    vi.mocked(useAdminStore).mockReturnValue({
      searchQuery: '', filters: {}, setFilters, setSearchQuery, clearFilters: vi.fn(),
    } as never);
    render(<AuthorsFilters onFilterChange={vi.fn()} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'review_ready' } });
    await waitFor(() => expect(setFilters).toHaveBeenCalledWith({ metadata_status: 'review_ready' }));

    fireEvent.change(screen.getByPlaceholderText(/Search by name/), { target: { value: 'Austen' } });
    await waitFor(() => expect(setSearchQuery).toHaveBeenCalledWith('Austen'), { timeout: 1000 });
  });
});
