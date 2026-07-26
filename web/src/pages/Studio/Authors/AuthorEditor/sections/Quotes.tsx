import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import EmptyWorkspace from '../../../../../components/Studio/shared/EmptyWorkspace';

export default function Quotes() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title="Quotes About the Author">
        <EmptyWorkspace
          icon="💬"
          title="No quotes about this author"
          description="Quotes from critics, peers, and reviews about this author will appear here."
        />
        <div style={{
          marginTop: '12px', padding: '10px', background: 'var(--surface-hover)', borderRadius: '8px',
          border: '1px dashed var(--border-soft)',
          textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)',
          cursor: 'pointer',
        }}>
          + Add quote
        </div>
      </EditorSectionCard>

      <EditorSectionCard title="Author Statements">
        <EmptyWorkspace
          icon="✍️"
          title="No author statements"
          description="Notable statements, manifestos, or remarks by this author will appear here."
        />
        <div style={{
          marginTop: '12px', padding: '10px', background: 'var(--surface-hover)', borderRadius: '8px',
          border: '1px dashed var(--border-soft)',
          textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)',
          cursor: 'pointer',
        }}>
          + Add statement
        </div>
      </EditorSectionCard>
    </div>
  );
}
