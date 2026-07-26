import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import Field from '../../../../../components/Studio/shared/Field';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';

export default function Identity() {
  const t = getLocaleData(getBrowserLocale());
  const { author, loading } = useAuthorEditor();

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={t.admin.authors.editor.identity.nationalityStates}>
        <DetailGrid>
          <Field label={t.admin.authors.editor.identity.nationality} value={author.nationality} />
          <Field label={t.admin.authors.editor.identity.country} value={author.country} />
        </DetailGrid>
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.identity.languages}>
        <DetailGrid>
          <Field label={t.admin.authors.editor.identity.writingLanguages} value={author.writing_languages?.join(', ')} />
          <Field label={t.admin.authors.editor.identity.spokenLanguages} value={author.languages?.join(', ')} />
        </DetailGrid>
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.identity.occupations}>
        <DetailGrid>
          <Field label={t.admin.authors.editor.identity.occupations} value={author.occupations?.join(', ')} />
          <Field label={t.admin.authors.editor.identity.literaryMovements} value={author.literary_movements?.join(', ')} />
        </DetailGrid>
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.identity.alternativeNames}>
        <DetailGrid>
          <Field label={t.admin.authors.editor.identity.birthName} value={author.birth_name} />
          <Field label={t.admin.authors.editor.identity.penNames} value={author.pen_names?.join(', ')} />
          <Field label={t.admin.authors.editor.identity.sortName} value={author.sort_name} />
          <Field label={t.admin.authors.editor.identity.pseudonyms} value={author.pseudonyms?.join(', ')} />
        </DetailGrid>
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.identity.lifeEvents}>
        <DetailGrid>
          <div>
            <Field label={t.admin.authors.editor.identity.birthDate} value={author.birth_date} />
            <div style={{ marginTop: '8px' }}>
              <Field label={t.admin.authors.editor.identity.birthPlace} value={author.birth_place} />
            </div>
          </div>
          <div>
            <Field label={t.admin.authors.editor.identity.deathDate} value={author.death_date} />
            <div style={{ marginTop: '8px' }}>
              <Field label={t.admin.authors.editor.identity.deathPlace} value={author.death_place} />
            </div>
          </div>
        </DetailGrid>
      </EditorSectionCard>
    </div>
  );
}
