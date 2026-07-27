import { useState, useEffect } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';
import ActionBar from '../../../../../components/Studio/shared/ActionBar';
import HistoricalDateField from '../../../../../components/Studio/shared/HistoricalDateField';
import PlaceSelector from '../../../../../components/Studio/shared/PlaceSelector';
import TaxonomyPicker from '../../../../../components/Studio/shared/TaxonomyPicker';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import type { AdminAuthorUpdate, DatePrecision } from '../../../../../types/admin';

function FormField({ label, value, onChange, placeholder, disabled }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
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
        type="text"
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

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export default function Identity() {
  const t = getLocaleData(getBrowserLocale());
  const { author, loading, saving, saveError, updateAuthor } = useAuthorEditor();

  const [birthName, setBirthName] = useState('');
  const [sortName, setSortName] = useState('');
  const [penNames, setPenNames] = useState<string[]>([]);

  const [birthDate, setBirthDate] = useState('');
  const [birthDatePrecision, setBirthDatePrecision] = useState<DatePrecision>('full');
  const [birthPlaceId, setBirthPlaceId] = useState<string | null>(null);
  const [birthPlaceName, setBirthPlaceName] = useState<string | null>(null);
  const [deathDate, setDeathDate] = useState('');
  const [deathDatePrecision, setDeathDatePrecision] = useState<DatePrecision>('full');
  const [deathPlaceId, setDeathPlaceId] = useState<string | null>(null);
  const [deathPlaceName, setDeathPlaceName] = useState<string | null>(null);

  const [nationality, setNationality] = useState('');
  const [occupations, setOccupations] = useState<string[]>([]);
  const [literaryMovements, setLiteraryMovements] = useState<string[]>([]);

  useEffect(() => {
    if (!author) return;
    setBirthName(author.birth_name || '');
    setSortName(author.sort_name || '');
    setPenNames(author.pen_names || []);
    setBirthDate(author.birth_date || '');
    setBirthDatePrecision((author.birth_date_precision as DatePrecision) || 'full');
    setBirthPlaceId(author.birth_place_id || null);
    setBirthPlaceName(author.birth_place || null);
    setDeathDate(author.death_date || '');
    setDeathDatePrecision((author.death_date_precision as DatePrecision) || 'full');
    setDeathPlaceId(author.death_place_id || null);
    setDeathPlaceName(author.death_place || null);
    setNationality(author.nationality || '');
    setOccupations(author.occupations || []);
    setLiteraryMovements(author.literary_movements || []);
  }, [author]);

  const hasChanges =
    birthName !== (author?.birth_name || '') ||
    sortName !== (author?.sort_name || '') ||
    !arraysEqual(penNames, author?.pen_names || []) ||
    birthDate !== (author?.birth_date || '') ||
    birthDatePrecision !== ((author?.birth_date_precision as DatePrecision) || 'full') ||
    birthPlaceId !== (author?.birth_place_id || null) ||
    deathDate !== (author?.death_date || '') ||
    deathDatePrecision !== ((author?.death_date_precision as DatePrecision) || 'full') ||
    deathPlaceId !== (author?.death_place_id || null) ||
    nationality !== (author?.nationality || '') ||
    !arraysEqual(occupations, author?.occupations || []) ||
    !arraysEqual(literaryMovements, author?.literary_movements || []);

  const reset = () => {
    if (!author) return;
    setBirthName(author.birth_name || '');
    setSortName(author.sort_name || '');
    setPenNames(author.pen_names || []);
    setBirthDate(author.birth_date || '');
    setBirthDatePrecision((author.birth_date_precision as DatePrecision) || 'full');
    setBirthPlaceId(author.birth_place_id || null);
    setBirthPlaceName(author.birth_place || null);
    setDeathDate(author.death_date || '');
    setDeathDatePrecision((author.death_date_precision as DatePrecision) || 'full');
    setDeathPlaceId(author.death_place_id || null);
    setDeathPlaceName(author.death_place || null);
    setNationality(author.nationality || '');
    setOccupations(author.occupations || []);
    setLiteraryMovements(author.literary_movements || []);
  };

  const handleSave = async () => {
    const data: AdminAuthorUpdate = {
      birth_name: stringOrNull(birthName),
      sort_name: stringOrNull(sortName),
      pen_names: penNames,
      birth_date: stringOrNull(birthDate),
      birth_date_precision: birthDatePrecision,
      birth_place_id: birthPlaceId,
      birth_place: birthPlaceName,
      death_date: stringOrNull(deathDate),
      death_date_precision: deathDatePrecision,
      death_place_id: deathPlaceId,
      death_place: deathPlaceName,
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
          <FormField label={t.admin.authors.editor.identity.birthName} value={birthName} onChange={setBirthName} />
          <FormField label={t.admin.authors.editor.identity.sortName} value={sortName} onChange={setSortName} />
        </DetailGrid>
        <div style={{ marginTop: '16px' }}>
          <TaxonomyPicker
            label={t.admin.authors.editor.identity.penNames}
            nodeType="pen_name"
            values={penNames}
            onChange={setPenNames}
          />
        </div>
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.identity.lifeEvents}>
        <DetailGrid>
          <div>
            <HistoricalDateField
              label={t.admin.authors.editor.identity.birthDate}
              value={birthDate}
              precision={birthDatePrecision}
              onChange={(v, p) => { setBirthDate(v); setBirthDatePrecision(p); }}
            />
            <div style={{ marginTop: '8px' }}>
              <PlaceSelector
                label={t.admin.authors.editor.identity.birthPlace}
                placeId={birthPlaceId}
                placeName={birthPlaceName}
                onChange={(id, name) => { setBirthPlaceId(id); setBirthPlaceName(name); }}
              />
            </div>
          </div>
          <div>
            <HistoricalDateField
              label={t.admin.authors.editor.identity.deathDate}
              value={deathDate}
              precision={deathDatePrecision}
              onChange={(v, p) => { setDeathDate(v); setDeathDatePrecision(p); }}
            />
            <div style={{ marginTop: '8px' }}>
              <PlaceSelector
                label={t.admin.authors.editor.identity.deathPlace}
                placeId={deathPlaceId}
                placeName={deathPlaceName}
                onChange={(id, name) => { setDeathPlaceId(id); setDeathPlaceName(name); }}
              />
            </div>
          </div>
        </DetailGrid>
      </EditorSectionCard>

      <EditorSectionCard
        title={t.admin.authors.editor.identity.nationality}
        description={t.admin.authors.editor.identity.nationalityDesc}
      >
        <FormField label={t.admin.authors.editor.identity.nationality} value={nationality} onChange={setNationality} />
      </EditorSectionCard>

      <EditorSectionCard
        title={t.admin.authors.editor.identity.occupations}
        description={t.admin.authors.editor.identity.occupationsDesc}
      >
        <TaxonomyPicker
          label={t.admin.authors.editor.identity.occupations}
          nodeType="occupation"
          values={occupations}
          onChange={setOccupations}
        />
      </EditorSectionCard>

      <EditorSectionCard
        title={t.admin.authors.editor.identity.literaryMovements}
        description={t.admin.authors.editor.identity.literaryMovementsDesc}
      >
        <TaxonomyPicker
          label={t.admin.authors.editor.identity.literaryMovements}
          nodeType="literary_direction"
          values={literaryMovements}
          onChange={setLiteraryMovements}
        />
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
