import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle, Clock, Eye, RefreshCw, ShieldAlert, XCircle } from 'lucide-react';
import { apiClient } from '../../../shared/api/client';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import type { AIProposal, BulkApplyResult, ReviewBulkResult, ReviewQueueCounts } from '../../../types/admin';

const BAND_COLORS: Record<string, string> = {
  auto_approved: '#4CAF50',
  auto_rejected: '#97A6BA',
  quality_review: '#EF5350',
  policy_review: '#5B86A1',
};

const BAND_LABELS: Record<string, string> = {
  auto_approved: 'auto-approved',
  auto_rejected: 'auto-rejected',
  quality_review: 'quality review',
  policy_review: 'policy review',
};

const STATUS_LABELS: Record<string, string> = {
  proposed: 'proposed',
  under_review: 'under review',
  accepted: 'accepted',
  rejected: 'rejected',
  applied: 'applied',
};

const REASON_LABELS: Record<string, string> = {
  new_grounded: 'new grounded claim',
  invalid_claim: 'invalid claim',
  exact_duplicate: 'exact duplicate of curated event',
  restatement: 'restatement of curated event',
  near_duplicate_ambiguous: 'ambiguous near-duplicate',
  date_conflict: 'conflicts with curated timeline',
  unsupported_claim: 'no supporting source evidence',
  ungrounded: 'no supporting evidence',
  posthumous_event: 'posthumous event (policy)',
  field_conflict: 'conflicts with current field value',
  unresolved_taxonomy: 'unresolved taxonomy reference',
};

const TIER_COLORS: Record<string, string> = {
  high: '#4CAF50',
  medium: '#FFA726',
  low: '#EF5350',
  unknown: '#97A6BA',
};

const CONFLICT_LABELS: Record<string, string> = {
  field_conflict: 'field conflict',
  same_value: 'same value',
  missing_value: 'missing value',
  no_conflict: 'no conflict',
};

