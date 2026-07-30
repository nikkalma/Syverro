import { useState, useEffect, useCallback } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import { apiClient } from '../../../../../shared/api/client';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import type { AuthorPublication, AuthorPublicationCreate } from '../../../../../types/admin';

const PUBLICATION_TYPES = ['novel', 'poetry', 'essay', 'collection', 'posthumous', 'other'];

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

function emptyPublication(): AuthorPublicationCreate {
  return { title: '', original_title: null, publication_year: new Date().getFullYear(), publication_date: null, publication_type: 'novel', description: null, pen_name: null, wikipedia_url: null, source_id: null };
}

export default function Publications() {
  const { author } = useAuthorEditor();
  const t = getLocaleData(getBrowserLocale());
  const [publications, setPublications] = useState<AuthorPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<AuthorPublicationCreate>(emptyPublication());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPublications = useCallback(async () => {
    if (!author) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/authors/${author.id}/publications`);
      setPublications(res.data?.data || []);
    } catch {
      setPublications([]);
    } finally {
      setLoading(false);
    }
  }, [author]);

  useEffect(() => {
    if (author) fetchPublications();
  }, [author, fetchPublications]);

  const st = (t.admin.authors.editor.publications || {}) as Record<string, string>;

  const startAdd = () => {
    setDraft(emptyPublication());
    setEditingIdx(-1);
    setError(null);
  };

  const startEdit = (idx: number) => {
    const p = publications[idx];
    setDraft({
      title: p.title,
      original_title: p.original_title,
      publication_year: p.publication_year,
      publication_date: p.publication_date,
      publication_type: p.publication_type,
      description: p.description,
      pen_name: p.pen_name,
      wikipedia_url: p.wikipedia_url,
      source_id: p.source_id,
    });
    setEditingIdx(idx);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setDraft(emptyPublication());
    setError(null);
  };

  const savePublication = async () => {
    if (!draft.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingIdx === -1) {
        await apiClient.post(`/admin/authors/${author!.id}/publications`, draft);
      } else if (editingIdx !== null && publications[editingIdx]) {
        await apiClient.put(`/admin/authors/${author!.id}/publications/${publications[editingIdx].id}`, draft);
      }
      cancelEdit();
      await fetchPublications();
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || 'Failed to save publication');
    } finally {
      setSaving(false);
    }
  };

  const deletePublication = async (idx: number) => {
    const p = publications[idx];
    if (!p?.id) return;
    if (!window.confirm(st.confirmedDelete)) return;
    try {
      await apiClient.delete(`/admin/authors/${author!.id}/publications/${p.id}`);
      await fetchPublications();
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || 'Failed to delete publication');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {loading && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {t.admin.common.loading}
        </div>
      )}

      {!loading && publications.length === 0 && editingIdx === null && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          {st.noPublications}
        </div>
      )}

      {!loading && publications.map((p, i) => (
        <EditorSectionCard key={p.id} title={p.title}>
          <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', flexWrap: 'wrap' }}>
            {p.original_title && <span>{p.original_title}</span>}
            <span>{p.publication_year}</span>
            <span style={{ color: 'var(--text-muted)' }}>{st[p.publication_type] || p.publication_type}</span>
            {p.pen_name && <span style={{ color: 'var(--accent)' }}>as {p.pen_name}</span>}
          </div>
          {p.description && (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.5 }}>{p.description}</div>
          )}
          {p.wikipedia_url && (
            <div style={{ marginBottom: '8px' }}>
              <a href={p.wikipedia_url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>
                Wikipedia
              </a>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => startEdit(i)}
              style={{ fontSize: '12px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
              {t.admin.common.edit}
            </button>
            <button type="button" onClick={() => deletePublication(i)}
              style={{ fontSize: '12px', color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
              {st.deletePublication}
            </button>
          </div>
        </EditorSectionCard>
      ))}

      {editingIdx !== null && (
        <EditorSectionCard title={editingIdx === -1 ? st.addPublication : st.editPublication}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label={st.title}>
              <input type="text" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                style={inputStyle} />
            </Field>
            <Field label={st.originalTitle}>
              <input type="text" value={draft.original_title || ''} onChange={(e) => setDraft({ ...draft, original_title: e.target.value || null })}
                style={inputStyle} />
            </Field>
            <Field label={st.publicationYear}>
              <input type="number" value={draft.publication_year} onChange={(e) => setDraft({ ...draft, publication_year: parseInt(e.target.value) || 0 })}
                style={inputStyle} />
            </Field>
            <Field label={st.publicationDate}>
              <input type="date" value={draft.publication_date || ''} onChange={(e) => setDraft({ ...draft, publication_date: e.target.value || null })}
                style={inputStyle} />
            </Field>
            <Field label={st.publicationType}>
              <select value={draft.publication_type} onChange={(e) => setDraft({ ...draft, publication_type: e.target.value })}
                style={inputStyle}>
                {PUBLICATION_TYPES.map((pt) => (
                  <option key={pt} value={pt}>{st[pt] || pt}</option>
                ))}
              </select>
            </Field>
            <Field label={st.penName || 'Pen name'}>
              <input type="text" value={draft.pen_name || ''} onChange={(e) => setDraft({ ...draft, pen_name: e.target.value || null })}
                style={inputStyle} placeholder="e.g. Currer Bell" />
            </Field>
            <Field label={st.wikipediaUrl || 'Wikipedia URL'}>
              <input type="url" value={draft.wikipedia_url || ''} onChange={(e) => setDraft({ ...draft, wikipedia_url: e.target.value || null })}
                style={inputStyle} placeholder="https://en.wikipedia.org/wiki/Jane_Eyre" />
            </Field>
            <Field label={st.description}>
              <textarea value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value || null })}
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
            </Field>
            {error && (
              <div style={{ fontSize: '13px', color: 'var(--error)' }}>{error}</div>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={cancelEdit} disabled={saving}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-soft)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                {t.admin.common.cancel}
              </button>
              <button type="button" onClick={savePublication} disabled={saving || !draft.title.trim()}
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
          {st.addPublication}
        </button>
      )}
    </div>
  );
}
