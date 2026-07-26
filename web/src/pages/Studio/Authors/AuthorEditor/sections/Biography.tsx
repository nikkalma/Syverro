import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import Field from '../../../../../components/Studio/shared/Field';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';

export default function Biography() {
  const { author, loading } = useAuthorEditor();

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title="Biography">
        {author.bio ? (
          <div style={{
            fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap',
            padding: '16px 20px', background: 'var(--surface-hover)', borderRadius: '8px',
          }}>
            {author.bio}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            No biography written yet
          </p>
        )}
      </EditorSectionCard>

      <EditorSectionCard title="Biography Editor">
        <textarea
          defaultValue={author.bio || ''}
          placeholder="Write or edit the author's biography here..."
          rows={12}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '14px',
            lineHeight: 1.8,
            fontFamily: 'Inter, sans-serif',
            background: 'var(--bg)',
            border: '1px solid var(--border-soft)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            resize: 'vertical',
            outline: 'none',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-soft)'; }}
        />
      </EditorSectionCard>

      <EditorSectionCard title="Activity Period">
        <DetailGrid>
          <Field label="Active From" value={author.active_from_year} />
          <Field label="Active To" value={author.active_to_year} />
        </DetailGrid>
      </EditorSectionCard>
    </div>
  );
}
