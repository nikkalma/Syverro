export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
  return dateStr;
}

export interface BookLike {
  id: string;
  slug?: string | null;
}

export interface GenreLike {
  id: string;
  slug?: string | null;
}

export interface AuthorLike {
  id: string;
  slug?: string | null;
}

export function bookPath(book: BookLike): string {
  return book.slug ? `/book/${book.slug}` : `/book/${book.id}`;
}

export function genrePath(genre: GenreLike): string {
  return genre.slug ? `/genre/${genre.slug}` : `/genre/${genre.id}`;
}

export function authorPath(a: AuthorLike): string {
  return a.slug ? `/author/${a.slug}` : `/author/${a.id}`;
}

export function taxonomyPath(slug: string): string {
  return `/?taxonomy=${encodeURIComponent(slug)}`;
}

export function profilePath(): string {
  return '/profile';
}

const SITE_BASE = (import.meta as any).env?.VITE_SITE_URL || 'https://syverro.com';

export function authorUrl(a: AuthorLike): string {
  return `${SITE_BASE}${authorPath(a)}`;
}
