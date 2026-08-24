import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AuthorEditorNavigation from './AuthorEditorNavigation';
import AuthorWorkflowSummary from './AuthorWorkflowSummary';

vi.mock('./AuthorEditorContext', () => ({
  useAuthorEditor: () => ({
    author: { id: 'author-1', name: 'Jane Austen', slug: 'jane-austen', metadata_status: 'draft' },
    summary: {
      metadata_status: 'draft', verified_source_count: 5, pending_source_candidate_count: 1,
      pending_proposal_count: 3, accepted_unapplied_proposal_count: 1, applied_proposal_count: 2,
      publication_ready: false, missing_required_fields: ['Languages', 'Birth date or birth year'],
      last_syvai_run_domain: 'timeline', last_syvai_run_at: '2026-08-24T10:00:00Z',
    },
  }),
}));

describe('Author Editor D1 workflow orientation', () => {
  it('groups canonical, research, and readiness navigation while preserving direct routes', () => {
    render(<MemoryRouter initialEntries={['/studio/authors/author-1/edit/sources']}><AuthorEditorNavigation basePath="/studio/authors/author-1/edit" /></MemoryRouter>);
    expect(screen.getByText('Author data')).toBeInTheDocument();
    expect(screen.getByText('Research & SyvAI')).toBeInTheDocument();
    expect(screen.getByText('Readiness')).toBeInTheDocument();
    expect(screen.getByText('Find sources')).toHaveAttribute('href', '/studio/authors/author-1/edit/discovery');
    expect(screen.getByText('Fill & proposals')).toHaveAttribute('href', '/studio/authors/author-1/edit/ai');
  });

  it('shows factual workflow signals and a secondary public preview', () => {
    render(<MemoryRouter><AuthorWorkflowSummary /></MemoryRouter>);
    expect(screen.getByText('draft')).toBeInTheDocument();
    expect(screen.getByText(/5 verified/)).toBeInTheDocument();
    expect(screen.getByText(/3 pending/)).toBeInTheDocument();
    expect(screen.getByText(/Missing 2/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Public preview' })).toBeInTheDocument();
  });

  it('routes Biography and removes the fake completion and authors/new route', () => {
    const root = resolve(__dirname, '../../../..');
    const app = readFileSync(resolve(root, 'App.tsx'), 'utf8');
    const layout = readFileSync(resolve(__dirname, 'AuthorEditorLayout.tsx'), 'utf8');
    expect(app).toContain('<Route path="biography" element={<Biography />} />');
    expect(app).not.toContain('<Route path="new"');
    expect(layout).not.toContain('computeCompletion');
    expect(layout).not.toContain('completionPercent=');
  });
});
