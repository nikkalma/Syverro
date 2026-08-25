import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import { apiClient } from '../../../../../shared/api/client';
import type { ResearchCorpusSummary } from '../../../../../types/admin';
import { useAuthorEditor } from '../AuthorEditorContext';

export default function ResearchOverview() {
  const { author, summary } = useAuthorEditor();
  const authorId = author?.id;
  const [corpus, setCorpus] = useState<ResearchCorpusSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!authorId) return;
    try {
      const response = await apiClient.get<ResearchCorpusSummary>(`/admin/authors/${authorId}/research-corpus`);
      setCorpus(response.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || 'Research overview could not be loaded');
    }
  }, [authorId]);
  useEffect(() => { load(); }, [load]);
  if (!author) return null;
  const base = `/authors/${author.id}/edit`;
  const next = corpus?.needs_review_count
    ? { label: `Review ${corpus.needs_review_count} source${corpus.needs_review_count === 1 ? '' : 's'}`, path: 'discovery' }
    : corpus?.verified_sources.length
      ? { label: 'Choose a Fill domain', path: 'fill' }
      : { label: 'Find sources', path: 'discovery' };
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <EditorSectionCard title="Research overview" description="A read-only summary of source trust, usable content, and the next human action.">
      {error && <div style={{ color: 'var(--error)', fontSize: 13 }}>{error}</div>}
      {corpus && <>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {[['Verified sources', corpus.verified_sources.length], ['Needs source review', corpus.needs_review_count], ['Rejected', corpus.rejected_count], ['Proposals to review', summary?.pending_proposal_count ?? 0]].map(([label, value]) =>
            <div key={String(label)} style={{ padding: '10px 14px', border: '1px solid var(--border-soft)', borderRadius: 8, background: 'var(--surface-hover)' }}><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div><strong>{value}</strong></div>)}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Fill availability comes only from verified source capabilities</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8, marginBottom: 16 }}>
          {Object.entries(corpus.domains).filter(([d]) => d !== 'bibliography').map(([domain, state]) => <div key={domain} style={{ border: '1px solid var(--border-soft)', borderRadius: 8, padding: 10 }}>
            <strong style={{ fontSize: 12 }}>{domain.replace('_', ' ')}</strong>
            <div style={{ fontSize: 11, marginTop: 4, color: state.available ? '#4CAF50' : 'var(--text-muted)' }}>{state.available ? 'Available' : state.reason || 'No verified capable source'}</div>
          </div>)}
        </div>
        {corpus.legacy_auto_unverified_count > 0 && <div style={{ padding: 10, border: '1px solid rgba(255,167,38,.35)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 12, marginBottom: 16 }}>Legacy or stale sources are excluded until explicitly reviewed or reinspected. They do not make a domain available.</div>}
        <Link to={`${base}/${next.path}`} style={{ display: 'inline-block', padding: '8px 14px', borderRadius: 7, background: 'var(--accent)', color: '#fff', textDecoration: 'none', fontSize: 12 }}>{next.label}</Link>
      </>}
    </EditorSectionCard>
  </div>;
}
