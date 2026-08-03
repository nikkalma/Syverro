import { useEffect, useState } from 'react';
import { useBookWorkspace } from '../BookWorkspaceContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import ActionBar from '../../../../../components/Studio/shared/ActionBar';
import { apiClient } from '../../../../../shared/api/client';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import type { AdminGenre } from '../../../../../types/admin';

interface Relation { id: string; node_id: string; node_name: string | null; node_type: string | null; relation_type: string; status: string }
interface NodeResult { id: string; name: string; node_type: string }
const RELATION_TYPES = ['theme', 'motif', 'concept', 'atmosphere', 'literary_direction', 'place', 'language', 'timeline_event'] as const;

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-soft)', borderRadius: '8px', color: 'var(--text-primary)' };

export default function Knowledge() {
  const t = getLocaleData(getBrowserLocale());
  const { book, saving, saveEnrichment, refresh } = useBookWorkspace();
  const [genres, setGenres] = useState<AdminGenre[]>([]);
  const [genreIds, setGenreIds] = useState<string[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [queries, setQueries] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, NodeResult[]>>({});
  const [relationError, setRelationError] = useState<string | null>(null);

  const loadRelations = async () => {
    if (!book) return;
    const response = await apiClient.get(`/admin/books/${book.id}/taxonomy`);
    setRelations(response.data || []);
  };
  useEffect(() => {
    if (!book) return;
    setGenreIds(book.genre_ids || []);
    apiClient.get('/admin/genres', { params: { limit: 200 } }).then((response) => setGenres(response.data?.data || [])).catch(() => setGenres([]));
    loadRelations().catch(() => setRelations([]));
  }, [book?.id]);

  useEffect(() => {
    const timers = RELATION_TYPES.map((type) => {
      const query = queries[type]?.trim();
      if (!query) { setResults((current) => ({ ...current, [type]: [] })); return undefined; }
      return setTimeout(async () => {
        try {
          const response = await apiClient.get('/taxonomy/nodes', { params: { node_type: type, search: query } });
          const linked = new Set(relations.map((relation) => relation.node_id));
          setResults((current) => ({ ...current, [type]: (response.data || []).filter((node: NodeResult) => !linked.has(node.id)) }));
        } catch { setResults((current) => ({ ...current, [type]: [] })); }
      }, 250);
    });
    return () => timers.forEach((timer) => timer && clearTimeout(timer));
  }, [queries, relations]);

  if (!book) return null;
  const toggleGenre = (id: string) => setGenreIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const addRelation = async (node: NodeResult, type: string) => {
    setRelationError(null);
    try {
      await apiClient.post(`/admin/books/${book.id}/taxonomy`, { node_id: node.id, relation_type: type, status: 'approved' });
      setQueries((current) => ({ ...current, [type]: '' }));
      await loadRelations();
      await refresh();
    } catch {
      setRelationError(t.admin.bookWorkspace.relationSaveError);
    }
  };
  const removeRelation = async (id: string) => { await apiClient.delete(`/admin/books/${book.id}/taxonomy/${id}`); await loadRelations(); await refresh(); };
  const taxonomyLabels: Record<string, string> = {
    theme: t.bookPage.themes,
    motif: t.bookPage.motifs,
    concept: t.bookPage.concepts,
    atmosphere: t.bookPage.atmospheres,
    literary_direction: t.admin.entities.entityTypes.literary_direction,
    place: t.admin.entities.entityTypes.place,
    timeline_event: t.admin.entities.entityTypes.timeline_event,
    language: t.bookPage.metadata.language,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {relationError ? <div role="alert" style={{ color: 'var(--error)', fontSize: '13px' }}>{relationError}</div> : null}
      <EditorSectionCard title={t.admin.books.genres}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{genres.map((genre) => <button key={genre.id} type="button" onClick={() => toggleGenre(genre.id)} style={{ padding: '6px 10px', borderRadius: '14px', cursor: 'pointer', border: '1px solid var(--border-soft)', background: genreIds.includes(genre.id) ? 'var(--primary-soft)' : 'var(--surface-hover)', color: genreIds.includes(genre.id) ? 'var(--primary)' : 'var(--text-secondary)' }}>{genre.name}</button>)}</div>
        <div style={{ marginTop: '16px' }}><ActionBar onSave={async () => { await saveEnrichment({ genre_ids: genreIds }); await refresh(); }} onCancel={() => setGenreIds(book.genre_ids || [])} saving={saving} dirty={genreIds.join(',') !== (book.genre_ids || []).join(',')} saveLabel={t.admin.common.save} savingLabel={t.admin.common.saving} cancelLabel={t.admin.common.cancel} /></div>
      </EditorSectionCard>

      {RELATION_TYPES.map((type) => {
        const items = relations.filter((relation) => relation.node_type === type || relation.relation_type === type);
        return <EditorSectionCard key={type} title={taxonomyLabels[type] || type.replace(/_/g, ' ')}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>{items.map((relation) => <span key={relation.id} style={{ padding: '5px 10px', borderRadius: '14px', background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}>{relation.node_name} <button type="button" onClick={() => removeRelation(relation.id)} style={{ border: 0, background: 'none', color: 'var(--error)', cursor: 'pointer' }}>×</button></span>)}{items.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t.admin.bookWorkspace.noRelations}</span>}</div>
          <div style={{ position: 'relative' }}><input value={queries[type] || ''} onChange={(event) => setQueries((current) => ({ ...current, [type]: event.target.value }))} placeholder={t.admin.bookWorkspace.searchRelations} style={inputStyle} />{(results[type] || []).length > 0 && <div style={{ position: 'absolute', zIndex: 10, left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: '8px' }}>{results[type].map((node) => <button key={node.id} type="button" onClick={() => addRelation(node, type)} style={{ display: 'block', width: '100%', padding: '9px 12px', textAlign: 'left', border: 0, background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>{node.name}</button>)}</div>}</div>
        </EditorSectionCard>;
      })}
    </div>
  );
}
