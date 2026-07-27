import { useState, useEffect } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';
import ActionBar from '../../../../../components/Studio/shared/ActionBar';
import SuggestionInput from '../../../../../components/Studio/shared/SuggestionInput';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import type { AdminAuthorUpdate } from '../../../../../types/admin';

function FormField({ label, value, onChange, placeholder, type, disabled }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'url';
  disabled?: boolean;
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize: '14px',
    background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
    borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
    fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
  };
  return (
    <div>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {label}
      </div>
      <input
        type={type || 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{ ...inputStyle, opacity: disabled ? 0.6 : 1 }}
      />
    </div>
  );
}

function stringOrNull(v: string): string | null {
  return v.trim() || null;
}

export default function Identity() {
  const t = getLocaleData(getBrowserLocale());
  const { author, loading, saving, saveError, updateAuthor } = useAuthorEditor();

  const [nativeName, setNativeName] = useState('');
  const [birthName, setBirthName] = useState('');
  const [sortName, setSortName] = useState('');
  const [penNames, setPenNames] = useState<string[]>([]);
  const [pseudonyms, setPseudonyms] = useState<string[]>([]);

  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [deathPlace, setDeathPlace] = useState('');

  const [nationality, setNationality] = useState('');
  const [occupations, setOccupations] = useState<string[]>([]);
  const [literaryMovements, setLiteraryMovements] = useState<string[]>([]);

  useEffect(() => {
    if (!author) return;
    setNativeName(author.native_name || '');
    setBirthName(author.birth_name || '');
    setSortName(author.sort_name || '');
    setPenNames(author.pen_names || []);
    setPseudonyms(author.pseudonyms || []);
    setBirthDate(author.birth_date || '');
    setBirthPlace(author.birth_place || '');
    setDeathDate(author.death_date || '');
    setDeathPlace(author.death_place || '');
    setNationality(author.nationality || '');
    setOccupations(author.occupations || []);
    setLiteraryMovements(author.literary_movements || []);
  }, [author]);

  const hasChanges =
    nativeName !== (author?.native_name || '') ||
    birthName !== (author?.birth_name || '') ||
    sortName !== (author?.sort_name || '') ||
    JSON.stringify(penNames) !== JSON.stringify(author?.pen_names || []) ||
    JSON.stringify(pseudonyms) !== JSON.stringify(author?.pseudonyms || []) ||
    birthDate !== (author?.birth_date || '') ||
    birthPlace !== (author?.birth_place || '') ||
    deathDate !== (author?.death_date || '') ||
    deathPlace !== (author?.death_place || '') ||
    nationality !== (author?.nationality || '') ||
    JSON.stringify(occupations) !== JSON.stringify(author?.occupations || []) ||
    JSON.stringify(literaryMovements) !== JSON.stringify(author?.literary_movements || []);

  const reset = () => {
    if (!author) return;
    setNativeName(author.native_name || '');
    setBirthName(author.birth_name || '');
    setSortName(author.sort_name || '');
    setPenNames(author.pen_names || []);
    setPseudonyms(author.pseudonyms || []);
    setBirthDate(author.birth_date || '');
    setBirthPlace(author.birth_place || '');
    setDeathDate(author.death_date || '');
    setDeathPlace(author.death_place || '');
    setNationality(author.nationality || '');
    setOccupations(author.occupations || []);
    setLiteraryMovements(author.literary_movements || []);
  };

  const handleSave = async () => {
    const data: AdminAuthorUpdate = {
      native_name: stringOrNull(nativeName),
      birth_name: stringOrNull(birthName),
      sort_name: stringOrNull(sortName),
      pen_names: penNames,
      pseudonyms,
      birth_date: stringOrNull(birthDate),
      birth_place: stringOrNull(birthPlace),
      death_date: stringOrNull(deathDate),
      death_place: stringOrNull(deathPlace),
      nationality: stringOrNull(nationality),
      occupations,
      literary_movements: literaryMovements,
    };
    await updateAuthor(data);
  };

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={t.admin.authors.editor.identity.alternativeNames}>
        <DetailGrid>
          <FormField label={t.admin.authors.editor.identity.nativeName} value={nativeName} onChange={setNativeName} />
          <FormField label={t.admin.authors.editor.identity.birthName} value={birthName} onChange={setBirthName} />
          <FormField label={t.admin.authors.editor.identity.sortName} value={sortName} onChange={setSortName} />
        </DetailGrid>
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SuggestionInput
            label={t.admin.authors.editor.identity.penNames}
            values={penNames}
            suggestions={[]}
            onChange={setPenNames}
          />
          <SuggestionInput
            label={t.admin.authors.editor.identity.pseudonyms}
            values={pseudonyms}
            suggestions={[]}
            onChange={setPseudonyms}
          />
        </div>
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.identity.lifeEvents}>
        <DetailGrid>
          <div>
            <FormField label={t.admin.authors.editor.identity.birthDate} value={birthDate} onChange={setBirthDate} type="text" placeholder="YYYY-MM-DD" />
            <div style={{ marginTop: '8px' }}>
              <FormField label={t.admin.authors.editor.identity.birthPlace} value={birthPlace} onChange={setBirthPlace} />
            </div>
          </div>
          <div>
            <FormField label={t.admin.authors.editor.identity.deathDate} value={deathDate} onChange={setDeathDate} type="text" placeholder="YYYY-MM-DD" />
            <div style={{ marginTop: '8px' }}>
              <FormField label={t.admin.authors.editor.identity.deathPlace} value={deathPlace} onChange={setDeathPlace} />
            </div>
          </div>
        </DetailGrid>
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.identity.nationalityStates}>
        <DetailGrid>
          <FormField label={t.admin.authors.editor.identity.nationality} value={nationality} onChange={setNationality} />
        </DetailGrid>
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.identity.occupations}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SuggestionInput
            label={t.admin.authors.editor.identity.occupations}
            values={occupations}
            suggestions={[]}
            onChange={setOccupations}
          />
          <SuggestionInput
            label={t.admin.authors.editor.identity.literaryMovements}
            values={literaryMovements}
            suggestions={[]}
            onChange={setLiteraryMovements}
          />
        </div>
      </EditorSectionCard>

      {saveError && (
        <div style={{
          padding: '12px 16px', background: 'rgba(220,38,38,0.1)',
          border: '1px solid rgba(220,38,38,0.3)', borderRadius: '8px',
          color: 'var(--error)', fontSize: '13px',
        }}>
          {saveError}
        </div>
      )}

      <ActionBar
        onSave={handleSave}
        onCancel={reset}
        saving={saving}
        dirty={hasChanges}
        saveLabel={t.admin.common.save}
        savingLabel={t.admin.common.saving}
        cancelLabel={t.admin.common.cancel}
      />
    </div>
  );
}
