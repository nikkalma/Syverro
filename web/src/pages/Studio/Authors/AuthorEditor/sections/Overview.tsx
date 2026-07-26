import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import Field from '../../../../../components/Studio/shared/Field';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';

export default function Overview() {
  const t = getLocaleData(getBrowserLocale());
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
          <EditorSectionCard title={t.admin.authors.editor.overview.coreInfo}>
            <DetailGrid>
              <Field label={t.admin.authors.editor.overview.name} value={author.name} />
              <Field label={t.admin.authors.editor.overview.nativeName} value={author.native_name} />
              <Field label={t.admin.authors.editor.overview.displayName} value={author.display_name} />
              <Field label={t.admin.authors.editor.overview.slug} value={author.slug} />
            </DetailGrid>
          </EditorSectionCard>
        </div>
      </div>

      <EditorSectionCard title={t.admin.authors.editor.overview.heroBackground}>
        {author.hero_background_url ? (
          <div style={{
            width: '100%', height: '160px', borderRadius: '8px', overflow: 'hidden',
            background: 'var(--surface-hover)',
          }}>
            <img src={author.hero_background_url} alt={t.admin.authors.editor.media.heroAlt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>{t.admin.authors.editor.noHeroBg}</p>
        )}
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.overview.introQuote}>
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
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>{t.admin.authors.editor.noIntroQuote}</p>
        )}
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.overview.publicationState}>
        <DetailGrid>
          <Field label={t.admin.authors.editor.overview.creationType} value={author.creation_type} />
          <Field label={t.admin.authors.editor.overview.booksCount} value={author.book_count} />
          <Field label={t.admin.authors.editor.overview.created} value={author.created_at ? new Date(author.created_at).toLocaleDateString() : '-'} />
          <Field label={t.admin.authors.editor.overview.updated} value={author.updated_at ? new Date(author.updated_at).toLocaleDateString() : '-'} />
        </DetailGrid>
      </EditorSectionCard>
    </div>
  );
}
