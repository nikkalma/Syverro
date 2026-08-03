// Editorial Intelligence — Author rule graph.
// Turns an AdminAuthor into a structured EditorialReport. Entity-specific labels come from the
// caller (existing localized editor strings); the status derivation stays entity-agnostic.

import type { AdminAuthor } from '../../../../types/admin';
import type { EditorialReport, EditorialGroup } from '../../../../components/Studio/editorialIntelligence/types';
import { deriveStatus, isEmpty } from '../../../../components/Studio/editorialIntelligence/editorialState';

export interface AuthorEditorialLabels {
  name: string;
  nativeName: string;
  slug: string;
  penNames: string;
  summary: string;
  nationality: string;
  birthDate: string;
  birthPlace: string;
  deathPlace: string;
  genres: string;
  occupations: string;
  movements: string;
}

export function buildAuthorReport(author: AdminAuthor, l: AuthorEditorialLabels): EditorialReport {
  const identity: EditorialGroup = {
    id: 'identity',
    steps: [
      { key: 'name', label: l.name, status: deriveStatus({ present: !isEmpty(author.name) }), details: undefined },
      { key: 'native', label: l.nativeName, status: deriveStatus({ present: !isEmpty(author.native_name) }), details: undefined },
      { key: 'slug', label: l.slug, status: deriveStatus({ present: !isEmpty(author.slug) }), details: undefined },
      { key: 'pen_names', label: l.penNames, status: deriveStatus({ present: !isEmpty(author.pen_names) }), details: undefined },
    ],
  };

  const content: EditorialGroup = {
    id: 'content',
    steps: [
      { key: 'summary', label: l.summary, status: deriveStatus({ present: !isEmpty(author.about_summary) }), details: undefined },
    ],
  };

  const research: EditorialGroup = {
    id: 'research',
    steps: [
      { key: 'nationality', label: l.nationality, status: deriveStatus({ present: !isEmpty(author.nationality) }), details: undefined },
      { key: 'birth_date', label: l.birthDate, status: deriveStatus({ present: !isEmpty(author.birth_date) }), details: undefined },
      { key: 'birth_place', label: l.birthPlace, status: deriveStatus({ present: !isEmpty(author.birth_place) }), details: undefined },
      { key: 'death_place', label: l.deathPlace, status: deriveStatus({ present: !isEmpty(author.death_place) }), details: undefined },
      { key: 'genres', label: l.genres, status: deriveStatus({ present: !isEmpty(author.genres) }), details: undefined },
      { key: 'occupations', label: l.occupations, status: deriveStatus({ present: !isEmpty(author.occupations) }), details: undefined },
      { key: 'movements', label: l.movements, status: deriveStatus({ present: !isEmpty(author.literary_movements) }), details: undefined },
    ],
  };

  return {
    entityTypeLabel: undefined,
    groups: [identity, content, research],
  };
}