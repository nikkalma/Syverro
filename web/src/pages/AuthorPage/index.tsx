import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getBrowserLocale, getLocaleData } from '../../locales';
import { apiClient } from '../../shared/api/client';
import { authorSectionVisibility, mapPublicAuthorDetail } from './authorPageModel';
import {
  AuthorAbout, AuthorHero, AuthorLocalNav, AuthorQuotes, AuthorRelations, AuthorSources, AuthorTimeline, AuthorWorks,
} from './AuthorPageSections';
import type { PublicAuthorDetail } from './types';
import './AuthorPage.css';

export default function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();
  const [author, setAuthor] = useState<PublicAuthorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const t = getLocaleData(getBrowserLocale()).author;

  const loadAuthor = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    try {
      const response = await apiClient.get<PublicAuthorDetail>(`/authors/${slug}`);
      setAuthor(mapPublicAuthorDetail(response.data));
    } catch {
      setAuthor(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { void loadAuthor(); }, [loadAuthor]);

  const visibility = useMemo(() => author ? authorSectionVisibility(author) : null, [author]);
  const navItems = visibility ? [
    visibility.about && { id: 'about', label: t.tabAbout },
    visibility.works && { id: 'works', label: t.tabBooks },
    visibility.chronology && { id: 'chronology', label: t.timeline },
    visibility.quotes && { id: 'quotes', label: t.tabQuotes },
    visibility.relations && { id: 'relations', label: t.tabConnections },
    visibility.sources && { id: 'sources', label: t.sources },
  ].filter((item): item is { id: string; label: string } => Boolean(item)) : [];

  if (loading) return <main className="author-page-state" aria-live="polite"><span className="author-page-state__mark">✦</span><p>{t.loading}</p></main>;
  if (error || !author || !visibility) return <main className="author-page-state"><span className="author-page-state__mark">◇</span><h1>{t.authorNotFound}</h1><button type="button" onClick={() => void loadAuthor()}>{t.retry}</button></main>;

  return <main className="author-page">
    <AuthorHero author={author} t={t} />
    {navItems.length > 0 && <AuthorLocalNav items={navItems} label={t.localNavLabel} />}
    <div className="author-page__grid">
      <div className="author-page__main">
        {visibility.about && <AuthorAbout author={author} t={t} />}
        {visibility.works && <AuthorWorks author={author} t={t} />}
        {visibility.quotes && <AuthorQuotes author={author} t={t} />}
        {visibility.relations && <AuthorRelations author={author} t={t} />}
      </div>
      <aside className="author-page__rail">
        {visibility.chronology && <AuthorTimeline author={author} t={t} />}
      </aside>
    </div>
    {visibility.sources && <AuthorSources author={author} t={t} />}
  </main>;
}
