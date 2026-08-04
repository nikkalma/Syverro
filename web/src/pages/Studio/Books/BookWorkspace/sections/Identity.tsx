import { useEffect, useMemo, useState } from 'react';
import { useBookWorkspace } from '../BookWorkspaceContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';
import ActionBar from '../../../../../components/Studio/shared/ActionBar';
import { apiClient } from '../../../../../shared/api/client';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import type { AuthorPublication } from '../../../../../types/admin';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '14px', background: 'var(--input-bg)',
  border: '1px solid var(--border-soft)', borderRadius: '8px', color: 'var(--text-primary)',
  outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div style={labelStyle}>{label}</div>{children}</div>;
}

export default function Identity() {
  const t = getLocaleData(getBrowserLocale());
  const { book, publicDetail, saving, saveError, saveBook, saveEnrichment, refresh } = useBookWorkspace();
  const [form, setForm] = useState({ title: '', subtitle: '', originalTitle: '', cover: '', year: '', language: '', country: '', publicationType: 'official', series: '', seriesPosition: '' });
  const [authorQuery, setAuthorQuery] = useState('');
  const [authorResults, setAuthorResults] = useState<Array<{ id: string; name: string; display_name?: string | null }>>([]);
  const [publications, setPublications] = useState<AuthorPublication[]>([]);

  useEffect(() => {
    if (!book) return;
    setForm({
      title: book.title || '', subtitle: book.subtitle || '', originalTitle: book.original_title || '', cover: book.cover || '',
      year: book.original_publication_year?.toString() || '', language: book.original_language || '', country: book.country_of_origin || '',
      publicationType: book.publication_type || 'official', series: book.series_name || '',
      seriesPosition: book.series_position?.toString() || '',
    });
  }, [book]);

  useEffect(() => {
    if (!authorQuery.trim()) { setAuthorResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const response = await apiClient.get('/admin/authors', { params: { search: authorQuery.trim(), limit: 10 } });
        const linked = new Set((book?.authors || []).map((author) => author.id));
        setAuthorResults((response.data?.data || []).filter((author: { id: string }) => !linked.has(author.id)));
      } catch { setAuthorResults([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [authorQuery, book?.authors]);

  useEffect(() => {
    const load = async () => {
      const authorIds = (book?.authors || []).map((author) => author.id);
      if (authorIds.length === 0) { setPublications([]); return; }
      const results = await Promise.all(authorIds.map((id) => apiClient.get(`/admin/authors/${id}/publications`).then((r) => r.data?.data || []).catch(() => [])));
      setPublications(results.flat());
    };
    load();
  }, [book?.authors]);

  if (!book) return null;
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const original = {
    title: book.title || '', subtitle: book.subtitle || '', originalTitle: book.original_title || '', cover: book.cover || '',
    year: book.original_publication_year?.toString() || '', language: book.original_language || '', country: book.country_of_origin || '',
    publicationType: book.publication_type || 'official', series: book.series_name || '', seriesPosition: book.series_position?.toString() || '',
  };
  const dirty = JSON.stringify(form) !== JSON.stringify(original);
  const reset = () => setForm(original);

  const save = async () => {
    await saveBook({ title: form.title.trim(), publication_type: form.publicationType as 'official' | 'unofficial' });
    await saveEnrichment({
      subtitle: form.subtitle.trim() || null, original_title: form.originalTitle.trim() || null, cover: form.cover.trim() || null,
      original_publication_year: form.year ? Number(form.year) : null, original_language: form.language.trim() || null,
      country_of_origin: form.country.trim() || null, series_name: form.series.trim() || null,
      series_position: form.seriesPosition ? Number(form.seriesPosition) : null,
    });
  };

  const linkAuthor = async (authorId: string) => {
    await apiClient.post(`/admin/books/${book.id}/authors`, null, { params: { author_id: authorId } });
    setAuthorQuery(''); setAuthorResults([]); await refresh();
  };
  const unlinkAuthor = async (authorId: string) => { await apiClient.delete(`/admin/books/${book.id}/authors/${authorId}`); await refresh(); };
  const publicationId = publicDetail?.publicationId || '';
  const publicationOptions = useMemo(() => [...publications].sort((a, b) => a.publication_year - b.publication_year), [publications]);
  const setPublication = async (id: string) => {
    if (id) await apiClient.put(`/admin/books/${book.id}/publication`, null, { params: { publication_id: id } });
    else if (publicationId) await apiClient.delete(`/admin/books/${book.id}/publication`);
    await refresh();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={t.admin.bookWorkspace.identityBibliography}>
        <DetailGrid columns={2}>
          <Field label={t.admin.books.name}><input value={form.title} onChange={(e) => set('title', e.target.value)} style={inputStyle} /></Field>
          <Field label={t.admin.enrichment.subtitle}><input value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} style={inputStyle} /></Field>
          <Field label={t.admin.books.originalTitle}><input value={form.originalTitle} onChange={(e) => set('originalTitle', e.target.value)} style={inputStyle} /></Field>
          <Field label={t.admin.books.coverUrl}><input value={form.cover} onChange={(e) => set('cover', e.target.value)} style={inputStyle} /></Field>
        </DetailGrid>
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.bookWorkspace.contributors}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {(book.authors || []).map((author) => <span key={author.id} style={{ padding: '5px 10px', borderRadius: '14px', background: 'var(--primary-soft)', color: 'var(--primary)' }}>{author.name} <button type="button" onClick={() => unlinkAuthor(author.id)} style={{ border: 0, background: 'none', color: 'inherit', cursor: 'pointer' }}>×</button></span>)}
          {(book.authors || []).length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t.admin.enrichment.noAuthors}</span>}
        </div>
        <div style={{ position: 'relative' }}>
          <input value={authorQuery} onChange={(e) => setAuthorQuery(e.target.value)} placeholder={t.admin.enrichment.authorSearchPlaceholder} style={inputStyle} />
          {authorResults.length > 0 && <div style={{ position: 'absolute', zIndex: 10, left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: '8px' }}>{authorResults.map((author) => <button key={author.id} type="button" onClick={() => linkAuthor(author.id)} style={{ display: 'block', width: '100%', padding: '9px 12px', textAlign: 'left', border: 0, background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>{author.display_name || author.name}</button>)}</div>}
        </div>
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.bookWorkspace.bibliography}>
        <DetailGrid columns={2}>
          <Field label={t.admin.bookWorkspace.publicationLink}><select value={publicationId} onChange={(e) => setPublication(e.target.value)} style={inputStyle}><option value="">{t.admin.bookWorkspace.noPublication}</option>{publicationOptions.map((publication) => <option key={publication.id} value={publication.id}>{publication.title} ({publication.publication_year})</option>)}</select></Field>
          <Field label={t.admin.books.originalYear}><input type="number" value={form.year} onChange={(e) => set('year', e.target.value)} style={inputStyle} /></Field>
          <Field label={t.admin.books.originalLanguage}><input value={form.language} onChange={(e) => set('language', e.target.value)} style={inputStyle} /></Field>
          <Field label={t.admin.books.countryOfOrigin}><input value={form.country} onChange={(e) => set('country', e.target.value)} style={inputStyle} /></Field>
          <Field label={t.admin.books.publicationType}><select value={form.publicationType} onChange={(e) => set('publicationType', e.target.value)} style={inputStyle}><option value="official">{t.admin.books.officialDesc}</option><option value="unofficial">{t.admin.books.unofficialDesc}</option></select></Field>
          <Field label={t.admin.enrichment.series}><input value={form.series} onChange={(e) => set('series', e.target.value)} style={inputStyle} /></Field>
          <Field label={t.admin.enrichment.seriesPosition}><input type="number" value={form.seriesPosition} onChange={(e) => set('seriesPosition', e.target.value)} style={inputStyle} /></Field>
        </DetailGrid>
      </EditorSectionCard>
      {saveError && <div style={{ color: 'var(--error)', fontSize: '13px' }}>{saveError}</div>}
      <ActionBar onSave={save} onCancel={reset} saving={saving} dirty={dirty} saveLabel={t.admin.common.save} savingLabel={t.admin.common.saving} cancelLabel={t.admin.common.cancel} />
    </div>
  );
}
