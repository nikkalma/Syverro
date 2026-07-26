import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Admin/shared/EditorSectionCard';

export default function Biography() {
  const { author, loading } = useAuthorEditor();

  if (loading || !author) return null;

  return (
    <EditorSectionCard title="Biography">
      {author.bio ? (
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
          {author.bio}
        </p>
      ) : (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
          No biography written yet
        </p>
      )}
    </EditorSectionCard>
  );
}
