import { useState, useEffect, useCallback } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import { apiClient } from '../../../../../shared/api/client';
import type { AIProposal, SyvaiRun } from '../../../../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import BootstrapAuthorMetadata from './BootstrapAuthorMetadata';

const VALIDATION_LABELS: Record<string, string> = {
  validated: 'validationValidated',
  needs_review: 'validationNeedsReview',
  conflict: 'validationConflict',
  invalid: 'validationInvalid',
};

const CONFLICT_LABELS: Record<string, string> = {
  duplicate: 'conflictDuplicate',
  near_duplicate: 'conflictNearDuplicate',
  conflict: 'conflictConflict',
  new: 'conflictNew',
};

const VALIDATION_COLORS: Record<string, string> = {
  validated: '#4CAF50',
  needs_review: '#FFA726',
  conflict: '#EF5350',
  invalid: '#EF5350',
};

const CONFLICT_COLORS: Record<string, string> = {
  duplicate: '#FFA726',
  near_duplicate: '#FFA726',
  conflict: '#EF5350',
  new: '#5B86A1',
};

const TIER_COLORS: Record<string, string> = {
  high: '#4CAF50',
  medium: '#FFA726',
  low: '#EF5350',
  unknown: '#97A6BA',
};

const BAND_COLORS: Record<string, string> = {
  auto_approved: '#4CAF50',
  auto_rejected: '#97A6BA',
  quality_review: '#EF5350',
  policy_review: '#5B86A1',
};

const BAND_LABELS: Record<string, string> = {
  auto_approved: 'Auto-approved',
  auto_rejected: 'Auto-rejected',
  quality_review: 'Quality review',
  policy_review: 'Policy review',
};

const REASON_LABELS: Record<string, string> = {
  new_grounded: 'new grounded claim',
  invalid_claim: 'invalid claim',
  exact_duplicate: 'exact duplicate of curated event',
  restatement: 'restatement of curated event',
  near_duplicate_ambiguous: 'ambiguous near-duplicate',
  date_conflict: 'conflicts with curated timeline',
  unsupported_claim: 'no supporting source evidence',
  ungrounded: 'evidence requires review; see source verification below',
  posthumous_event: 'posthumous event (policy)',
};

const EVIDENCE_STATE_COLORS: Record<string, string> = {
  direct_grounded: '#4CAF50',
  partial: '#FFA726',
  synthetic: '#A855F7',
  ungrounded: '#EF5350',
};

const APPLYABLE_FIELDS = new Set([
  'native_name', 'birth_name', 'pen_names', 'pseudonyms', 'nationality', 'languages', 'gender',
  'occupations', 'active_years', 'bio', 'citizenship', 'residence', 'literary_movements', 'genres',
  'themes', 'motifs', 'concepts', 'atmospheres', 'writing_languages', 'timeline_event',
]);

function destinationFor(field: string): { label: string; section: string } | null {
  if (field === 'timeline_event') return { label: 'Timeline', section: 'timeline' };
  if (['bio', 'active_years'].includes(field)) return { label: 'Biography', section: 'biography' };
  if (['occupations', 'citizenship', 'residence'].includes(field)) return { label: 'Biography', section: 'biography' };
  if (['native_name', 'birth_name', 'pen_names', 'pseudonyms', 'nationality', 'languages', 'gender'].includes(field)) return { label: 'Identity', section: 'identity' };
  return null;
}

function evidenceStateLabel(state: string): string {
  return state.replace(/_/g, ' ').toUpperCase();
}

function parseClaim(value?: string | null): Record<string, any> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function summaryLines(value?: string | null): string[] {
  const parsed = parseClaim(value);
  if (!parsed) return value ? [value] : [];
  const claimValue = parsed.value;
  const formattedValue = claimValue && typeof claimValue === 'object'
    ? claimValue.date_value ?? claimValue.place ?? claimValue.state_name ?? claimValue.value
    : claimValue;
  return [parsed.label, parsed.date_value, parsed.event_type, parsed.description, formattedValue]
    .filter(Boolean)
    .map((part) => String(part));
}

