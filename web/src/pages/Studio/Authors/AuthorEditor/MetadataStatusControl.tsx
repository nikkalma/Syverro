import { useCallback, useEffect, useState } from 'react';
import { useAuthorEditor } from './AuthorEditorContext';
import {
  AUTHOR_STATUS_PIPELINE,
  AUTHOR_STATUS_COLORS,
  AUTHOR_STATUS_BG,
  validateStatusPromotion,
  getNextStatus,
  getPrevStatus,
} from './metadataStatus';
import type { AdminAuthorUpdate, AuthorPromoteResult, AuthorPublicationReadiness } from '../../../../types/admin';
import { apiClient } from '../../../../shared/api/client';
import { getLocaleData, getBrowserLocale } from '../../../../locales';

export default function MetadataStatusControl() {
  const { author, updateAuthor } = useAuthorEditor();
  const t = getLocaleData(getBrowserLocale());
  const copy = t.admin.studioCleanup;
  const fieldLabels: Record<string, string> = {
    birth_name: t.admin.authors.editor.identity.birthName,
    sort_name: t.admin.authors.editor.identity.sortName,
    birth_date: t.admin.authors.editor.identity.birthDate,
    birth_place_id: t.admin.authors.editor.identity.birthPlace,
    death_date: t.admin.authors.editor.identity.deathDate,
    death_place_id: t.admin.authors.editor.identity.deathPlace,
    nationality: t.admin.authors.editor.identity.nationality,
    occupations: t.admin.authors.editor.identity.occupations,
    languages: t.admin.authors.editor.identity.languages,
    publications: t.admin.authors.editor.publications.title,
    photo: t.admin.authors.photo,
    wikipedia_url: t.admin.authors.editor.seo.wikipedia,
    portrait_caption: t.admin.authors.editor.media.caption,
    author_intro_quote: t.admin.authors.editor.overview.heroQuote,
  };
  const [promoting, setPromoting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [readiness, setReadiness] = useState<AuthorPublicationReadiness | null>(null);
  const [readinessError, setReadinessError] = useState<string | null>(null);
  const [promoteError, setPromoteError] = useState<string | null>(null);

  const loadReadiness = useCallback(async () => {
    if (!author) return;
    try {
      const res = await apiClient.get(`/admin/authors/${author.id}/publication-readiness`);
      setReadiness(res.data);
      setReadinessError(null);
    } catch (err: any) {
      setReadinessError(err?.response?.data?.detail || err.message || 'Failed to load publication readiness');
      setReadiness(null);
    }
  }, [author]);

  useEffect(() => {
    loadReadiness();
  }, [loadReadiness, author?.metadata_status]);

  if (!author) return null;

  const currentStatus = author.metadata_status || 'draft';
  const nextStatus = getNextStatus(currentStatus);
  const prevStatus = getPrevStatus(currentStatus);
  const isGolden = currentStatus === 'golden';

  const handlePromote = async () => {
    if (!nextStatus) return;
    setValidationErrors([]);
    setPromoteError(null);

    // The golden step is publication: route through the canonical backend
    // promote action (backend readiness gate + audit), never through PUT.
    if (nextStatus === 'golden') {
      setPromoting(true);
      try {
        const res = await apiClient.post<AuthorPromoteResult>(`/admin/authors/${author.id}/promote`);
        if (res.data.readiness) setReadiness(res.data.readiness);
        await updateAuthor({});
      } catch (err: any) {
        const detail = err?.response?.data?.detail;
        if (detail && typeof detail === 'object' && Array.isArray(detail.blocking_reasons)) {
          setReadiness(detail);
          setPromoteError(detail.blocking_reasons.join(', '));
        } else {
          setPromoteError(typeof detail === 'string' ? detail : (err.message || 'Failed to publish'));
        }
      } finally {
        setPromoting(false);
      }
      return;
    }

    const { valid, errors } = validateStatusPromotion(author, nextStatus);
    if (!valid) {
      setValidationErrors(errors.map((e) => `${copy.missing}: ${fieldLabels[e.field] || e.label}`));
      return;
    }
    setPromoting(true);
    try {
      const data: AdminAuthorUpdate = { metadata_status: nextStatus };
      await updateAuthor(data);
    } finally {
      setPromoting(false);
    }
  };

  const handleDemote = async () => {
    if (!prevStatus) return;
    setValidationErrors([]);
    setPromoteError(null);
    setPromoting(true);
    try {
      const data: AdminAuthorUpdate = { metadata_status: prevStatus };
      await updateAuthor(data);
    } finally {
      setPromoting(false);
    }
  };

  const statusLabels = copy.statuses as Record<string, string>;
  const badge = statusLabels[currentStatus] || currentStatus;
  const color = AUTHOR_STATUS_COLORS[currentStatus as keyof typeof AUTHOR_STATUS_COLORS] || '#97A6BA';
  const bg = AUTHOR_STATUS_BG[currentStatus as keyof typeof AUTHOR_STATUS_BG] || 'rgba(151,166,186,0.12)';

  const pipelineIdx = AUTHOR_STATUS_PIPELINE.indexOf(currentStatus as any);
  const blockColor = readiness?.ready ? '#4CAF50' : '#EF5350';
  const blockBg = readiness?.ready
    ? 'rgba(76,175,80,0.1)'
    : 'rgba(220,38,38,0.08)';
  const isPromoteTargetGolden = nextStatus === 'golden';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '12px',
      padding: '16px',
      background: 'var(--surface)',
      border: '1px solid var(--border-soft)',
      borderRadius: '12px',
    }}>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
        {copy.metadataStatus}
      </div>

      <div style={{
        fontSize: '13px', fontWeight: 500,
        color, background: bg,
        padding: '4px 12px', borderRadius: '12px',
        display: 'inline-block', alignSelf: 'flex-start',
      }}>
        {badge}
      </div>

      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
        {AUTHOR_STATUS_PIPELINE.map((s, i) => (
          <div key={s} style={{
            width: '20px', height: '4px', borderRadius: '2px',
            background: i <= pipelineIdx ? (AUTHOR_STATUS_COLORS[s] || '#97A6BA') : 'var(--border-soft)',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>

      {!isGolden && (
        <div style={{
          padding: '10px 12px', borderRadius: '8px', fontSize: '12px',
          background: blockBg, border: `1px solid ${blockColor}33`,
          color: blockColor, display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          <div style={{ fontWeight: 500 }}>
            {copy.publicationReadiness}: {readiness?.ready ? copy.readyToPublish : (readiness ? copy.notReadyToPublish : '…')}
          </div>
          {readiness && (
            <>
              {readiness.missing_required_fields.length > 0 && (
                <div>
                  <span style={{ fontWeight: 500 }}>{copy.missingRequired}: </span>
                  {readiness.missing_required_fields.join(', ')}
                </div>
              )}
              {readiness.warnings.length > 0 && (
                <div>
                  <span style={{ fontWeight: 500 }}>{copy.warningsLabel}: </span>
                  {readiness.warnings.join(' · ')}
                </div>
              )}
            </>
          )}
          {readinessError && <div style={{ color: 'var(--error)' }}>{readinessError}</div>}
          {promoteError && (
            <div style={{ color: 'var(--error)' }}>
              {copy.notReadyToPublish}: {promoteError}
            </div>
          )}
        </div>
      )}

      {isGolden && (
        <div style={{
          padding: '8px 12px', borderRadius: '8px', fontSize: '12px',
          background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)',
          color: 'var(--success)',
        }}>
          {copy.alreadyGolden}
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px' }}>
        {prevStatus && (
          <button type="button" onClick={handleDemote} disabled={promoting}
            style={{
              flex: 1, padding: '6px 12px', fontSize: '12px',
              background: 'transparent', border: '1px solid var(--border-soft)',
              borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer',
            }}>
            {copy.demote}
          </button>
        )}
        {nextStatus && (
          <button type="button" onClick={handlePromote} disabled={promoting || (isPromoteTargetGolden && !readiness?.ready)}
            style={{
              flex: 1, padding: '6px 12px', fontSize: '12px', fontWeight: 500,
              background: isPromoteTargetGolden ? '#4CAF50' : color, border: 'none',
              borderRadius: '8px', color: '#fff', cursor: 'pointer',
              opacity: (promoting || (isPromoteTargetGolden && !readiness?.ready)) ? 0.6 : 1,
            }}>
            {promoting
              ? (isPromoteTargetGolden ? copy.publishing : t.admin.common.saving)
              : (isPromoteTargetGolden ? copy.promoteToGolden : `${copy.promoteTo} ${statusLabels[nextStatus]}`)}
          </button>
        )}
      </div>

      {validationErrors.length > 0 && (
        <div style={{
          padding: '8px 12px', fontSize: '12px', lineHeight: '1.5',
          background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
          borderRadius: '8px', color: 'var(--error)',
        }}>
          {validationErrors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}
    </div>
  );
}