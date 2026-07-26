import EmptyWorkspace from '../../../../../components/Studio/shared/EmptyWorkspace';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';

export default function Timeline() {
  const t = getLocaleData(getBrowserLocale());

  const SAMPLE_EVENTS = [
    { date: '', label: t.admin.authors.editor.timeline.birth, type: 'life' },
    { date: '', label: t.admin.authors.editor.timeline.firstPublication, type: 'career' },
    { date: '', label: t.admin.authors.editor.timeline.majorWork, type: 'publication' },
    { date: '', label: t.admin.authors.editor.timeline.death, type: 'life' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {SAMPLE_EVENTS.map((ev, i) => (
          <div key={i} style={{
            display: 'flex', gap: '16px', alignItems: 'stretch',
            padding: '12px 0',
            borderBottom: i < SAMPLE_EVENTS.length - 1 ? '1px solid var(--border-soft)' : 'none',
          }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '40px', flexShrink: 0,
            }}>
              <div style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: ev.type === 'life' ? 'var(--primary)' : ev.type === 'career' ? 'var(--warning)' : 'var(--success)',
                flexShrink: 0,
              }} />
              {i < SAMPLE_EVENTS.length - 1 && (
                <div style={{ width: '1px', flex: 1, background: 'var(--border-soft)' }} />
              )}
            </div>
            <div style={{ flex: 1, paddingBottom: i < SAMPLE_EVENTS.length - 1 ? '0' : '0' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{ev.date || t.admin.authors.editor.notSet}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>{ev.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px',
        border: '1px dashed var(--border-soft)',
        textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)',
        cursor: 'pointer',
      }}>
        {t.admin.authors.editor.timeline.addEvent}
      </div>

      <EmptyWorkspace
        icon="📅"
        title={t.admin.authors.editor.timeline.workspace}
        description={t.admin.authors.editor.timeline.workspaceDesc}
      />
    </div>
  );
}
