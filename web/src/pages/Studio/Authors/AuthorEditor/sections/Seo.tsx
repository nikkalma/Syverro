import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import Field from '../../../../../components/Studio/shared/Field';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';

export default function Seo() {
  const { author, loading } = useAuthorEditor();

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title="SEO Metadata">
        <DetailGrid columns={3}>
          <Field label="Slug" value={author.slug} />
          <Field label="Sort Name" value={author.sort_name} />
          <Field label="Search Aliases" value={author.search_aliases} />
        </DetailGrid>
      </EditorSectionCard>

      <EditorSectionCard title="External References">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px', background: 'var(--surface-hover)', borderRadius: '8px',
          }}>
            <span style={{ fontSize: '18px' }}>🌐</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Official Website</div>
              <div style={{ fontSize: '14px', color: author.official_website ? 'var(--primary)' : 'var(--text-muted)' }}>
                {author.official_website || 'Not set'}
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px', background: 'var(--surface-hover)', borderRadius: '8px',
          }}>
            <span style={{ fontSize: '18px' }}>📖</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Wikipedia</div>
              <div style={{ fontSize: '14px', color: author.wikipedia_url ? 'var(--primary)' : 'var(--text-muted)' }}>
                {author.wikipedia_url || 'Not set'}
              </div>
            </div>
          </div>
        </div>
      </EditorSectionCard>
    </div>
  );
}
