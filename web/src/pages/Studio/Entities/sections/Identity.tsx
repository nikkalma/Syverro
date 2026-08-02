import { useState, useEffect } from 'react';
import { useEntityWorkspace } from '../EntityWorkspaceContext';
import EditorSectionCard from '../../../../components/Studio/shared/EditorSectionCard';
import DetailGrid from '../../../../components/Studio/shared/DetailGrid';
import ActionBar from '../../../../components/Studio/shared/ActionBar';
import { getLocaleData, getBrowserLocale } from '../../../../locales';
import { entityTypeLabel } from '../entityType';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '14px',
  background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
};

export default function Identity() {
  const t = getLocaleData(getBrowserLocale());
  const { entity, saving, saveError, saveEntity } = useEntityWorkspace();
  const eLocale = t.admin.entities;

  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [isSapphire, setIsSapphire] = useState(false);
  const [explorerVisible, setExplorerVisible] = useState(false);

  useEffect(() => {
    if (!entity) return;
    setStatus(entity.status || 'draft');
    setIsSapphire(entity.is_sapphire === true);
    setExplorerVisible(entity.explorer_visible === true);
  }, [entity]);

  const hasChanges = Boolean(
    entity &&
    (status !== entity.status ||
      isSapphire !== (entity.is_sapphire === true) ||
      explorerVisible !== (entity.explorer_visible === true))
  );

  const reset = () => {
    if (!entity) return;
    setStatus(entity.status || 'draft');
    setIsSapphire(entity.is_sapphire === true);
    setExplorerVisible(entity.explorer_visible === true);
  };

  const handleSave = async () => {
    await saveEntity({
      status,
      is_sapphire: isSapphire,
      explorer_visible: explorerVisible,
    });
  };

  if (!entity) return null;

  const fieldLabel = (label: string) => (
    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
      {label}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={eLocale.type}>
        <DetailGrid columns={2}>
          <div>
            {fieldLabel(eLocale.type)}
            <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
              {entityTypeLabel(entity.node_type)}
            </div>
          </div>
          <div>
            {fieldLabel(eLocale.parent)}
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {entity.parent_id || eLocale.noParent}
            </div>
          </div>
        </DetailGrid>
      </EditorSectionCard>

      <EditorSectionCard title={eLocale.status}>
        <DetailGrid columns={2}>
          <div>
            {fieldLabel(eLocale.status)}
            <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} style={inputStyle}>
              <option value="draft">{eLocale.statusDraft}</option>
              <option value="published">{eLocale.statusPublished}</option>
            </select>
          </div>
        </DetailGrid>
        <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="checkbox" checked={isSapphire}
              onChange={(e) => setIsSapphire(e.target.checked)}
              style={{ accentColor: 'var(--primary)' }} />
            {eLocale.sapphire}
          </label>
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="checkbox" checked={explorerVisible}
              onChange={(e) => setExplorerVisible(e.target.checked)}
              style={{ accentColor: 'var(--primary)' }} />
            {eLocale.explorer}
          </label>
        </div>
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
