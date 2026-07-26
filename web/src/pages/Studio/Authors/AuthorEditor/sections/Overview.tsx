import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import Field from '../../../../../components/Studio/shared/Field';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';

export default function Overview() {
  const { author, loading } = useAuthorEditor();

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{
          width: '100px', height: '100px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary-soft), var(--surface))',
          border: '2px solid var(--border-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px', color: 'var(--primary)',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {author.photo ? (
            <img src={author.photo} alt={author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            author.name.charAt(0).toUpperCase()
          )}
        </div>
        <div style={{ flex: 1 }}>
          <EditorSectionCard title="Core Information">
            <DetailGrid>
              <Field label="Name" value={author.name} />
              <Field label="Native Name" value={author.native_name} />
              <Field label="Display Name" value={author.display_name} />
              <Field label="Slug" value={author.slug} />
            </DetailGrid>
          </EditorSectionCard>
        </div>
      </div>

      <EditorSectionCard title="Hero Background">
        {author.hero_background_url ? (
          <div style={{
            width: '100%', height: '160px', borderRadius: '8px', overflow: 'hidden',
            background: 'var(--surface-hover)',
          }}>
            <img src={author.hero_background_url} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No hero background set</p>
        )}
      </EditorSectionCard>

      <EditorSectionCard title="Intro Quote">
        {author.author_intro_quote ? (
          <blockquote style={{
            margin: 0, padding: '16px 20px',
            borderLeft: '3px solid var(--primary)',
            background: 'var(--surface-hover)',
            borderRadius: '0 8px 8px 0',
            fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6,
          }}>
            {author.author_intro_quote}
          </blockquote>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No intro quote set</p>
        )}
      </EditorSectionCard>

      <EditorSectionCard title="Publication State">
        <DetailGrid>
          <Field label="Creation Type" value={author.creation_type} />
          <Field label="Books Count" value={author.book_count} />
          <Field label="Created" value={author.created_at ? new Date(author.created_at).toLocaleDateString() : '-'} />
          <Field label="Updated" value={author.updated_at ? new Date(author.updated_at).toLocaleDateString() : '-'} />
        </DetailGrid>
      </EditorSectionCard>
    </div>
  );
}
