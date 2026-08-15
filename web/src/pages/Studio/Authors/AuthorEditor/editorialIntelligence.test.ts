import { describe, expect, it } from 'vitest';

import type { AdminAuthor } from '../../../../types/admin';
import { buildAuthorReport } from './editorialIntelligence';

const labels = {
  name: 'Name', nativeName: 'Native name', slug: 'Slug', penNames: 'Pseudonyms',
  summary: 'Summary', nationality: 'Nationality', birthDate: 'Birth date',
  birthPlace: 'Birth place', deathPlace: 'Death place', occupations: 'Occupations',
};

describe('author editorial intelligence', () => {
  it('accepts the canonical pseudonyms field when the legacy alias is empty', () => {
    const report = buildAuthorReport({
      name: 'Charlotte Bronte',
      pen_names: [],
      pseudonyms: ['Currer Bell'],
    } as AdminAuthor, labels);

    const pseudonyms = report.groups[0].steps.find((step) => step.key === 'pen_names');
    expect(pseudonyms?.status).not.toBe('missing');
  });
});
