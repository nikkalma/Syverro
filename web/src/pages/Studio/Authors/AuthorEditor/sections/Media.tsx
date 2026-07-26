import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import Field from '../../../../../components/Studio/shared/Field';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';

export default function Media() {
  const t = getLocaleData(getBrowserLocale());
  const { author, loading } = useAuthorEditor();

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '24px' }}>
        <EditorSectionCard title={t.admin.authors.editor.media.portrait}>
          {author.photo ? (
            <div style={{ textAlign: 'center' }}>
              <img src={author.photo} alt={author.name}
                style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-soft)' }} />
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{author.photo}</div>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>{t.admin.authors.editor.noPortrait}</p>
          )}
        </EditorSectionCard>

        <EditorSectionCard title={t.admin.authors.editor.media.signature}>
          {author.signature_image ? (
            <div>
              <img src={author.signature_image} alt={t.admin.authors.editor.media.signatureAlt}
                style={{ maxWidth: '200px', maxHeight: '60px', objectFit: 'contain' }} />
              <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{author.signature_image}</div>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>{t.admin.authors.editor.noSignature}</p>
          )}
        </EditorSectionCard>
      </div>

      <EditorSectionCard title={t.admin.authors.editor.media.heroBackground}>
        {author.hero_background_url ? (
          <div style={{
            width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden',
            background: 'var(--surface-hover)',
          }}>
            <img src={author.hero_background_url} alt={t.admin.authors.editor.media.heroBackgroundAlt}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>{t.admin.authors.editor.noHeroBg}</p>
        )}
        {author.hero_background_url && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{author.hero_background_url}</div>
        )}
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.media.portraitCaption}>
        <Field label={t.admin.authors.editor.media.caption} value={author.portrait_caption} />
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.media.gallery}>
        {author.gallery && author.gallery.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
            {author.gallery.map((url, i) => (
              <div key={i} style={{
                borderRadius: '8px', overflow: 'hidden',
                border: '1px solid var(--border-soft)',
                aspectRatio: '1',
              }}>
                <img src={url} alt={`${t.admin.authors.editor.media.gallery} ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>{t.admin.authors.editor.noGallery}</p>
        )}
      </EditorSectionCard>
    </div>
  );
}
