import type { AdminBook } from '../../../../types/admin';

export type BookWorkspaceSection = 'identity' | 'editorial' | 'knowledge';

export interface BookReadinessItem {
  key: string;
  section: BookWorkspaceSection;
}

export function getBookReadiness(book: AdminBook): BookReadinessItem[] {
  const missing: BookReadinessItem[] = [];
  const requireValue = (key: string, section: BookWorkspaceSection, value: unknown) => {
    const empty = value === null || value === undefined || value === '' || value === 0 || (Array.isArray(value) && value.length === 0);
    if (empty) missing.push({ key, section });
  };

  requireValue('title', 'identity', book.title);
  requireValue('authors', 'identity', book.authors);
  requireValue('cover', 'identity', book.cover);
  requireValue('publication_year', 'identity', book.original_publication_year);
  requireValue('description', 'editorial', book.description);
  requireValue('genres', 'knowledge', book.genre_ids);

  return missing;
}

export function getBookCompletion(book: AdminBook): number {
  const total = 6;
  return Math.round(((total - getBookReadiness(book).length) / total) * 100);
}
