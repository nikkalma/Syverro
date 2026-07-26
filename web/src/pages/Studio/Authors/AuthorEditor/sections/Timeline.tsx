import EmptyWorkspace from '../../../../../components/Studio/shared/EmptyWorkspace';

const SAMPLE_EVENTS = [
  { date: '', label: 'Birth', type: 'life' },
  { date: '', label: 'First Publication', type: 'career' },
  { date: '', label: 'Major Work', type: 'publication' },
  { date: '', label: 'Death', type: 'life' },
];

export default function Timeline() {
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
                background: ev.type === 'life' ? 'var(--primary)' : ev.type === 'career' ? '#FFA726' : '#4CAF50',
                flexShrink: 0,
              }} />
              {i < SAMPLE_EVENTS.length - 1 && (
                <div style={{ width: '1px', flex: 1, background: 'var(--border-soft)' }} />
              )}
            </div>
            <div style={{ flex: 1, paddingBottom: i < SAMPLE_EVENTS.length - 1 ? '0' : '0' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{ev.date || 'Not set'}</div>
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
        + Add timeline event
      </div>

      <EmptyWorkspace
        icon="📅"
        title="Timeline Workspace"
        description="Chronological life events will be managed here — births, deaths, major publications, relocations, and other milestones. Select an event to edit or add new ones above."
      />
    </div>
  );
}