function parseClaim(value?: string | null): Record<string, any> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function displayLines(value?: string | null): string[] {
  const parsed = parseClaim(value);
  if (!parsed) return value ? [value] : [];
  return [parsed.label, parsed.date_value, parsed.event_type, parsed.description]
    .filter(Boolean)
    .map((part: any) => String(part));
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 500,
      textTransform: 'uppercase', background: `${color}1f`, color, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

export default function AIReview() {
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);
  const ai = t.admin.moderation.aiReview;

  const [view, setView] = useState<'queue' | 'history'>('queue');
  const [proposals, setProposals] = useState<AIProposal[]>([]);
  const [counts, setCounts] = useState<ReviewQueueCounts | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [bandFilter, setBandFilter] = useState<string | undefined>(undefined);
  const [entityFilter, setEntityFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkResult, setBulkResult] = useState<ReviewBulkResult | null>(null);
  const [bulkApplyResult, setBulkApplyResult] = useState<BulkApplyResult | null>(null);
  const [detail, setDetail] = useState<AIProposal | null>(null);
  const [editedValue, setEditedValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (bandFilter) params.band = bandFilter;
      if (entityFilter) params.entity_type = entityFilter;
      const res = await apiClient.get('/admin/moderation/review-queue', { params });
      setProposals(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, bandFilter, entityFilter]);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await apiClient.get('/admin/moderation/review-queue/counts');
      setCounts(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/admin/moderation/history', { params: { page: String(page), limit: String(limit) } });
      setProposals(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  const refresh = useCallback(() => {
    setSelected(new Set());
    setBulkResult(null);
    setBulkApplyResult(null);
    if (view === 'queue') {
      fetchQueue();
      fetchCounts();
    } else {
      fetchHistory();
    }
  }, [view, fetchQueue, fetchCounts, fetchHistory]);

  useEffect(() => {
    setPage(1);
  }, [view, bandFilter, entityFilter]);

  useEffect(() => {
    refresh();
  }, [refresh, page]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (proposals.every((p) => prev.has(p.id))) return new Set();
      const next = new Set(prev);
      proposals.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const openDetail = async (proposalId: string) => {
    try {
      const res = await apiClient.get(`/admin/moderation/review-queue/${proposalId}`);
      setDetail(res.data);
      setEditedValue(res.data.edited_value || '');
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message);
    }
  };

  const runAction = async (proposalId: string, action: 'approve' | 'reject') => {
    setActionLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = { action };
      if (action === 'approve' && editedValue.trim()) body.edited_value = editedValue;
      await apiClient.post(`/admin/moderation/review-queue/${proposalId}/action`, body);
      setDetail(null);
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const runBulk = async (action: 'approve' | 'reject') => {
    if (selected.size === 0) return;
    setError(null);
    setBulkResult(null);
    try {
      const operations = Array.from(selected).map((id) => ({ proposal_id: id, action }));
      const res = await apiClient.post('/admin/moderation/review-queue/bulk-action', { operations });
      setBulkResult(res.data);
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message);
    }
  };

  const runBulkApply = async () => {
    if (selected.size === 0) return;
    setError(null);
    setBulkApplyResult(null);
    try {
      const res = await apiClient.post('/admin/moderation/bulk-apply', {
        proposal_ids: Array.from(selected),
      });
      refresh();
      setBulkApplyResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const bandOptions = ['quality_review', 'policy_review'];
  const entityOptions = counts
    ? Object.entries(counts.by_entity_type).map(([k, v]) => ({ key: k, value: v }))
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { setView('queue'); }} style={{
          padding: '6px 14px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer',
          background: view === 'queue' ? 'var(--primary)' : 'var(--surface-hover)',
          border: '1px solid var(--border-soft)', color: view === 'queue' ? '#fff' : 'var(--text-secondary)',
        }}>
          {ai.queueTab} ({counts?.total ?? 0})
        </button>
        <button onClick={() => { setView('history'); }} style={{
          padding: '6px 14px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer',
          background: view === 'history' ? 'var(--primary)' : 'var(--surface-hover)',
          border: '1px solid var(--border-soft)', color: view === 'history' ? '#fff' : 'var(--text-secondary)',
        }}>
          {ai.historyTab}
        </button>
        <button onClick={refresh} disabled={loading} style={{
          padding: '6px 14px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer',
          background: 'var(--surface-hover)', border: '1px solid var(--border-soft)',
          color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px',
        }}>
          <RefreshCw size={13} className={loading ? 'spinner' : ''} /> {t.admin.common.refresh}
        </button>
      </div>

{view === 'queue' && counts && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Chip color="#EF5350">{ai.quality}: {counts.by_band.quality_review}</Chip>
            <Chip color="#5B86A1">{ai.policy}: {counts.by_band.policy_review}</Chip>
            <Chip color="#FFA726">{ai.underReview}: {counts.under_review}</Chip>
          </div>
        )}

        {view === 'history' && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input type="checkbox" checked={proposals.length > 0 && proposals.every((p) => selected.has(p.id))}
                  onChange={toggleSelectAll} />
                {ai.selectAll}
              </label>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selected.size} {ai.selected}</span>
              <button onClick={runBulkApply} disabled={selected.size === 0} style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
                background: 'var(--primary)', border: 'none', color: '#fff', opacity: selected.size === 0 ? 0.5 : 1,
                display: 'inline-flex', alignItems: 'center', gap: '4px',
              }}>
                <CheckCircle size={13} /> {ai.bulkApply}
              </button>
            </span>
          </div>
        )}

      {view === 'queue' && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={bandFilter || ''} onChange={(e) => setBandFilter(e.target.value || undefined)} style={{
            padding: '6px 10px', background: 'var(--chip)', border: '1px solid var(--border)',
            borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'Inter, sans-serif', outline: 'none',
          }}>
            <option value="">{ai.allBands}</option>
            {bandOptions.map((b) => <option key={b} value={b}>{BAND_LABELS[b]}</option>)}
          </select>
          <select value={entityFilter || ''} onChange={(e) => setEntityFilter(e.target.value || undefined)} style={{
            padding: '6px 10px', background: 'var(--chip)', border: '1px solid var(--border)',
            borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'Inter, sans-serif', outline: 'none',
          }}>
            <option value="">{ai.allEntities}</option>
            {entityOptions.map((e) => <option key={e.key} value={e.key}>{e.key} ({e.value})</option>)}
          </select>

          <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input type="checkbox" checked={proposals.length > 0 && proposals.every((p) => selected.has(p.id))}
                onChange={toggleSelectAll} />
              {ai.selectAll}
            </label>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selected.size} {ai.selected}</span>
            <button onClick={() => runBulk('approve')} disabled={selected.size === 0} style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
              background: '#4CAF50', border: 'none', color: '#fff', opacity: selected.size === 0 ? 0.5 : 1,
              display: 'inline-flex', alignItems: 'center', gap: '4px',
            }}>
              <CheckCircle size={13} /> {ai.bulkApprove}
            </button>
            <button onClick={() => runBulk('reject')} disabled={selected.size === 0} style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
              background: '#EF5350', border: 'none', color: '#fff', opacity: selected.size === 0 ? 0.5 : 1,
              display: 'inline-flex', alignItems: 'center', gap: '4px',
            }}>
              <XCircle size={13} /> {ai.bulkReject}
            </button>
          </span>
        </div>
      )}

      {bulkResult && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
          background: bulkResult.failed === 0 ? 'rgba(76,175,80,0.1)' : 'rgba(255,167,38,0.1)',
          border: `1px solid ${bulkResult.failed === 0 ? 'rgba(76,175,80,0.3)' : 'rgba(255,167,38,0.3)'}`,
          color: bulkResult.failed === 0 ? 'var(--success)' : 'var(--warning)',
        }}>
          {bulkResult.succeeded} {ai.reviewResultSucceeded} · {bulkResult.failed} {ai.reviewResultFailed}
          {bulkResult.failed > 0 && (
            <div style={{ marginTop: '4px', fontSize: '12px' }}>
              {bulkResult.results.filter((r) => !r.ok).map((r) => (
                <div key={r.id}>{r.id}: {r.error}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {bulkApplyResult && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
          background: bulkApplyResult.failed === 0 ? 'rgba(76,175,80,0.1)' : 'rgba(255,167,38,0.1)',
          border: `1px solid ${bulkApplyResult.failed === 0 ? 'rgba(76,175,80,0.3)' : 'rgba(255,167,38,0.3)'}`,
          color: bulkApplyResult.failed === 0 ? 'var(--success)' : 'var(--warning)',
        }}>
          {bulkApplyResult.succeeded} {ai.reviewResultSucceeded} · {bulkApplyResult.failed} {ai.reviewResultFailed}
          <div style={{ marginTop: '6px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {bulkApplyResult.results.map((r) => {
              const proposal = proposals.find((p) => p.id === r.id);
              return (
                <div key={r.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: r.ok ? 'var(--success)' : 'var(--error)' }}>
                    {r.ok ? '✓' : '✗'} {r.field || r.id}
                  </span>
                  {!r.ok && r.error && <span style={{ color: 'var(--text-muted)' }}>{r.error}</span>}
                  {r.ok && proposal?.entity_type === 'author' && proposal.entity_id && (
                    <a href={`/studio/authors/${proposal.entity_id}`} style={{
                      color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px',
                    }}>
                      {ai.openAuthor} <ArrowUpRight size={12} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
          background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: 'var(--error)',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <RefreshCw size={24} className="spinner" />
        </div>
      ) : proposals.length === 0 ? (
        <div style={{
          padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)',
          background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--border)',
        }}>
          <ShieldAlert size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>{view === 'queue' ? ai.queueEmpty : ai.historyEmpty}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {proposals.map((p) => {
            const current = displayLines(p.current_value);
            const suggested = displayLines(p.suggested_value);
            const bandColor = BAND_COLORS[p.review_band || ''] || '#97A6BA';
            return (
              <div key={p.id} style={{
                padding: '14px 16px', background: 'var(--surface-hover)', borderRadius: '10px',
                border: view === 'queue' && selected.has(p.id) ? '1px solid var(--primary)' : '1px solid var(--border-soft)',
                opacity: view === 'history' && p.status === 'rejected' ? 0.6 : 1,
              }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} />
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {p.entity_name || p.entity_id || '—'}
                    {p.entity_name && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> ({p.entity_id})</span>}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {ai.entity}: {p.entity_type} · {ai.field}: {p.field_name}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {ai.run}: {p.run_domain || '—'}
                  </span>
                  <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Chip color={bandColor}>{BAND_LABELS[p.review_band || ''] || p.review_band}</Chip>
                    {view === 'history' && <Chip color={p.status === 'accepted' ? '#4CAF50' : p.status === 'rejected' ? '#EF5350' : '#97A6BA'}>{STATUS_LABELS[p.status] || p.status}</Chip>}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {(p.confidence * 100).toFixed(0)}%
                    </span>
                  </span>
                </div>

                {p.review_reason && (
                  <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)', margin: '6px 0 0 26px' }}>
                    {REASON_LABELS[p.review_reason] || p.review_reason}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '10px 0 8px 26px' }}>
                  <div style={{ padding: '8px', borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--border-soft)' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>{ai.current}</div>
                    <div style={{ fontSize: '13px', color: current.length ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: current.length ? 'normal' : 'italic' }}>
                      {current.join(' · ') || '—'}
                    </div>
                  </div>
                  <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#4CAF50', marginBottom: '2px' }}>{ai.suggested}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{suggested.join(' · ') || p.suggested_value}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginLeft: '26px', flexWrap: 'wrap' }}>
                  {p.source_count != null && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ai.evidence}: {p.source_count}</span>}
                  {p.conflict_state && p.conflict_state !== 'no_conflict' && (
                    <Chip color="#FFA726">{CONFLICT_LABELS[p.conflict_state] || p.conflict_state}</Chip>
                  )}
                  <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: '8px' }}>
                    {view === 'history' && p.reviewed_at && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {ai.reviewedAt}: {new Date(p.reviewed_at).toLocaleDateString()}
                      </span>
                    )}
                    <button onClick={() => openDetail(p.id)} style={{
                      padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                      background: 'var(--chip)', border: '1px solid var(--border)', color: 'var(--primary)',
                      display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif',
                    }}>
                      <Eye size={12} /> {ai.openDetail}
                    </button>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {t.admin.common.showing} {proposals.length} {t.admin.common.of} {total}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} style={{
              padding: '6px 14px', background: 'var(--chip)', border: '1px solid var(--border)', borderRadius: '6px',
              color: page <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: page <= 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif', fontSize: '13px',
            }}>←</button>
            <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} style={{
              padding: '6px 14px', background: 'var(--chip)', border: '1px solid var(--border)', borderRadius: '6px',
              color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif', fontSize: '13px',
            }}>→</button>
          </div>
        </div>
      )}

      {detail && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
        }} onClick={() => setDetail(null)}>
          <div style={{
            background: 'var(--surface)', borderRadius: '16px', padding: '32px', maxWidth: '640px', width: '100%',
            border: '1px solid var(--border)', maxHeight: '80vh', overflowY: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', margin: 0, fontWeight: 500, marginRight: 'auto' }}>
                {detail.entity_name || detail.entity_id || detail.entity_type}
              </h2>
              <Chip color={BAND_COLORS[detail.review_band || ''] || '#97A6BA'}>{BAND_LABELS[detail.review_band || ''] || detail.review_band}</Chip>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(detail.confidence * 100).toFixed(0)}%</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ padding: '10px 14px', background: 'var(--surface-hover)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>{ai.entity}</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{detail.entity_type}{detail.entity_id ? ` · ${detail.entity_id}` : ''}</div>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--surface-hover)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>{ai.field}</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{detail.field_name}{detail.run_domain ? ` · ${ai.run}: ${detail.run_domain}` : ''}</div>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--surface-hover)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>{ai.current}</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                  {displayLines(detail.current_value).join(' · ') || '—'}
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--surface-hover)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>{ai.suggested}</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                  {displayLines(detail.suggested_value).join(' · ') || detail.suggested_value}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>{ai.evidence}</div>
              {!detail.sources || detail.sources.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{ai.noEvidence}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {detail.sources.map((s) => (
                    <a key={s.id} href={s.url || '#'} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                      <div style={{
                        padding: '8px 12px', background: 'var(--chip)', borderRadius: '8px',
                        border: '1px solid var(--border-soft)', fontSize: '12px',
                      }}>
                        <div style={{ color: 'var(--text-primary)', marginBottom: '2px' }}>
                          <span style={{
                            padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase',
                            background: `${TIER_COLORS[s.reliability_tier || 'unknown']}1f`, color: TIER_COLORS[s.reliability_tier || 'unknown'],
                            marginRight: '6px',
                          }}>{s.reliability_tier || 'unknown'}</span>
                          {s.title}
                        </div>
                        {s.snippet && <div style={{ color: 'var(--text-muted)' }}>{s.snippet}</div>}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {detail.status === 'accepted' && detail.field_name === 'timeline_event' && !detail.applied_at && (
              <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,167,38,0.1)', border: '1px solid rgba(255,167,38,0.3)', fontSize: '13px', color: 'var(--warning)' }}>
                <Clock size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                accepted — apply via the author's Timeline editor
              </div>
            )}

            {detail.status === 'proposed' || detail.status === 'under_review' ? (
              <>
                <label style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px', display: 'block' }}>
                  {ai.editedPreferred}
                </label>
                <textarea value={editedValue} onChange={(e) => setEditedValue(e.target.value)}
                  placeholder={detail.suggested_value}
                  style={{
                    width: '100%', minHeight: '84px', padding: '10px 14px', background: 'var(--chip)',
                    border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)',
                    fontSize: '13px', fontFamily: 'monospace', resize: 'vertical', outline: 'none',
                    boxSizing: 'border-box',
                  }} />

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button onClick={() => setDetail(null)} style={{
                    padding: '10px 20px', background: 'var(--chip)', border: '1px solid var(--border)', borderRadius: '8px',
                    color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}>{t.admin.common.close}</button>
                  <button onClick={() => runAction(detail.id, 'reject')} disabled={actionLoading} style={{
                    padding: '10px 20px', background: '#EF5350', border: 'none', borderRadius: '8px', color: '#fff',
                    fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    opacity: actionLoading ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: '4px',
                  }}>
                    <XCircle size={14} /> {t.admin.moderation.reject}
                  </button>
                  <button onClick={() => runAction(detail.id, 'approve')} disabled={actionLoading} style={{
                    padding: '10px 20px', background: '#4CAF50', border: 'none', borderRadius: '8px', color: '#fff',
                    fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    opacity: actionLoading ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: '4px',
                  }}>
                    <CheckCircle size={14} /> {t.admin.moderation.approve}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setDetail(null)} style={{
                  padding: '10px 20px', background: 'var(--chip)', border: '1px solid var(--border)', borderRadius: '8px',
                  color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}>{t.admin.common.close}</button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spinner { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spinner { animation: spinner 1s linear infinite; }
      `}</style>
    </div>
  );
}