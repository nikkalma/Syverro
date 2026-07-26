import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import Field from '../../../../../components/Studio/shared/Field';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';

export default function Biography() {
  const t = getLocaleData(getBrowserLocale());
  const { author, loading } = useAuthorEditor();

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={t.admin.authors.editor.biography.biography}>
        {author.bio ? (
          <div style={{
            fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap',
            padding: '16px 20px', background: 'var(--surface-hover)', borderRadius: '8px',
          }}>
            {author.bio}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            {t.admin.authors.editor.noBio}
          </p>
        )}
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.biography.biographyEditor}>
        <textarea
          defaultValue={author.bio || ''}
          placeholder={t.admin.authors.editor.bioPlaceholder}
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

      <EditorSectionCard title={t.admin.authors.editor.biography.activityPeriod}>
        <DetailGrid>
          <Field label={t.admin.authors.editor.biography.activeFrom} value={author.active_from_year} />
          <Field label={t.admin.authors.editor.biography.activeTo} value={author.active_to_year} />
        </DetailGrid>
      </EditorSectionCard>
    </div>
  );
}
