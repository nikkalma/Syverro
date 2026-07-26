import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';

export default function Seo() {
  const { author, loading } = useAuthorEditor();

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title="SEO Metadata">
        <FieldValue label="Slug" value={author.slug} />
        <FieldValue label="Search Aliases" value={author.search_aliases} />
        <FieldValue label="Official Website" value={author.official_website} />
        <FieldValue label="Wikipedia URL" value={author.wikipedia_url} />
      </EditorSectionCard>
    </div>
  );
}

function FieldValue({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {value || '—'}
      </div>
    </div>
  );
}
