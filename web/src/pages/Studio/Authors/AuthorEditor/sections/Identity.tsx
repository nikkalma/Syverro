import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import Field from '../../../../../components/Studio/shared/Field';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';

export default function Identity() {
  const { author, loading } = useAuthorEditor();

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title="Nationality & Historical States">
        <DetailGrid>
          <Field label="Nationality" value={author.nationality} />
          <Field label="Country" value={author.country} />
        </DetailGrid>
      </EditorSectionCard>

      <EditorSectionCard title="Languages">
        <DetailGrid>
          <Field label="Writing Languages" value={author.writing_languages?.join(', ')} />
          <Field label="Spoken Languages" value={author.languages?.join(', ')} />
        </DetailGrid>
      </EditorSectionCard>

      <EditorSectionCard title="Occupations">
        <DetailGrid>
          <Field label="Occupations" value={author.occupations?.join(', ')} />
          <Field label="Literary Movements" value={author.literary_movements?.join(', ')} />
        </DetailGrid>
      </EditorSectionCard>

      <EditorSectionCard title="Alternative Names">
        <DetailGrid>
          <Field label="Birth Name" value={author.birth_name} />
          <Field label="Pen Names" value={author.pen_names?.join(', ')} />
          <Field label="Sort Name" value={author.sort_name} />
          <Field label="Pseudonyms" value={author.pseudonyms?.join(', ')} />
        </DetailGrid>
      </EditorSectionCard>

      <EditorSectionCard title="Life Events">
        <DetailGrid>
          <div>
            <Field label="Birth Date" value={author.birth_date} />
            <div style={{ marginTop: '8px' }}>
              <Field label="Birth Place" value={author.birth_place} />
            </div>
          </div>
          <div>
            <Field label="Death Date" value={author.death_date} />
            <div style={{ marginTop: '8px' }}>
              <Field label="Death Place" value={author.death_place} />
            </div>
          </div>
        </DetailGrid>
      </EditorSectionCard>
    </div>
  );
}
