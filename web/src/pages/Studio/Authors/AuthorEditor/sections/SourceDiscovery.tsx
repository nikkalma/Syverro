import { useState, useEffect, useCallback } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import { apiClient } from '../../../../../shared/api/client';
import type {
  DiscoveryRun, DiscoveryRunResponse, DiscoveryMetrics, DiscoveryStatus, SourceCandidate,
} from '../../../../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';

const ASSESSMENT_LABELS: Record<string, string> = {
  auto_usable: 'Auto-usable',
  needs_review: 'Needs review',
  rejected: 'Rejected',
};

const ASSESSMENT_COLORS: Record<string, string> = {
  auto_usable: '#4CAF50',
  needs_review: '#FFA726',
  rejected: '#EF5350',
};

const TIER_COLORS: Record<string, string> = {
  high: '#4CAF50',
  medium: '#FFA726',
  low: '#EF5350',
  unknown: '#97A6BA',
};

const RUN_STATUS_COLORS: Record<string, string> = {
  completed: '#4CAF50',
  review_needed: '#FFA726',
  failed: '#EF5350',
  running: '#5B86A1',
};

const REVIEW_ACTION_COLORS: Record<string, string> = {
  approved: '#4CAF50',
  rejected: '#EF5350',
  auto_approved: '#5B86A1',
};

