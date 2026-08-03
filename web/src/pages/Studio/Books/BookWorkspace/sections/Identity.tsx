import { useState, useEffect } from 'react';
import { useBookWorkspace } from '../BookWorkspaceContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';
import ActionBar from '../../../../../components/Studio/shared/ActionBar';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import type { AdminBook } from '../../../../../types/admin';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '14px',
  background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
};

export default function Identity() {
  const t = getLocaleData(getBrowserLocale());
  const { book, saving, saveError, saveBook } = useBookWorkspace();

  const [isPublished, setIsPublished] = useState(false);
  const [metadataStatus, setMetadataStatus] = useState<AdminBook['metadata_status']>('draft');
  const [moderationStatus, setModerationStatus] = useState<AdminBook['moderation_status']>('draft');

  useEffect(() => {
    if (!book) return;
    setIsPublished(book.is_published === true);
    setMetadataStatus(book.metadata_status || 'draft');
    setModerationStatus(book.moderation_status || 'draft');
  }, [book]);

  if (!book) return null;

  const fieldLabel = (label: string) => (
    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
      {label}
    </div>
  );

  const hasChanges = Boolean(
    isPublished !== (book.is_published === true) ||
    metadataStatus !== book.metadata_status ||
    moderationStatus !== book.moderation_status
  );

  const reset = () => {
    setIsPublished(book.is_published === true);
    setMetadataStatus(book.metadata_status || 'draft');
    setModerationStatus(book.moderation_status || 'draft');
  };

  const handleSave = async () => {
    await saveBook({
      is_published: isPublished,
      metadata_status: metadataStatus,
      moderation_status: moderationStatus,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={t.admin.workspace.status}>
        <DetailGrid columns={2}>
          <div>
            {fieldLabel(t.admin.workspace.moderation)}
            <select value={moderationStatus} onChange={(e) => setModerationStatus(e.target.value as AdminBook['moderation_status'])} style={inputStyle}>
              <option value="draft">{t.admin.workspace.moderationStatuses.draft}</option>
              <option value="pending">{t.admin.workspace.moderationStatuses.pending}</option>
              <option value="approved">{t.admin.workspace.moderationStatuses.approved}</option>
              <option value="published">{t.admin.workspace.moderationStatuses.published}</option>
              <option value="archived">{t.admin.workspace.moderationStatuses.archived}</option>
            </select>
          </div>
          <div>
            {fieldLabel(t.admin.workspace.metadata)}
            <select value={metadataStatus} onChange={(e) => setMetadataStatus(e.target.value as AdminBook['metadata_status'])} style={inputStyle}>
              <option value="draft">{t.admin.workspace.metadataStatuses.draft}</option>
              <option value="incomplete">{t.admin.workspace.metadataStatuses.incomplete}</option>
              <option value="review_ready">{t.admin.workspace.metadataStatuses.reviewReady}</option>
              <option value="complete">{t.admin.workspace.metadataStatuses.complete}</option>
            </select>
          </div>
        </DetailGrid>
        <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="checkbox" checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              style={{ accentColor: 'var(--primary)' }} />
            {t.admin.books.publishBook}
          </label>
        </div>
        {book.moderation_reason && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--error)' }}>
            {book.moderation_reason}
          </div>
        )}
      </EditorSectionCard>

      {saveError && (
        <div style={{ padding: '12px 16px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '8px', color: 'var(--error)', fontSize: '13px' }}>
          {saveError}
        </div>
      )}

      <ActionBar
        onSave={handleSave}
        onCancel={reset}
        saving={saving}
        dirty={hasChanges}
        saveLabel={t.admin.common.save}
        savingLabel={t.admin.common.saving}
        cancelLabel={t.admin.common.cancel}
      />
    </div>
  );
}
