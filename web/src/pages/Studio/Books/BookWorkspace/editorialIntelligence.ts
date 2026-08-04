// Editorial Intelligence — Book rule graph.
// Turns an AdminBook into a structured EditorialReport using existing localized labels.

import type { AdminBook } from '../../../../types/admin';
import type { EditorialReport, EditorialGroup } from '../../../../components/Studio/editorialIntelligence/types';
import { deriveStatus, isEmpty } from '../../../../components/Studio/editorialIntelligence/editorialState';

export interface BookEditorialLabels {
  name: string;
  author: string;
  cover: string;
  genres: string;
  description: string;
}

export function buildBookReport(book: AdminBook, l: BookEditorialLabels): EditorialReport {
  const identity: EditorialGroup = {
    id: 'identity',
    steps: [
      { key: 'title', label: l.name, status: deriveStatus({ present: !isEmpty(book.title) }), details: undefined },
      { key: 'author', label: l.author, status: deriveStatus({ present: !isEmpty(book.authors) }), details: undefined },
      { key: 'cover', label: l.cover, status: deriveStatus({ present: !isEmpty(book.cover) }), details: undefined },
      { key: 'genres', label: l.genres, status: deriveStatus({ present: !isEmpty(book.genre_ids) }), details: undefined },
    ],
  };

  const content: EditorialGroup = {
    id: 'content',
    steps: [
      { key: 'description', label: l.description, status: deriveStatus({ present: !isEmpty(book.description) }), details: undefined },
    ],
  };

  return {
    entityTypeLabel: undefined,
    groups: [identity, content],
  };
}