export default function AIProposals() {
  const { author, refresh, refreshSummary } = useAuthorEditor();
  const t = getLocaleData(getBrowserLocale());
  const copy = t.admin.studioCleanup;
  const proposalStatusLabels: Record<string, string> = {
    proposed: copy.proposed,
    accepted: copy.accepted,
    rejected: copy.rejected,
  };
  const [proposals, setProposals] = useState<AIProposal[]>([]);
  const [runs, setRuns] = useState<SyvaiRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [bandFilter, setBandFilter] = useState<string | undefined>(undefined);

  const fetchProposals = useCallback(async () => {
    if (!author) return;
    setLoading(true);
    try {
      const params = { status_filter: filter, band_filter: bandFilter };
      const res = await apiClient.get(`/admin/authors/${author.id}/proposals`, { params });
      setProposals(res.data?.data || []);
    } catch {
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, [author, filter, bandFilter]);

  const fetchRuns = useCallback(async () => {
    if (!author) return;
    try {
      const res = await apiClient.get(`/admin/authors/${author.id}/ai/runs`);
      setRuns(res.data?.data || []);
    } catch {
      setRuns([]);
    }
  }, [author]);

  useEffect(() => {
    if (author) {
      fetchProposals();
      fetchRuns();
    }
  }, [author, fetchProposals, fetchRuns]);

  const updateStatus = async (proposalId: string, status: 'accepted' | 'rejected') => {
    if (!author) return;
    try {
      await apiClient.post(`/admin/moderation/review-queue/${proposalId}/action`, { action: status === 'accepted' ? 'approve' : 'reject' });
      await Promise.all([fetchProposals(), Promise.resolve(refreshSummary())]);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || copy.failedUpdate);
    }
  };

  const applyProposal = async (proposalId: string) => {
    if (!author) return;
    try {
      await apiClient.post(`/admin/authors/${author.id}/proposals/${proposalId}/apply`);
      await Promise.all([fetchProposals(), fetchRuns(), Promise.resolve(refresh()), Promise.resolve(refreshSummary())]);
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

  const bandCounts = proposals.reduce<Record<string, number>>((acc, p) => {
    if (p.review_band) {
      acc[p.review_band] = (acc[p.review_band] || 0) + 1;
    }
    return acc;
  }, {});

  const filters = ['proposed', 'accepted', 'rejected'];
  const bandFilters = Object.keys(bandCounts).length > 0
    ? ['quality_review', 'policy_review', 'auto_rejected', 'auto_approved']
    : [];

  const runStatusColor: Record<string, string> = {
    completed: '#4CAF50',
    review_needed: '#FFA726',
    failed: '#EF5350',
    running: '#5B86A1',
  };

  const canApply = (proposal: AIProposal) => {
    if (proposal.applied_at || proposal.status === 'rejected') return false;
    if (!APPLYABLE_FIELDS.has(proposal.field_name)) return false;
    if (proposal.validation_state === 'invalid' || proposal.validation_state === 'conflict') return false;
    if (proposal.conflict_state && !['new'].includes(proposal.conflict_state)) return false;
    if (proposal.field_name === 'timeline_event') return proposal.status === 'accepted';
    return proposal.status === 'accepted' || proposal.review_band === 'auto_approved';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title="Proposals & history">
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {copy.aiDescription}
          </p>
          <BootstrapAuthorMetadata
            authorId={author.id}
            copy={copy.bootstrapAuthor}
            onConfirmed={() => Promise.all([fetchProposals(), fetchRuns()]).then(() => undefined)}
          />
        </div>

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
                <span style={{ color: runStatusColor[run.status] || 'var(--text-muted)', fontWeight: 500 }}>
                  {run.status}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {run.provider} / {run.model}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {run.proposal_count ?? 0} proposals · {run.source_count} sources · {run.total_tokens ?? 0} tokens
                  {run.estimated_cost_usd != null ? ` · $${run.estimated_cost_usd.toFixed(4)}` : ''}
                </span>
                {run.error && <span style={{ color: 'var(--error)' }}>{run.error}</span>}
              </div>
            ))}
          </div>
        )}

        {runs.length === 0 && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0 0 12px 0' }}>
            {copy.noRuns}
          </p>
        )}

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

        {bandFilters.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setBandFilter(undefined)}
              style={{
                padding: '4px 12px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer',
                background: !bandFilter ? 'var(--accent)' : 'var(--surface-hover)',
                border: '1px solid var(--border-soft)',
                color: !bandFilter ? '#fff' : 'var(--text-secondary)',
              }}>
              {t.admin.common.all}
            </button>
            {bandFilters.map((b) => (
              <button key={b} type="button" onClick={() => setBandFilter(b)}
                style={{
                  padding: '4px 12px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer',
                  background: bandFilter === b ? 'var(--accent)' : 'var(--surface-hover)',
                  border: '1px solid var(--border-soft)',
                  color: bandFilter === b ? '#fff' : 'var(--text-secondary)',
                }}>
                {BAND_LABELS[b] || b} ({bandCounts[b] || 0})
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

        {filtered.map((p) => {
          const current = summaryLines(p.current_value);
          const suggested = summaryLines(p.suggested_value);
          const validationKey = p.validation_state ? VALIDATION_LABELS[p.validation_state] : null;
          const conflictKey = p.conflict_state ? CONFLICT_LABELS[p.conflict_state] : null;
          const destination = destinationFor(p.field_name);
          return (
            <div key={p.id} style={{
              padding: '12px 16px', marginBottom: '8px',
              background: 'var(--surface-hover)', borderRadius: '8px',
              border: '1px solid var(--border-soft)',
              opacity: p.status === 'rejected' ? 0.5 : 1,
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                  textTransform: 'uppercase', fontWeight: 500,
                  background: p.source_type === 'ai' ? 'rgba(91,134,161,0.15)' : 'rgba(76,175,80,0.15)',
                  color: p.source_type === 'ai' ? '#5B86A1' : '#4CAF50',
                }}>
                  {p.source_type === 'ai' ? 'SyvAI' : p.source_type}
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
                {validationKey && (
                  <span style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                    textTransform: 'uppercase', fontWeight: 500,
                    background: `${VALIDATION_COLORS[p.validation_state!]}1f`,
                    color: VALIDATION_COLORS[p.validation_state!],
                  }}>
                    {copy[validationKey as keyof typeof copy] as string}
                  </span>
                )}
                {conflictKey && p.conflict_state !== 'new' && (
                  <span style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                    textTransform: 'uppercase', fontWeight: 500,
                    background: `${CONFLICT_COLORS[p.conflict_state!]}1f`,
                    color: CONFLICT_COLORS[p.conflict_state!],
                  }}>
                    {copy[conflictKey as keyof typeof copy] as string}
                  </span>
                )}
                {p.review_band && (
                  <span style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                    textTransform: 'uppercase', fontWeight: 500,
                    background: `${BAND_COLORS[p.review_band] || '#97A6BA'}1f`,
                    color: BAND_COLORS[p.review_band] || '#97A6BA',
                  }}>
                    {BAND_LABELS[p.review_band] || p.review_band}
                  </span>
                )}
                {p.applied_at && (
                  <span style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                    textTransform: 'uppercase', fontWeight: 500,
                    background: 'rgba(76,175,80,0.15)', color: '#4CAF50',
                  }}>
                    {copy.applied}
                  </span>
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {(p.confidence * 100).toFixed(0)}% {copy.confidence}
                </span>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {p.entity_type} → {p.field_name}
                {p.review_reason && (
                  <span style={{ marginLeft: '8px', fontStyle: 'italic' }}>
                    {REASON_LABELS[p.review_reason] || p.review_reason}
                  </span>
                )}
              </div>
              {destination && <div style={{ fontSize: 11, marginBottom: 8 }}><a href={`/authors/${author.id}/edit/${destination.section}`} style={{ color: 'var(--accent)' }}>Canonical destination: {destination.label}</a></div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                  padding: '8px', borderRadius: '6px',
                  background: 'var(--surface)', border: '1px solid var(--border-soft)',
                }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    {copy.currentValue}
                  </div>
                  <div style={{ fontSize: '13px', color: current.length ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: current.length ? 'normal' : 'italic' }}>
                    {current.length ? current.join(' · ') : copy.empty}
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
                    {suggested.join(' · ') || p.suggested_value}
                  </div>
                </div>
              </div>

              {p.sources && p.sources.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {copy.sources}
                  </div>
                  {p.sources.map((s) => (
                    <div key={s.id} style={{
                      padding: '8px', marginBottom: '6px', borderRadius: '6px',
                      background: 'var(--surface)', border: '1px solid var(--border-soft)', fontSize: '11px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <strong>{s.title}</strong>
                        <span style={{
                          padding: '1px 5px', borderRadius: '3px', fontSize: '9px', fontWeight: 600,
                          textTransform: 'uppercase',
                          background: `${TIER_COLORS[s.reliability_tier || 'unknown']}1f`,
                          color: TIER_COLORS[s.reliability_tier || 'unknown'],
                        }}>
                          {s.reliability_tier || 'unknown'}
                        </span>
                        <span style={{
                          padding: '1px 5px', borderRadius: '3px', fontSize: '9px', fontWeight: 600,
                          background: `${EVIDENCE_STATE_COLORS[s.verification_state] || '#97A6BA'}1f`,
                          color: EVIDENCE_STATE_COLORS[s.verification_state] || '#97A6BA',
                        }}>
                          {evidenceStateLabel(s.verification_state)}
                        </span>
                      </div>
                      <div style={{ marginTop: '5px', color: 'var(--text-secondary)' }}>
                        Provenance: {s.provenance_type.replace(/_/g, ' ')} · Synthetic: {s.synthesis_involved ? 'yes' : 'no'}
                      </div>
                      {s.snippet && (
                        <div style={{ marginTop: '5px', color: '#4CAF50' }}>
                          <strong>Supported source span:</strong> {s.snippet}
                        </div>
                      )}
                      {s.verification_reason && s.verification_state !== 'direct_grounded' && (
                        <div style={{ marginTop: '5px', color: s.verification_state === 'partial' ? '#FFA726' : '#EF5350' }}>
                          <strong>{s.verification_state === 'partial' ? 'Unsupported components:' : 'Verification issue:'}</strong>{' '}
                          {s.verification_reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {p.status === 'proposed' && ['quality_review', 'policy_review'].includes(p.review_band || '') && (
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

              {canApply(p) && (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => applyProposal(p.id)}
                    style={{
                      padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                      background: 'var(--accent)', border: 'none', color: '#fff',
                    }}>
                    {copy.apply}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {error && (
          <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: 'var(--error)', fontSize: '13px' }}>
            {error}
          </div>
        )}
      </EditorSectionCard>
    </div>
  );
}
