import { useState, useEffect, useCallback } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import { apiClient } from '../../../../../shared/api/client';
import type { AIProposal } from '../../../../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';

export default function AIProposals() {
  const { author } = useAuthorEditor();
  const t = getLocaleData(getBrowserLocale());
  const copy = t.admin.studioCleanup;
  const proposalStatusLabels: Record<string, string> = {
    proposed: copy.proposed,
    accepted: copy.accepted,
    rejected: copy.rejected,
  };
  const [proposals, setProposals] = useState<AIProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | undefined>(undefined);

  const fetchProposals = useCallback(async () => {
    if (!author) return;
    setLoading(true);
    try {
      const params = filter ? { status_filter: filter } : {};
      const res = await apiClient.get(`/admin/authors/${author.id}/proposals`, { params });
      setProposals(res.data?.data || []);
    } catch {
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, [author, filter]);

  useEffect(() => {
    if (author) fetchProposals();
  }, [author, fetchProposals]);

  const updateStatus = async (proposalId: string, status: string) => {
    if (!author) return;
    try {
      await apiClient.put(`/admin/authors/${author.id}/proposals/${proposalId}`, { status });
      await fetchProposals();
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || copy.failedUpdate);
    }
  };

  if (!author) return null;

  const filtered = filter
    ? proposals.filter((p) => p.status === filter)
    : proposals;

  const statusCounts = proposals.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const filters = ['proposed', 'accepted', 'rejected'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={copy.aiTitle}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
          {copy.aiDescription}
        </p>

        {proposals.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setFilter(undefined)}
              style={{
                padding: '4px 12px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer',
                background: !filter ? 'var(--accent)' : 'var(--surface-hover)',
                border: '1px solid var(--border-soft)',
                color: !filter ? '#fff' : 'var(--text-secondary)',
              }}>
              {t.admin.common.all} ({proposals.length})
            </button>
            {filters.map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                style={{
                  padding: '4px 12px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer',
                  background: filter === f ? 'var(--accent)' : 'var(--surface-hover)',
                  border: '1px solid var(--border-soft)',
                  color: filter === f ? '#fff' : 'var(--text-secondary)',
                }}>
                {proposalStatusLabels[f]} ({statusCounts[f] || 0})
              </button>
            ))}
          </div>
        )}

        {loading && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{copy.loadingSuggestions}</div>}

        {!loading && filtered.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            {filter
              ? copy.noFilteredSuggestions
              : copy.noSuggestions}
          </p>
        )}

        {filtered.map((p) => (
          <div key={p.id} style={{
            padding: '12px 16px', marginBottom: '8px',
            background: 'var(--surface-hover)', borderRadius: '8px',
            border: '1px solid var(--border-soft)',
            opacity: p.status === 'rejected' ? 0.5 : 1,
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{
                padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                textTransform: 'uppercase', fontWeight: 500,
                background: p.source_type === 'ai' ? 'rgba(91,134,161,0.15)' : 'rgba(76,175,80,0.15)',
                color: p.source_type === 'ai' ? '#5B86A1' : '#4CAF50',
              }}>
                {p.source_type === 'ai' ? copy.aiTitle : p.source_type}
              </span>
              <span style={{
                padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                textTransform: 'uppercase', fontWeight: 500,
                background: p.status === 'proposed' ? 'rgba(255,167,38,0.15)' :
                  p.status === 'accepted' ? 'rgba(76,175,80,0.15)' : 'rgba(239,83,80,0.15)',
                color: p.status === 'proposed' ? '#FFA726' :
                  p.status === 'accepted' ? '#4CAF50' : '#EF5350',
              }}>
                {proposalStatusLabels[p.status] || p.status}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {(p.confidence * 100).toFixed(0)}% {copy.confidence}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {p.entity_type} → {p.field_name}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                padding: '8px', borderRadius: '6px',
                background: 'var(--surface)', border: '1px solid var(--border-soft)',
              }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  {copy.currentValue}
                </div>
                <div style={{ fontSize: '13px', color: p.current_value ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: p.current_value ? 'normal' : 'italic' }}>
                  {p.current_value || copy.empty}
                </div>
              </div>
              <div style={{
                padding: '8px', borderRadius: '6px',
                background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)',
              }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#4CAF50', marginBottom: '2px' }}>
                  {copy.suggestedValue}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {p.suggested_value}
                </div>
              </div>
            </div>

            {p.status === 'proposed' && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => updateStatus(p.id, 'rejected')}
                  style={{
                    padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                    background: 'transparent', border: '1px solid var(--border-soft)',
                    color: 'var(--error)',
                  }}>
                  {copy.reject}
                </button>
                <button type="button" onClick={() => updateStatus(p.id, 'accepted')}
                  style={{
                    padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                    background: '#4CAF50', border: 'none', color: '#fff',
                  }}>
                  {copy.accept}
                </button>
              </div>
            )}
          </div>
        ))}

        {error && (
          <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: 'var(--error)', fontSize: '13px' }}>
            {error}
          </div>
        )}
      </EditorSectionCard>
    </div>
  );
}
