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
