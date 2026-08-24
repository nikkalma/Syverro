import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { getLocaleData } from '../../locales';
import { getDashboardModules } from '../../pages/Studio/Dashboard/DashboardModuleCards';
import ParkedSection from './shared/ParkedSection';
import { getQuickModules } from './shared/StudioHeader';
import {
  ACTIVE_STUDIO_LAUNCHER_MODULES,
  ACTIVE_STUDIO_MODULES,
  PARKED_STUDIO_PATHS,
} from './studioNavigation';

const active = ['dashboard', 'users', 'books', 'authors', 'moderation', 'logs', 'settings'];
const parked = ['genres', 'taxonomy', 'entities', 'metadata'];

describe('Studio navigation cleanup', () => {
  it('exposes only the approved active modules', () => {
    expect([...ACTIVE_STUDIO_MODULES]).toEqual(active);
    expect([...ACTIVE_STUDIO_LAUNCHER_MODULES]).toEqual(active.slice(1));
    expect(ACTIVE_STUDIO_MODULES).not.toEqual(expect.arrayContaining(parked));
  });

  it('keeps parked modules out of the dashboard launcher and quick search', () => {
    const t = getLocaleData('en');
    const parkedLabels = parked.map((key) => t.admin.nav[key as keyof typeof t.admin.nav]);
    const dashboardLabels = getDashboardModules(t).map((item) => item.label);
    const quickLabels = getQuickModules(t).map((item) => item.label);

    expect(dashboardLabels).toEqual(active.slice(1).map((key) => t.admin.nav[key as keyof typeof t.admin.nav]));
    expect(quickLabels).toEqual(active.map((key) => t.admin.nav[key as keyof typeof t.admin.nav]));
    expect(dashboardLabels).not.toEqual(expect.arrayContaining(parkedLabels));
    expect(quickLabels).not.toEqual(expect.arrayContaining(parkedLabels));
  });

  it.each(PARKED_STUDIO_PATHS)('renders the safe parked state for /%s', () => {
    render(<MemoryRouter><ParkedSection /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: 'Section temporarily unavailable' })).toBeInTheDocument();
    expect(screen.getByText(/Existing data has not been removed/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to Dashboard/ })).toHaveAttribute('href', expect.stringMatching(/^\/(studio)?$/));
  });

  it('preserves active, nested, and embedded capabilities in the route and editor source', () => {
    const src = resolve(process.cwd(), 'src');
    const app = readFileSync(resolve(src, 'App.tsx'), 'utf8');
    const bookModal = readFileSync(resolve(src, 'pages/Studio/Books/BookModal.tsx'), 'utf8');
    const bookKnowledge = readFileSync(resolve(src, 'pages/Studio/Books/BookWorkspace/sections/Knowledge.tsx'), 'utf8');
    const authorIdentity = readFileSync(resolve(src, 'pages/Studio/Authors/AuthorEditor/sections/Identity.tsx'), 'utf8');
    const bookContext = readFileSync(resolve(src, 'pages/Studio/Books/BookWorkspace/BookWorkspaceContext.tsx'), 'utf8');

    for (const route of ['users', 'books', 'authors', 'moderation', 'logs', 'settings']) {
      expect(app).toContain(`path="${route}`);
    }
    expect(app).toContain('path="books/:id/workspace"');
    expect(app).toContain('path="books/:id/enrichment"');
    expect(app).toContain('path=":id/edit"');
    expect(app).toContain('path="entities/:id"');
    expect(bookModal).toContain("apiClient.get('/admin/genres'");
    expect(bookKnowledge).toContain("apiClient.get('/taxonomy/nodes'");
    expect(authorIdentity).toContain('<TaxonomyPicker');
    expect(bookContext).toContain('`/admin/metadata/books/${id}`');
  });
});
