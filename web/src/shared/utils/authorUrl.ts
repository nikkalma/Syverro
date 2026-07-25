const SITE_BASE = (import.meta as any).env?.VITE_SITE_URL || 'https://syverro.com';

export interface AuthorLike {
  id: string;
  slug?: string | null;
}

export function authorPath(a: AuthorLike): string {
  return a.slug ? `/author/${a.slug}` : `/author/${a.id}`;
}

export function authorUrl(a: AuthorLike): string {
  return `${SITE_BASE}${authorPath(a)}`;
}
