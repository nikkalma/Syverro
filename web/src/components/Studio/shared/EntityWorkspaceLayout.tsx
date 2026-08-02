import { Outlet } from 'react-router-dom';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import EntityEditorHeader from './EntityEditorHeader';
import EditorSectionNav from './EditorSectionNav';

export interface EntityWorkspaceSection {
  path: string;
  label: string;
}

interface Props {
  name: string;
  photoUrl?: string | null;
  completionPercent?: number;
  lastUpdated?: string;
  statusLabel?: string;
  identitySummary?: string;
  metadataStatus?: string;
  entityTypeLabel?: string;
  sapphireStatus?: string;
  explorerVisible?: boolean;
  sections: EntityWorkspaceSection[];
  basePath: string;
  preview?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  notFoundLabel?: string;
}

export default function EntityWorkspaceLayout({
  name,
  photoUrl,
  completionPercent,
  lastUpdated,
  statusLabel,
  identitySummary,
  metadataStatus,
  entityTypeLabel,
  sapphireStatus,
  explorerVisible,
  sections,
  basePath,
  preview,
  loading,
  error,
  notFoundLabel,
}: Props) {
  const t = getLocaleData(getBrowserLocale());

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        {t.admin.common.loading}
      </div>
    );
  }

  if (error || !name) {
    return (
      <div style={{
        padding: '40px', textAlign: 'center', color: 'var(--error)',
        background: 'var(--glass-bg)', borderRadius: '12px',
        border: '1px solid var(--glass-border)',
      }}>
        <p>{error || notFoundLabel || name}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <EntityEditorHeader
        name={name}
        photoUrl={photoUrl}
        completionPercent={completionPercent}
        lastUpdated={lastUpdated}
        statusLabel={statusLabel}
        identitySummary={identitySummary}
        metadataStatus={metadataStatus}
        entityTypeLabel={entityTypeLabel}
        sapphireStatus={sapphireStatus}
        explorerVisible={explorerVisible}
      />
      <EditorSectionNav sections={sections} basePath={basePath} />
      <div style={{ flex: 1, display: 'flex', gap: '24px', padding: '24px 28px' }}>
        <div style={{
          flex: 1, minWidth: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border-soft)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <Outlet />
        </div>
        {preview && (
          <aside style={{
            width: '220px', flexShrink: 0,
            display: 'flex', flexDirection: 'column', gap: '16px',
          }}>
            {preview}
          </aside>
        )}
      </div>
    </div>
  );
}
