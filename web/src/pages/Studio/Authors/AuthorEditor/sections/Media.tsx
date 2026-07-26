import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import Field from '../../../../../components/Studio/shared/Field';

export default function Media() {
  const { author, loading } = useAuthorEditor();

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '24px' }}>
        <EditorSectionCard title="Portrait">
          {author.photo ? (
            <div style={{ textAlign: 'center' }}>
              <img src={author.photo} alt={author.name}
                style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-soft)' }} />
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{author.photo}</div>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No portrait set</p>
          )}
        </EditorSectionCard>

        <EditorSectionCard title="Signature">
          {author.signature_image ? (
            <div>
              <img src={author.signature_image} alt="Signature"
                style={{ maxWidth: '200px', maxHeight: '60px', objectFit: 'contain' }} />
              <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{author.signature_image}</div>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No signature</p>
          )}
        </EditorSectionCard>
      </div>

      <EditorSectionCard title="Hero Background">
        {author.hero_background_url ? (
          <div style={{
            width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden',
            background: 'var(--surface-hover)',
          }}>
            <img src={author.hero_background_url} alt="Hero background"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No hero background set</p>
        )}
        {author.hero_background_url && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{author.hero_background_url}</div>
        )}
      </EditorSectionCard>

      <EditorSectionCard title="Portrait Caption">
        <Field label="Caption" value={author.portrait_caption} />
      </EditorSectionCard>

      <EditorSectionCard title="Gallery">
        {author.gallery && author.gallery.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
            {author.gallery.map((url, i) => (
              <div key={i} style={{
                borderRadius: '8px', overflow: 'hidden',
                border: '1px solid var(--border-soft)',
                aspectRatio: '1',
              }}>
                <img src={url} alt={`Gallery ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No gallery images</p>
        )}
      </EditorSectionCard>
    </div>
  );
}
