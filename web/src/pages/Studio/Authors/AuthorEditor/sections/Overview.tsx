import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';

export default function Overview() {
  const { author, loading } = useAuthorEditor();

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title="Basic Information">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Name" value={author.name} />
          <Field label="Native Name" value={author.native_name} />
          <Field label="Display Name" value={author.display_name} />
          <Field label="Slug" value={author.slug} />
        </div>
      </EditorSectionCard>

      <EditorSectionCard title="Media">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <Label>Portrait URL</Label>
            {author.photo ? (
              <div style={{ marginTop: '8px' }}>
                <img src={author.photo} alt={author.name}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-soft)' }} />
              </div>
            ) : (
              <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No portrait set</div>
            )}
          </div>
          <Field label="Hero Background" value={author.hero_background_url} />
        </div>
      </EditorSectionCard>

      <EditorSectionCard title="Intro Quote">
        {author.author_intro_quote ? (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
            {author.author_intro_quote}
          </p>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No intro quote set</p>
        )}
      </EditorSectionCard>

      <EditorSectionCard title="Publication State">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Creation Type" value={author.creation_type} />
          <Field label="Books Count" value={String(author.book_count)} />
          <Field label="Created" value={author.created_at ? new Date(author.created_at).toLocaleDateString() : '-'} />
          <Field label="Updated" value={author.updated_at ? new Date(author.updated_at).toLocaleDateString() : '-'} />
        </div>
      </EditorSectionCard>
    </div>
  );
}

function Label({ children }: { children: string }) {
  return (
    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ marginTop: '6px', fontSize: '14px', color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {value || '—'}
      </div>
    </div>
  );
}
