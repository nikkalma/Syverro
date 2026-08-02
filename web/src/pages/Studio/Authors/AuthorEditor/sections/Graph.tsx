import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import { apiClient } from '../../../../../shared/api/client';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';

const RELATION_CONFIGS = [
  { type: 'relation', icon: '🔗', labelKey: 'relations' as const, nodeType: '' },
  { type: 'has_occupation', icon: '💼', labelKey: 'occupations' as const, nodeType: 'occupation' },
] as const;

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '14px',
  background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
};

export default function Graph() {
  const t = getLocaleData(getBrowserLocale());
  const { author } = useAuthorEditor();
  const graphLocale = t.admin.authors.editor.graph;

  const [relations, setRelations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchRelations = useCallback(async () => {
    if (!author) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/authors/${author.id}/knowledge`);
      setRelations(res.data || []);
    } catch { setRelations([]); }
    finally { setLoading(false); }
  }, [author]);

  useEffect(() => {
    if (author) fetchRelations();
  }, [author, fetchRelations]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || !activeType) { setSuggestions([]); return; }
    const config = RELATION_CONFIGS.find((rc) => rc.type === activeType);
    const nodeType = config?.nodeType;
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.get('/taxonomy/nodes', {
          params: nodeType ? { node_type: nodeType, search: query } : { search: query },
        });
        const nodes: any[] = res.data || [];
        const existingNodeIds = new Set(relations.filter((r) => r.relation_type === activeType).map((r) => r.node_id));
        setSuggestions(nodes.filter((n) => !existingNodeIds.has(n.id)));
      } catch { setSuggestions([]); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, activeType, relations]);

  const addRelation = async (nodeId: string) => {
    if (!author || !activeType) return;
    setSaving(true);
    try {
      await apiClient.post(`/admin/authors/${author.id}/knowledge`, {
        node_id: nodeId,
        relation_type: activeType,
        source: 'curator',
        status: 'verified',
        confidence: 1.0,
      });
      await fetchRelations();
    } catch (e) { console.error('Failed to add relation', e); }
    finally { setSaving(false); setQuery(''); }
  };

  const removeRelation = async (relationId: string) => {
    if (!author) return;
    try {
      await apiClient.delete(`/admin/authors/${author.id}/knowledge/${relationId}`);
      setRelations((prev) => prev.filter((r) => r.id !== relationId));
    } catch (e) { console.error('Failed to remove relation', e); }
  };

  if (!author) return null;

  const grouped = relations.reduce<Record<string, any[]>>((acc, r) => {
    (acc[r.relation_type] = acc[r.relation_type] || []).push(r);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={graphLocale.knowledgeGraph}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
          {graphLocale.workspaceDesc}
        </p>
        {loading && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{graphLocale.loading}</div>}
        {!loading && relations.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            {graphLocale.workspace}
          </p>
        )}
        {relations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
            {relations.map((r: any) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', background: 'var(--surface-hover)',
                borderRadius: '8px', fontSize: '13px',
              }}>
                <span style={{ color: 'var(--text-primary)', flex: 1 }}>
                  {r.node_name || r.node_id}
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '8px' }}>
                    ({r.relation_type})
                  </span>
                </span>
                <button type="button" onClick={() => removeRelation(r.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '16px' }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </EditorSectionCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
        {RELATION_CONFIGS.map((rc) => {
          const isActive = activeType === rc.type;
          const typeRelations = grouped[rc.type] || [];
          return (
            <div key={rc.type} style={{
              padding: '16px',
              background: 'var(--surface)',
              border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-soft)'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }} onClick={() => { setActiveType(isActive ? null : rc.type); setQuery(''); }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{rc.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {graphLocale[rc.labelKey]}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {typeRelations.length} {graphLocale.items}
              </div>
              {isActive && (
                <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '12px' }}>
                  {typeRelations.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                      {typeRelations.map((r: any) => (
                        <div key={r.id} style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '4px 8px', background: 'var(--surface-hover)',
                          borderRadius: '6px', fontSize: '12px',
                        }}>
                          <span style={{ flex: 1, color: 'var(--text-primary)' }}>{r.node_name}</span>
                          <button type="button" onClick={() => removeRelation(r.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '14px', padding: 0 }}>
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={graphLocale.searchNodes}
                    style={inputStyle}
                  />
                  {suggestions.length > 0 && (
                    <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {suggestions.map((n: any) => (
                        <div key={n.id}
                          onClick={() => addRelation(n.id)}
                          style={{
                            padding: '6px 10px', fontSize: '12px', cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            background: 'var(--surface-hover)', borderRadius: '6px',
                          }}>
                          {n.name}
                        </div>
                      ))}
                    </div>
                  )}
                  {saving && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{graphLocale.adding}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
