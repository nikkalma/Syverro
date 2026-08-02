import { useAuthorEditor } from '../AuthorEditorContext';
import { BookOpen } from 'lucide-react';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import Field from '../../../../../components/Studio/shared/Field';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';

export default function Seo() {
  const t = getLocaleData(getBrowserLocale());
  const { author, loading } = useAuthorEditor();

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={t.admin.authors.editor.seo.seoMetadata}>
        <DetailGrid columns={3}>
          <Field label={t.admin.authors.editor.seo.slug} value={author.slug} />
          <Field label={t.admin.authors.editor.identity.sortName} value={author.sort_name} />
          <Field label={t.admin.authors.editor.seo.searchAliases} value={author.search_aliases} />
        </DetailGrid>
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.seo.externalReferences}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px', background: 'var(--surface-hover)', borderRadius: '8px',
          }}>
            <span style={{ fontSize: '18px' }}>🌐</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.admin.authors.editor.seo.officialWebsite}</div>
              <div style={{ fontSize: '14px', color: author.official_website ? 'var(--primary)' : 'var(--text-muted)' }}>
                {author.official_website || t.admin.authors.editor.notSet}
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px', background: 'var(--surface-hover)', borderRadius: '8px',
          }}>
            <span style={{ display: 'inline-flex', color: 'var(--primary)', opacity: 0.7 }}><BookOpen size={18} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.admin.authors.editor.seo.wikipedia}</div>
              <div style={{ fontSize: '14px', color: author.wikipedia_url ? 'var(--primary)' : 'var(--text-muted)' }}>
                {author.wikipedia_url || t.admin.authors.editor.notSet}
              </div>
            </div>
          </div>
        </div>
      </EditorSectionCard>
    </div>
  );
}
