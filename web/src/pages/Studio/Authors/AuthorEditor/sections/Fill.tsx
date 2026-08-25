import { useCallback, useEffect, useState } from 'react';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import { apiClient } from '../../../../../shared/api/client';
import type { ResearchCorpusSummary, SyvaiRun } from '../../../../../types/admin';
import { useAuthorEditor } from '../AuthorEditorContext';

const DOMAINS = [
  { key: 'identity', label: 'Identity', description: 'Names, places, citizenship, residence, and occupations.' },
  { key: 'biography', label: 'Biography', description: 'Biography and active years.' },
  { key: 'literary_context', label: 'Literary context', description: 'Genres, themes, movements, and related taxonomy.' },
  { key: 'timeline', label: 'Timeline', description: 'Grounded life and career events.' },
] as const;

export default function Fill() {
  const { author, refreshSummary } = useAuthorEditor();
  const authorId = author?.id;
  const [corpus, setCorpus] = useState<ResearchCorpusSummary | null>(null);
  const [runs, setRuns] = useState<SyvaiRun[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [message, setMessage] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!authorId) return;
    const [corpusResponse, runResponse] = await Promise.all([
      apiClient.get<ResearchCorpusSummary>(`/admin/authors/${authorId}/research-corpus`),
      apiClient.get<{ data: SyvaiRun[] }>(`/admin/authors/${authorId}/ai/runs`),
    ]);
    setCorpus(corpusResponse.data); setRuns(runResponse.data.data || []);
  }, [authorId]);
  useEffect(() => { load().catch((e) => setError(e?.response?.data?.detail || e.message || 'Fill status could not be loaded')); }, [load]);
  if (!author) return null;
  const run = async (domain: typeof DOMAINS[number]['key']) => {
    if (running || !corpus?.domains[domain]?.available) return;
    setRunning(domain); setError(null);
    try {
      const url = domain === 'timeline' ? `/admin/authors/${authorId}/ai/timeline` : `/admin/authors/${authorId}/ai/fill`;
      const response = await apiClient.post(url, domain === 'timeline' ? undefined : { domain });
      const count = response.data?.proposals?.length ?? response.data?.run?.proposal_count ?? 0;
      setMessage((old) => ({ ...old, [domain]: `${response.data?.message || 'Run completed'} · ${count} proposal${count === 1 ? '' : 's'}` }));
      await Promise.all([load(), Promise.resolve(refreshSummary())]);
    } catch (e: any) { setError(e?.response?.data?.detail || e.message || 'Fill run failed'); }
    finally { setRunning(null); }
  };
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <EditorSectionCard title="Fill" description="Run one grounded research domain at a time. Every result remains a proposal until a human reviews and explicitly applies it.">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {DOMAINS.map((domain) => { const state = corpus?.domains[domain.key]; const capable = corpus?.verified_sources.filter((s) => (s.stored_content_capabilities || s.content_capabilities).includes(domain.key.toUpperCase())).length || 0; return <div key={domain.key} style={{ padding: 14, border: '1px solid var(--border-soft)', borderRadius: 9, background: 'var(--surface-hover)' }}>
          <strong>{domain.label}</strong><p style={{ fontSize: 12, color: 'var(--text-muted)', minHeight: 34 }}>{domain.description}</p>
          <div style={{ fontSize: 11, color: state?.available ? '#4CAF50' : '#FFA726', marginBottom: 10 }}>{state?.available ? `${capable} verified capable source${capable === 1 ? '' : 's'}` : state?.reason || 'Checking verified corpus…'}</div>
          <button type="button" disabled={!state?.available || !!running} onClick={() => run(domain.key)} style={{ padding: '7px 12px', border: 0, borderRadius: 6, background: 'var(--accent)', color: '#fff', opacity: !state?.available || running ? .5 : 1, cursor: state?.available && !running ? 'pointer' : 'not-allowed' }}>{running === domain.key ? 'Running…' : `Run ${domain.label}`}</button>
          {message[domain.key] && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>{message[domain.key]}</div>}
        </div>; })}
      </div>
      {error && <div style={{ color: 'var(--error)', fontSize: 13, marginTop: 12 }}>{error}</div>}
    </EditorSectionCard>
    <EditorSectionCard title="Recent SyvAI runs" description="Operational details stay secondary to the editorial result.">
      {runs.slice(0, 10).map((run) => <div key={run.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 12 }}><strong>{run.domain.replace('_', ' ')}</strong> · {run.status} · {run.proposal_count || 0} proposals · {run.source_count} sources <span style={{ color: 'var(--text-muted)' }}>{run.created_at ? new Date(run.created_at).toLocaleString() : ''}</span>{run.error && <div style={{ color: 'var(--error)' }}>{run.error}</div>}<details style={{ color: 'var(--text-muted)', marginTop: 4 }}><summary>Technical details</summary>{run.provider}{run.model ? ` / ${run.model}` : ''} · {run.total_tokens || 0} tokens · {run.duration_ms ? `${Math.round(run.duration_ms / 1000)}s` : 'duration unavailable'}</details></div>)}
      {!runs.length && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No SyvAI runs yet.</div>}
    </EditorSectionCard>
  </div>;
}
