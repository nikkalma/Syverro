import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import EmptyWorkspace from '../../../../../components/Studio/shared/EmptyWorkspace';

const RELATION_TYPES = [
  { icon: '🏷️', label: 'Thematic Tags', desc: 'Themes associated with this author\'s body of work' },
  { icon: '🔁', label: 'Motifs', desc: 'Recurring motifs and narrative patterns' },
  { icon: '💡', label: 'Concepts', desc: 'Philosophical or intellectual concepts' },
  { icon: '🌌', label: 'Atmospheres', desc: 'Mood and atmospheric qualities of their works' },
  { icon: '🔗', label: 'Relations', desc: 'Connections to other authors, works, schools' },
];

export default function Graph() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title="Knowledge Graph">
        <EmptyWorkspace
          icon="🔗"
          title="Knowledge Graph Workspace"
          description="Themes, motifs, concepts, atmospheres, and relations linked to this author will be managed here."
        />
      </EditorSectionCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
        {RELATION_TYPES.map((rt, i) => (
          <div key={i} style={{
            padding: '16px',
            background: 'var(--surface)',
            border: '1px solid var(--border-soft)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{rt.icon}</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {rt.label}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {rt.desc}
            </div>
            <div style={{
              marginTop: '10px', padding: '6px 12px', borderRadius: '6px',
              fontSize: '12px', color: 'var(--primary)', border: '1px solid var(--primary)',
              display: 'inline-block',
            }}>
              Manage →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
