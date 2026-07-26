import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';

export default function Works() {
  const { author, loading } = useAuthorEditor();

  if (loading || !author) return null;

  return (
    <EditorSectionCard title="Notable Works">
      {author.notable_works && author.notable_works.length > 0 ? (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {author.notable_works.map((w, i) => (
            <li key={i} style={{
              padding: '8px 0',
              borderBottom: i < author.notable_works!.length - 1 ? '1px solid var(--border-soft)' : 'none',
              fontSize: '14px', color: 'var(--text-secondary)',
            }}>
              {w}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
          No notable works listed
        </p>
      )}
    </EditorSectionCard>
  );
}
