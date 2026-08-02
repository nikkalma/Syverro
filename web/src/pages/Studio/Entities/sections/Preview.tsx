import { useEntityWorkspace } from '../EntityWorkspaceContext';
import EditorSectionCard from '../../../../components/Studio/shared/EditorSectionCard';
import { getLocaleData, getBrowserLocale } from '../../../../locales';
import { entityTypeLabel } from '../entityType';

export default function Preview() {
  const t = getLocaleData(getBrowserLocale());
  const { entity } = useEntityWorkspace();
  const eLocale = t.admin.entities;

  if (!entity) return null;

  const statusColor = entity.status === 'published' ? '#4CAF50' : '#61A6A1';
  const statusBg = entity.status === 'published' ? 'rgba(76,175,80,0.15)' : 'rgba(97,166,161,0.15)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={t.admin.workspace.preview}>
        <div style={{
          maxWidth: '420px',
          background: 'var(--surface-hover)',
          border: '1px solid var(--border-soft)',
          borderRadius: '14px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '20px', fontWeight: '500', color: 'var(--text-primary)' }}>
              {entity.name}
            </span>
            <span style={{
              display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
              fontSize: '12px', fontWeight: '500', color: statusColor, background: statusBg,
            }}>
              {entity.status === 'published' ? eLocale.statusPublished : eLocale.statusDraft}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
              fontSize: '12px', fontWeight: '500', color: 'var(--primary)', background: 'var(--primary-soft)',
            }}>
              {entityTypeLabel(entity.node_type)}
            </span>
            {entity.is_sapphire && (
              <span style={{
                display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
                fontSize: '12px', fontWeight: '500', color: '#FFD700', background: 'rgba(255,215,0,0.15)',
              }}>
                {eLocale.sapphire}
              </span>
            )}
            {entity.explorer_visible && (
              <span style={{
                display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
                fontSize: '12px', fontWeight: '500', color: '#4CAF50', background: 'rgba(76,175,80,0.12)',
              }}>
                {eLocale.explorer}
              </span>
            )}
          </div>

          {entity.slug && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/{entity.slug}</div>
          )}

          {entity.description && (
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {entity.description}
            </p>
          )}
        </div>
      </EditorSectionCard>
    </div>
  );
}
