import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import EmptyWorkspace from '../../../../../components/Studio/shared/EmptyWorkspace';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';

export default function Graph() {
  const t = getLocaleData(getBrowserLocale());

  const RELATION_TYPES = [
    { icon: '🏷️', label: t.admin.authors.editor.graph.thematicTags, desc: t.admin.authors.editor.graph.tagsDesc },
    { icon: '🔁', label: t.admin.authors.editor.graph.motifs, desc: t.admin.authors.editor.graph.motifsDesc },
    { icon: '💡', label: t.admin.authors.editor.graph.concepts, desc: t.admin.authors.editor.graph.conceptsDesc },
    { icon: '🌌', label: t.admin.authors.editor.graph.atmospheres, desc: t.admin.authors.editor.graph.atmospheresDesc },
    { icon: '🔗', label: t.admin.authors.editor.graph.relations, desc: t.admin.authors.editor.graph.relationsDesc },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={t.admin.authors.editor.graph.knowledgeGraph}>
        <EmptyWorkspace
          icon="🔗"
          title={t.admin.authors.editor.graph.workspace}
          description={t.admin.authors.editor.graph.workspaceDesc}
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
              {t.admin.authors.editor.graph.manage}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
