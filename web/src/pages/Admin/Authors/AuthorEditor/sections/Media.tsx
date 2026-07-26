import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Admin/shared/EditorSectionCard';

export default function Media() {
  const { author, loading } = useAuthorEditor();

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title="Portrait">
        {author.photo ? (
          <div>
            <img src={author.photo} alt={author.name}
              style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-soft)' }} />
            <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>{author.photo}</div>
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No portrait set</p>
        )}
      </EditorSectionCard>

      <EditorSectionCard title="Hero Background">
        <FieldValue label="URL" value={author.hero_background_url} />
      </EditorSectionCard>

      <EditorSectionCard title="Gallery">
        {author.gallery && author.gallery.length > 0 ? (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {author.gallery.map((url, i) => (
              <img key={i} src={url} alt={`Gallery ${i + 1}`}
                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-soft)' }} />
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No gallery images</p>
        )}
      </EditorSectionCard>

      <EditorSectionCard title="Signature">
        <FieldValue label="Signature Image" value={author.signature_image} />
        <FieldValue label="Portrait Caption" value={author.portrait_caption} />
      </EditorSectionCard>
    </div>
  );
}

function FieldValue({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {value || '—'}
      </div>
    </div>
  );
}
