import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';

export default function Identity() {
  const { author, loading } = useAuthorEditor();

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title="Nationalities & States">
        <FieldValue label="Nationality" value={author.nationality} />
      </EditorSectionCard>

      <EditorSectionCard title="Languages">
        <FieldValue label="Writing Languages" value={author.writing_languages?.join(', ')} />
        <FieldValue label="Languages" value={author.languages?.join(', ')} />
      </EditorSectionCard>

      <EditorSectionCard title="Occupations">
        <FieldValue label="Occupations" value={author.occupations?.join(', ')} />
        <FieldValue label="Literary Movements" value={author.literary_movements?.join(', ')} />
      </EditorSectionCard>

      <EditorSectionCard title="Alternative Names">
        <FieldValue label="Birth Name" value={author.birth_name} />
        <FieldValue label="Pen Names" value={author.pen_names?.join(', ')} />
        <FieldValue label="Sort Name" value={author.sort_name} />
      </EditorSectionCard>

      <EditorSectionCard title="Life Events">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <FieldValue label="Birth Date" value={author.birth_date} />
            <FieldValue label="Birth Place" value={author.birth_place} />
          </div>
          <div>
            <FieldValue label="Death Date" value={author.death_date} />
            <FieldValue label="Death Place" value={author.death_place} />
          </div>
        </div>
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