export default function SourceDiscovery() {
  const { author } = useAuthorEditor();
  const t = getLocaleData(getBrowserLocale());
  const copy = t.admin.authors.editor.discovery;

  const [status, setStatus] = useState<DiscoveryStatus | null>(null);
  const [runs, setRuns] = useState<DiscoveryRun[]>([]);
  const [candidates, setCandidates] = useState<SourceCandidate[]>([]);
  const [metrics, setMetrics] = useState<DiscoveryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessmentFilter, setAssessmentFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const fetchAll = useCallback(async () => {
    if (!author) return;
    setLoading(true);
    setError(null);
    try {
      const statusRes = await apiClient.get<DiscoveryStatus>(`/admin/authors/${author.id}/discovery/status`);
      setStatus(statusRes.data);
      const [candidatesRes, runsRes, metricsRes] = await Promise.all([
        apiClient.get<{ data: SourceCandidate[] }>(`/admin/authors/${author.id}/discovery/candidates`),
        apiClient.get<{ data: DiscoveryRun[] }>(`/admin/authors/${author.id}/discovery/runs`),
        apiClient.get<DiscoveryMetrics>(`/admin/authors/${author.id}/discovery/metrics`),
      ]);
      setCandidates(candidatesRes.data?.data || []);
      setRuns(runsRes.data?.data || []);
      setMetrics(metricsRes.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || copy.errorLoad);
    } finally {
      setLoading(false);
    }
  }, [author, copy.errorLoad]);

  useEffect(() => {
    if (author) fetchAll();
  }, [author, fetchAll]);

  const configured = !!status?.configured && status.status === 'OK';

  const runDiscovery = async () => {
    if (!author || running || !configured) return;
    setRunning(true);
    setError(null);
    try {
      const res = await apiClient.post<DiscoveryRunResponse>(`/admin/authors/${author.id}/discovery/run`);
      setRuns((prev) => [res.data.run, ...prev]);
      await fetchAll();
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || copy.errorRun);
    } finally {
      setRunning(false);
    }
  };

  const reviewCandidate = async (candidateId: string, action: 'approve' | 'reject') => {
    if (!author) return;
    setError(null);
    try {
      await apiClient.post(`/admin/authors/${author.id}/discovery/candidates/${candidateId}/${action}`);
      await fetchAll();
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || copy.errorReview);
    }
  };

  if (!author) return null;

  const filtered = candidates.filter((c) => {
    if (assessmentFilter && c.assessment !== assessmentFilter) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    return true;
  });

  const assessmentCounts = candidates.reduce<Record<string, number>>((acc, c) => {
    acc[c.assessment] = (acc[c.assessment] || 0) + 1;
    return acc;
  }, {});

  const pendingCount = metrics?.candidates_pending ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={copy.title} description={copy.description}>
        {status && !configured && (
          <div style={{
            padding: '12px', borderRadius: '8px', marginBottom: '16px',
            background: 'rgba(255,167,38,0.1)', border: '1px solid rgba(255,167,38,0.3)',
            fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5,
          }}>
            <strong style={{ color: '#FFA726', marginRight: '8px' }}>{copy.notConfigured}</strong>
            {copy.notConfiguredHint}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>{copy.statusLabel}: {status?.status || '…'}</span>
            <span>{copy.providerLabel}: {status?.provider || '—'}</span>
          </div>
          <button type="button" onClick={runDiscovery} disabled={running || !configured}
            style={{
              padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: configured ? 'pointer' : 'not-allowed',
              background: 'var(--accent)', border: 'none', color: '#fff',
              opacity: running || !configured ? 0.6 : 1, whiteSpace: 'nowrap',
            }}>
            {running ? copy.running : copy.run}
          </button>
        </div>

        {metrics && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {[
              { label: copy.totalCandidates, value: String(metrics.candidates_total), color: '#5B86A1' },
              { label: copy.pendingCandidates, value: String(pendingCount), color: '#FFA726' },
              { label: copy.autoApprovedSources, value: String(metrics.auto_approved_sources), color: '#4CAF50' },
              { label: copy.humanActions, value: String(metrics.human_actions_per_author), color: '#A855F7' },
            ].map((m) => (
              <div key={m.label} style={{
                padding: '8px 14px', borderRadius: '8px',
                background: 'var(--surface-hover)', border: '1px solid var(--border-soft)',
              }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        )}

        {runs.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
              {copy.runs}
            </div>
            {runs.slice(0, 5).map((run) => (
              <div key={run.id} style={{
                padding: '6px 12px', marginBottom: '4px', borderRadius: '6px',
                background: 'var(--surface)', border: '1px solid var(--border-soft)',
                display: 'flex', gap: '12px', alignItems: 'center', fontSize: '12px',
              }}>
                <span style={{ color: RUN_STATUS_COLORS[run.status] || 'var(--text-muted)', fontWeight: 500 }}>
                  {run.status}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>{run.provider}</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {run.source_count} {copy.candidatesWord}
                  {run.duration_ms != null ? ` · ${Math.round(run.duration_ms / 1000)}s` : ''}
                </span>
                {run.error && <span style={{ color: 'var(--error)' }}>{run.error}</span>}
              </div>
            ))}
          </div>
        )}

        {runs.length === 0 && !loading && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0 0 12px 0' }}>
            {copy.noRuns}
          </p>
        )}

        {candidates.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => { setAssessmentFilter(undefined); setStatusFilter(undefined); }}
              style={{
                padding: '4px 12px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer',
                background: !assessmentFilter && !statusFilter ? 'var(--accent)' : 'var(--surface-hover)',
                border: '1px solid var(--border-soft)',
                color: !assessmentFilter && !statusFilter ? '#fff' : 'var(--text-secondary)',
              }}>
              {t.admin.common.all} ({candidates.length})
            </button>
            {Object.keys(ASSESSMENT_LABELS).map((a) => (
              <button key={a} type="button" onClick={() => setAssessmentFilter(a)}
                style={{
                  padding: '4px 12px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer',
                  background: assessmentFilter === a ? ASSESSMENT_COLORS[a] : 'var(--surface-hover)',
                  border: '1px solid var(--border-soft)',
                  color: assessmentFilter === a ? '#fff' : 'var(--text-secondary)',
                }}>
                {copy.assessments[a as keyof typeof copy.assessments] || ASSESSMENT_LABELS[a]} ({assessmentCounts[a] || 0})
              </button>
            ))}
          </div>
        )}

        {loading && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t.admin.common.loading}</div>}

        {!loading && filtered.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            {assessmentFilter || statusFilter ? copy.noFilteredCandidates : copy.noCandidates}
          </p>
        )}

        {filtered.map((c) => (
          <div key={c.id} style={{
            padding: '12px 16px', marginBottom: '8px',
            background: 'var(--surface-hover)', borderRadius: '8px',
            border: '1px solid var(--border-soft)',
            opacity: c.status === 'reviewed' && c.review_action === 'rejected' ? 0.5 : 1,
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                textTransform: 'uppercase', fontWeight: 500,
                background: `${ASSESSMENT_COLORS[c.assessment] || '#97A6BA'}1f`,
                color: ASSESSMENT_COLORS[c.assessment] || '#97A6BA',
              }}>
                {copy.assessments[c.assessment as keyof typeof copy.assessments] || ASSESSMENT_LABELS[c.assessment] || c.assessment}
              </span>
              <span style={{
                padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                textTransform: 'uppercase', fontWeight: 500,
                background: `${TIER_COLORS[c.authority_tier] || '#97A6BA'}1f`,
                color: TIER_COLORS[c.authority_tier] || '#97A6BA',
              }}>
                {copy.authorityTiers[c.authority_tier as keyof typeof copy.authorityTiers] || c.authority_tier}
              </span>
              {c.review_action && (
                <span style={{
                  padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                  textTransform: 'uppercase', fontWeight: 500,
                  background: `${REVIEW_ACTION_COLORS[c.review_action] || '#97A6BA'}1f`,
                  color: REVIEW_ACTION_COLORS[c.review_action] || '#97A6BA',
                }}>
                  {c.review_action}
                </span>
              )}
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {c.quality_score != null ? `${(c.quality_score * 100).toFixed(0)}%` : ''}
              </span>
            </div>

            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {c.title || c.normalized_url}
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{c.url}</a>
              {c.provider && <span> · {c.provider}</span>}
              {c.source_type && <span> · {c.source_type}</span>}
            </div>

            {c.evidence && (
              <div style={{
                padding: '8px', borderRadius: '6px', marginBottom: '8px',
                background: 'var(--surface)', border: '1px solid var(--border-soft)',
                fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5,
              }}>
                {c.evidence}
              </div>
            )}

            {c.assessment_reason && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '8px' }}>
                {c.assessment_reason}
              </div>
            )}

            {c.status === 'pending' && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => reviewCandidate(c.id, 'reject')}
                  style={{
                    padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                    background: 'transparent', border: '1px solid var(--border-soft)',
                    color: 'var(--error)',
                  }}>
                  {copy.reject}
                </button>
                <button type="button" onClick={() => reviewCandidate(c.id, 'approve')}
                  style={{
                    padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                    background: '#4CAF50', border: 'none', color: '#fff',
                  }}>
                  {copy.approve}
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
