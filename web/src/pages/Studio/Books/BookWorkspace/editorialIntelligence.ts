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
  pages: string;
  status: string;
}

function metadataStatus(book: AdminBook): 'completed' | 'attention' | 'missing' {
  switch (book.metadata_status) {
    case 'complete':
      return 'completed';
    case 'review_ready':
      return 'attention';
    default:
      return 'missing';
  }
}

export function buildBookReport(book: AdminBook, l: BookEditorialLabels): EditorialReport {
  const identity: EditorialGroup = {
    id: 'identity',
    steps: [
      { key: 'title', label: l.name, status: deriveStatus({ present: !isEmpty(book.title) }), details: undefined },
      { key: 'author', label: l.author, status: deriveStatus({ present: !isEmpty(book.author) }), details: undefined },
      { key: 'cover', label: l.cover, status: deriveStatus({ present: !isEmpty(book.cover) }), details: undefined },
      { key: 'genres', label: l.genres, status: deriveStatus({ present: !isEmpty(book.genres) }), details: undefined },
    ],
  };

  const content: EditorialGroup = {
    id: 'content',
    steps: [
      { key: 'description', label: l.description, status: deriveStatus({ present: !isEmpty(book.description) }), details: undefined },
    ],
  };

  const research: EditorialGroup = {
    id: 'research',
    steps: [
      { key: 'pages', label: l.pages, status: deriveStatus({ present: book.total_pages != null && book.total_pages > 0 }), details: undefined },
    ],
  };

  const quality: EditorialGroup = {
    id: 'quality',
    steps: [
      { key: 'metadata_status', label: l.status, status: metadataStatus(book), details: undefined },
    ],
  };

  return {
    entityTypeLabel: undefined,
    groups: [identity, content, research, quality],
  };
}