import { useState, useEffect, useCallback } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import { apiClient } from '../../../../../shared/api/client';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import type { ResearchCorpusSummary, Source, SourceCreate } from '../../../../../types/admin';

function emptySource(): SourceCreate {
  return { title: '', source_type: 'website', url: null, citation: null, notes: null };
}
const SOURCE_TYPES = ['website', 'book', 'interview', 'archive', 'journal', 'encyclopedia', 'other'];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '14px',
  background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--text-muted)', marginBottom: '4px',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  );
}

export default function Sources() {
  const { author, refreshSummary } = useAuthorEditor();
  const t = getLocaleData(getBrowserLocale());
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<SourceCreate>(emptySource());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [corpus, setCorpus] = useState<ResearchCorpusSummary | null>(null);
  const [reinspecting, setReinspecting] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    if (!author) return;
    setLoading(true);
    try {
      const [res, corpusRes] = await Promise.all([
        apiClient.get(`/admin/authors/${author.id}/sources`),
        apiClient.get<ResearchCorpusSummary>(`/admin/authors/${author.id}/research-corpus`),
      ]);
      setSources(res.data?.data || []); setCorpus(corpusRes.data);
    } catch {
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, [author]);

  useEffect(() => {
    if (author) fetchSources();
  }, [author, fetchSources]);

  const st = t.admin.authors.editor.sources;

  const startAdd = () => {
    setDraft(emptySource());
    setEditingIdx(-1);
    setError(null);
  };

  const startEdit = (idx: number) => {
    const s = sources[idx];
    setDraft({ title: s.title, source_type: s.source_type, url: s.url, citation: s.citation, notes: s.notes });
    setEditingIdx(idx);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setDraft(emptySource());
    setError(null);
  };

  const saveSource = async () => {
    if (!draft.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingIdx === -1) {
        await apiClient.post(`/admin/authors/${author.id}/sources`, draft);
      } else if (editingIdx !== null && sources[editingIdx]) {
        await apiClient.put(`/admin/authors/${author.id}/sources/${sources[editingIdx].id}`, draft);
      }
      cancelEdit();
      await fetchSources();
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || st.errorSave);
    } finally {
      setSaving(false);
    }
  };

  const deleteSource = async (idx: number) => {
    const s = sources[idx];
    if (!s?.id) return;
    if (!window.confirm(st.confirmedDelete)) return;
    try {
      await apiClient.delete(`/admin/authors/${author.id}/sources/${s.id}`);
      await fetchSources();
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || st.errorDelete);
    }
  };

  const reinspect = async (sourceId: string) => {
    setReinspecting(sourceId); setError(null);
    try {
      await apiClient.post(`/admin/authors/${author.id}/sources/${sourceId}/reinspect`);
      await fetchSources(); refreshSummary();
    } catch (e: any) { setError(e?.response?.data?.detail || e.message || 'Source content reinspection failed'); }
    finally { setReinspecting(null); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {corpus && <EditorSectionCard title="Verified research corpus" description="Identity trust and inspected content capability are separate. Only these verified, current capabilities can enable Fill.">
        {corpus.verified_sources.map((source) => <div key={source.id} style={{ padding: 12, border: '1px solid var(--border-soft)', borderRadius: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong style={{ fontSize: 13 }}>{source.title}</strong><span style={{ fontSize: 10, color: '#4CAF50' }}>{source.trust_state.replace(/_/g, ' ')}</span></div>
          {source.url && <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--accent)' }}>{source.url}</a>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}><div style={{ padding: 8, background: 'var(--surface-hover)', borderRadius: 6, fontSize: 11 }}><strong>Identity trust</strong><br />{source.trust_state.replace(/_/g, ' ')}</div><div style={{ padding: 8, background: 'var(--surface-hover)', borderRadius: 6, fontSize: 11 }}><strong>Content capabilities</strong><br />{source.stored_content_capabilities.length ? source.stored_content_capabilities.join(' · ') : 'None'}</div></div>
          {source.reinspection_required && <div style={{ marginTop: 8, padding: 8, background: 'rgba(255,167,38,.1)', borderRadius: 6, fontSize: 11 }}>Content inspection is outdated; this source cannot enable Fill until explicitly reinspected. <button type="button" disabled={reinspecting === source.id} onClick={() => reinspect(source.id)} style={{ marginLeft: 8 }}>{reinspecting === source.id ? 'Re-inspecting…' : 'Re-inspect content'}</button></div>}
        </div>)}
        {!corpus.verified_sources.length && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No verified sources. Review source candidates before using Fill.</div>}
      </EditorSectionCard>}
      {loading && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {t.admin.common.loading}
        </div>
      )}

      {!loading && sources.length === 0 && editingIdx === null && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          {st.noSources}
        </div>
      )}

      {!loading && sources.map((s, i) => (
        <EditorSectionCard key={s.id} title={s.title}>
          {s.citation && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontStyle: 'italic' }}>{s.citation}</div>}
          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            <span>{s.source_type}</span>
            {s.url && <span>В· <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{s.url}</a></span>}
          </div>
          {s.notes && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.notes}</div>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button type="button" onClick={() => startEdit(i)}
              style={{ fontSize: '12px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
              {t.admin.common.edit}
            </button>
            <button type="button" onClick={() => deleteSource(i)}
              style={{ fontSize: '12px', color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
              {st.deleteSource}
            </button>
          </div>
        </EditorSectionCard>
      ))}

      {editingIdx !== null && (
        <EditorSectionCard title={editingIdx === -1 ? st.addSource : st.editSource}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label={st.title}>
              <input type="text" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                style={inputStyle} />
            </Field>
            <Field label={st.sourceType}>
              <select value={draft.source_type} onChange={(e) => setDraft({ ...draft, source_type: e.target.value })}
                style={inputStyle}>
                {SOURCE_TYPES.map((stype) => (
                  <option key={stype} value={stype}>{st.sourceTypes[stype as keyof typeof st.sourceTypes]}</option>
                ))}
              </select>
            </Field>
            <Field label={st.url}>
              <input type="text" value={draft.url || ''} onChange={(e) => setDraft({ ...draft, url: e.target.value || null })}
                style={inputStyle} placeholder="https://" />
            </Field>
            <Field label={st.citation}>
              <textarea value={draft.citation || ''} onChange={(e) => setDraft({ ...draft, citation: e.target.value || null })}
                style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />
            </Field>
            <Field label={st.notes}>
              <textarea value={draft.notes || ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value || null })}
                style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />
            </Field>
            {error && (
              <div style={{ fontSize: '13px', color: 'var(--error)' }}>{error}</div>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={cancelEdit} disabled={saving}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-soft)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                {t.admin.common.cancel}
              </button>
              <button type="button" onClick={saveSource} disabled={saving || !draft.title.trim()}
                style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                {saving ? t.admin.common.saving : t.admin.common.save}
              </button>
            </div>
          </div>
        </EditorSectionCard>
      )}

      {editingIdx === null && !loading && (
        <button type="button" onClick={startAdd}
          style={{
            padding: '12px', background: 'var(--surface-hover)', borderRadius: '8px',
            border: '1px dashed var(--border-soft)',
            fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer',
          }}>
          {st.addSource}
        </button>
      )}
    </div>
  );
}
