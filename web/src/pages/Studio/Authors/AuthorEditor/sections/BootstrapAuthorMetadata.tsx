import { useState } from 'react';
import { apiClient } from '../../../../../shared/api/client';
import type { BootstrapCategory, BootstrapResponse } from '../../../../../types/admin';
import type { LocaleData } from '../../../../../locales';

interface Props {
  authorId: string;
  copy: LocaleData['admin']['studioCleanup']['bootstrapAuthor'];
  onConfirmed: () => void | Promise<void>;
}

const GROUPS: Array<{ key: keyof BootstrapResponse['categories']; color: string }> = [
  { key: 'verified', color: '#4CAF50' },
  { key: 'conflicts', color: '#EF5350' },
  { key: 'already_present', color: '#5B86A1' },
  { key: 'skipped', color: '#97A6BA' },
];

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.map(displayValue).join(', ');
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return displayValue(record.date_value ?? record.place ?? record.state_name ?? record.value ?? Object.values(record));
  }
  return String(value);
}

function errorMessage(error: any, fallback: string): string {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail.reason === 'string') return detail.reason;
  return error?.message || fallback;
}

export default function BootstrapAuthorMetadata({ authorId, copy, onConfirmed }: Props) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<BootstrapResponse | null>(null);
  const [result, setResult] = useState<BootstrapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = async () => {
    setLoading(true);
    setError(null);
    setPreview(null);
    setResult(null);
    try {
      const response = await apiClient.post<BootstrapResponse>(`/admin/authors/${authorId}/bootstrap/preview`);
      setPreview(response.data);
    } catch (e: any) {
      setError(errorMessage(e, copy.previewFailed));
    } finally {
      setLoading(false);
    }
  };

  const launch = () => {
    setOpen(true);
    void loadPreview();
  };

  const confirm = async () => {
    if (confirming) return;
    setConfirming(true);
    setError(null);
    try {
      const response = await apiClient.post<BootstrapResponse>(`/admin/authors/${authorId}/bootstrap`);
      setResult(response.data);
      await onConfirmed();
    } catch (e: any) {
      setError(errorMessage(e, copy.confirmFailed));
    } finally {
      setConfirming(false);
    }
  };

  const close = () => {
    if (loading || confirming) return;
    setOpen(false);
  };

  const actionable = preview ? preview.categories.verified.length + preview.categories.conflicts.length : 0;

  return <>
    <button type="button" onClick={launch} style={{
      padding: '7px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
      background: 'var(--accent)', border: 'none', color: '#fff', whiteSpace: 'nowrap',
    }}>{copy.action}</button>

    {open && <div role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) close();
    }} style={{
      position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(8, 15, 25, 0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="bootstrap-author-title" style={{
        width: 'min(760px, 100%)', maxHeight: '85vh', overflowY: 'auto',
        background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: '12px',
        padding: '20px', boxShadow: '0 24px 80px rgba(0,0,0,.35)',
      }}>
        <h2 id="bootstrap-author-title" style={{ margin: '0 0 6px', fontSize: '18px' }}>{copy.title}</h2>
        <p style={{ margin: '0 0 18px', color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5 }}>
          {copy.safetyNotice}
        </p>

        {loading && <p aria-live="polite" style={{ color: 'var(--text-muted)' }}>{copy.loading}</p>}
        {error && <div role="alert" style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(239,83,80,.1)', color: '#EF5350', marginBottom: '14px' }}>
          {error}
        </div>}

        {!loading && !result && error && <button type="button" onClick={() => void loadPreview()}>{copy.retry}</button>}

        {preview && !result && <div>
          {GROUPS.map(({ key, color }) => {
            const items = preview.categories[key];
            if (!items.length) return null;
            return <section key={key} aria-label={copy.groups[key]} style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '13px', color, margin: '0 0 8px' }}>{copy.groups[key]} ({items.length})</h3>
              {items.map((item: BootstrapCategory, index: number) => <div key={`${item.field}-${index}`} style={{
                border: '1px solid var(--border-soft)', borderLeft: `3px solid ${color}`,
                borderRadius: '6px', padding: '9px 11px', marginBottom: '6px', fontSize: '12px',
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{copy.fields[item.field] || item.field.replace(/_/g, ' ')}</div>
                {item.proposed_value !== undefined && <div>{copy.proposed}: {displayValue(item.proposed_value)}</div>}
                {item.current_value !== undefined && item.current_value !== null && <div>{copy.current}: {displayValue(item.current_value)}</div>}
                {item.provenance?.property_id && <div style={{ color: 'var(--text-muted)' }}>
                  {copy.source}: Wikidata {item.provenance.wikidata_qid} · {item.provenance.property_id}
                </div>}
                {item.disposition === 'reused' && <div style={{ color: 'var(--text-muted)' }}>{copy.reused}</div>}
                {item.reason && <div style={{ color: 'var(--text-muted)' }}>{copy.reasons[item.reason] || item.reason.replace(/_/g, ' ')}</div>}
              </div>)}
            </section>;
          })}
          {Object.values(preview.categories).every((items) => items.length === 0) && <p>{copy.empty}</p>}
          {actionable === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{copy.noActionable}</p>}
        </div>}

        {result && <div role="status" style={{ padding: '12px', borderRadius: '8px', background: 'rgba(76,175,80,.1)', marginBottom: '14px' }}>
          <strong>{copy.complete}</strong>
          <div style={{ marginTop: '6px', fontSize: '13px' }}>
            {copy.created}: {result.counts.created} · {copy.reusedCount}: {result.counts.reused} · {copy.alreadyPresent}: {result.counts.already_present} · {copy.skipped}: {result.counts.skipped}
          </div>
          <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>{copy.reviewNotice}</div>
        </div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
          <button type="button" onClick={close} disabled={loading || confirming}>{result ? copy.reviewProposals : copy.cancel}</button>
          {preview && !result && actionable > 0 && <button type="button" onClick={() => void confirm()} disabled={confirming} style={{
            padding: '7px 14px', borderRadius: '6px', border: 'none', background: 'var(--accent)', color: '#fff',
          }}>{confirming ? copy.confirming : copy.confirm}</button>}
        </div>
      </div>
    </div>}
  </>;
}
