import { ExternalLink } from 'lucide-react';
import { authorUrl } from '../../../../shared/utils/authorUrl';
import { useAuthorEditor } from './AuthorEditorContext';

const card: React.CSSProperties = { minWidth: '130px', flex: '1 1 150px', padding: '10px 12px', border: '1px solid var(--border-soft)', borderRadius: '10px', background: 'var(--surface)' };
const label: React.CSSProperties = { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' };

export default function AuthorWorkflowSummary() {
  const { author, summary } = useAuthorEditor();
  if (!author) return null;

  const lastActivity = summary?.last_syvai_run_at
    ? `${(summary.last_syvai_run_domain || 'SyvAI').replace(/_/g, ' ')} · ${new Date(summary.last_syvai_run_at).toLocaleDateString()}`
    : null;
  const missing = summary?.missing_required_fields || [];

  return (
    <section aria-label="Author workflow summary" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px clamp(16px, 3vw, 28px)', background: 'var(--bg)', borderBottom: '1px solid var(--border-soft)' }}>
      <div style={card}><div style={label}>Status</div><strong>{summary?.metadata_status || author.metadata_status || 'draft'}</strong></div>
      {summary && (summary.verified_source_count > 0 || summary.pending_source_candidate_count > 0) && (
        <div style={card}><div style={label}>Research</div><div>{summary.verified_source_count} verified{summary.pending_source_candidate_count > 0 ? ` · ${summary.pending_source_candidate_count} needs review` : ''}</div></div>
      )}
      {summary && (summary.pending_proposal_count > 0 || summary.accepted_unapplied_proposal_count > 0 || summary.applied_proposal_count > 0) && (
        <div style={card}><div style={label}>SyvAI</div><div>{summary.pending_proposal_count > 0 ? `${summary.pending_proposal_count} pending` : ''}{summary.accepted_unapplied_proposal_count > 0 ? `${summary.pending_proposal_count > 0 ? ' · ' : ''}${summary.accepted_unapplied_proposal_count} ready to apply` : ''}{summary.applied_proposal_count > 0 ? ` · ${summary.applied_proposal_count} applied` : ''}</div></div>
      )}
      {summary && <div style={card}><div style={label}>Readiness</div><div style={{ color: summary.publication_ready ? 'var(--success)' : 'var(--text-secondary)' }}>{summary.publication_ready ? 'Ready for publication review' : `Missing ${missing.length}: ${missing.slice(0, 2).join(', ')}${missing.length > 2 ? '…' : ''}`}</div></div>}
      {lastActivity && <div style={card}><div style={label}>Last activity</div><div>{lastActivity}</div></div>}
      <a href={authorUrl(author)} target="_blank" rel="noopener noreferrer" aria-label="Public preview" style={{ ...card, flex: '0 1 auto', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', textDecoration: 'none' }}>
        <ExternalLink size={14} /> Public preview
      </a>
    </section>
  );
}
