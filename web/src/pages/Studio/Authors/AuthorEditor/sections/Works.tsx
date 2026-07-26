import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import EmptyWorkspace from '../../../../../components/Studio/shared/EmptyWorkspace';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';

export default function Works() {
  const t = getLocaleData(getBrowserLocale());
  const { author, loading } = useAuthorEditor();

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={t.admin.authors.editor.works.connectedBooks}>
        <EmptyWorkspace
          icon="📚"
          title={t.admin.authors.editor.noConnectedBooks}
          description={t.admin.authors.editor.connectedBooksDesc}
        />
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.works.notableWorks}>
        {author.notable_works && author.notable_works.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {author.notable_works.map((w, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px',
                background: 'var(--surface-hover)',
                borderRadius: '8px',
                fontSize: '14px', color: 'var(--text-secondary)',
              }}>
                <span style={{ fontSize: '16px' }}>📖</span>
                <span style={{ flex: 1 }}>{w}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            {t.admin.authors.editor.noNotableWorks}
          </p>
        )}
        <div style={{
          marginTop: '12px', padding: '10px', background: 'var(--surface-hover)', borderRadius: '8px',
          border: '1px dashed var(--border-soft)',
          textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)',
          cursor: 'pointer',
        }}>
          {t.admin.authors.editor.addNotableWork}
        </div>
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.works.genres}>
        {author.genres && author.genres.length > 0 ? (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {author.genres.map((g, i) => (
              <span key={i} style={{
                padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
                background: 'var(--surface-hover)', color: 'var(--text-secondary)',
                border: '1px solid var(--border-soft)',
              }}>
                {g}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            {t.admin.authors.editor.noGenres}
          </p>
        )}
      </EditorSectionCard>
    </div>
  );
}
