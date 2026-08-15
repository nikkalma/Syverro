import { useEffect, useState, type CSSProperties } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import { BookOpen } from 'lucide-react';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import Field from '../../../../../components/Studio/shared/Field';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';
import ActionBar from '../../../../../components/Studio/shared/ActionBar';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';

export default function Seo() {
  const t = getLocaleData(getBrowserLocale());
  const { author, loading, saving, updateAuthor } = useAuthorEditor();
  const [officialWebsite, setOfficialWebsite] = useState('');
  const [wikipediaUrl, setWikipediaUrl] = useState('');

  useEffect(() => {
    if (!author) return;
    setOfficialWebsite(author.official_website || '');
    setWikipediaUrl(author.wikipedia_url || '');
  }, [author]);

  if (loading || !author) return null;

  const dirty = officialWebsite !== (author.official_website || '') || wikipediaUrl !== (author.wikipedia_url || '');
  const inputStyle: CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize: '14px',
    background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
    borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
  };

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
              <input type="url" value={officialWebsite} onChange={(event) => setOfficialWebsite(event.target.value)}
                placeholder="https://" style={inputStyle} />
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px', background: 'var(--surface-hover)', borderRadius: '8px',
          }}>
            <span style={{ display: 'inline-flex', color: 'var(--primary)', opacity: 0.7 }}><BookOpen size={18} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.admin.authors.editor.seo.wikipedia}</div>
              <input type="url" value={wikipediaUrl} onChange={(event) => setWikipediaUrl(event.target.value)}
                placeholder="https://" style={inputStyle} />
            </div>
          </div>
        </div>
      </EditorSectionCard>
      <ActionBar
        onSave={() => updateAuthor({
          official_website: officialWebsite.trim() || null,
          wikipedia_url: wikipediaUrl.trim() || null,
        })}
        onCancel={() => {
          setOfficialWebsite(author.official_website || '');
          setWikipediaUrl(author.wikipedia_url || '');
        }}
        saving={saving}
        dirty={dirty}
        saveLabel={t.admin.common.save}
        savingLabel={t.admin.common.saving}
        cancelLabel={t.admin.common.cancel}
      />
    </div>
  );
}
