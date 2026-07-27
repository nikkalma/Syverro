import { useState, useEffect, useCallback } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';
import ActionBar from '../../../../../components/Studio/shared/ActionBar';
import PlaceSelector from '../../../../../components/Studio/shared/PlaceSelector';
import TaxonomyPicker from '../../../../../components/Studio/shared/TaxonomyPicker';
import { apiClient } from '../../../../../shared/api/client';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import type { AdminAuthorUpdate, AuthorCitizenship } from '../../../../../types/admin';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '14px',
  background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
};

function FormField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {label}
      </div>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

const FIELD_STYLES = {
  status: (status: string): React.CSSProperties => ({
    padding: '1px 6px', borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase',
    background: status === 'verified' ? 'rgba(76,175,80,0.15)' : 'rgba(255,167,38,0.15)',
    color: status === 'verified' ? '#4CAF50' : '#FFA726',
  }),
};

export default function Identity() {
  const t = getLocaleData(getBrowserLocale());
  const { author, loading, saving, saveError, updateAuthor } = useAuthorEditor();
  const idLocale = t.admin.authors.editor.identity;

  // Core fields
  const [nationality, setNationality] = useState('');
  const [ethnicOrigin, setEthnicOrigin] = useState('');
  const [culturalIdentity, setCulturalIdentity] = useState('');
  const [languages, setLanguages] = useState('');
  const [writingLanguages, setWritingLanguages] = useState('');

  // Pen names & sort name
  const [birthName, setBirthName] = useState('');
  const [sortName, setSortName] = useState('');
  const [penNamesText, setPenNamesText] = useState('');

  // Birth/death places
  const [birthPlaceId, setBirthPlaceId] = useState<string | null>(null);
  const [birthPlaceName, setBirthPlaceName] = useState<string | null>(null);
  const [deathPlaceId, setDeathPlaceId] = useState<string | null>(null);
  const [deathPlaceName, setDeathPlaceName] = useState<string | null>(null);

  // Occupations & literary movements (via TaxonomyPicker)
  const [occupations, setOccupations] = useState<string[]>([]);
  const [literaryMovements, setLiteraryMovements] = useState<string[]>([]);

  // Extended: citizenships
  const [citizenships, setCitizenships] = useState<AuthorCitizenship[]>([]);
  const [showCitForm, setShowCitForm] = useState(false);
  const [citState, setCitState] = useState('');
  const [citFrom, setCitFrom] = useState('');
  const [citTo, setCitTo] = useState('');

  useEffect(() => {
    if (!author) return;
    setNationality(author.nationality || '');
    setEthnicOrigin(author.ethnic_origin || '');
    setCulturalIdentity(author.cultural_identity || '');
    setLanguages((author.languages || []).join(', '));
    setWritingLanguages((author.writing_languages || []).join(', '));
    setBirthName(author.birth_name || '');
    setSortName(author.sort_name || '');
    setPenNamesText((author.pen_names || []).join(', '));
    setBirthPlaceId(author.birth_place_id || null);
    setBirthPlaceName(author.birth_place || null);
    setDeathPlaceId(author.death_place_id || null);
    setDeathPlaceName(author.death_place || null);
    setOccupations(author.occupations || []);
    setLiteraryMovements(author.literary_movements || []);
  }, [author]);

  const fetchCitizenships = useCallback(async () => {
    if (!author) return;
    try {
      const res = await apiClient.get(`/admin/authors/${author.id}/citizenships`);
      setCitizenships(res.data?.data || []);
    } catch { setCitizenships([]); }
  }, [author]);

  useEffect(() => {
    if (author) fetchCitizenships();
  }, [author, fetchCitizenships]);

  const addCitizenship = async () => {
    if (!author || !citState.trim()) return;
    try {
      await apiClient.post(`/admin/authors/${author.id}/citizenships`, {
        state_name: citState.trim(),
        from_date: citFrom.trim() || null,
        to_date: citTo.trim() || null,
      });
      setCitState(''); setCitFrom(''); setCitTo('');
      setShowCitForm(false);
      await fetchCitizenships();
    } catch {}
  };

  const deleteCitizenship = async (id: string) => {
    if (!author) return;
    if (!window.confirm('Delete this citizenship record?')) return;
    try {
      await apiClient.delete(`/admin/authors/${author.id}/citizenships/${id}`);
      await fetchCitizenships();
    } catch {}
  };

  const hasChanges =
    nationality !== (author?.nationality || '') ||
    ethnicOrigin !== (author?.ethnic_origin || '') ||
    culturalIdentity !== (author?.cultural_identity || '') ||
    languages !== (author?.languages || []).join(', ') ||
    writingLanguages !== (author?.writing_languages || []).join(', ') ||
    birthName !== (author?.birth_name || '') ||
    sortName !== (author?.sort_name || '') ||
    penNamesText !== (author?.pen_names || []).join(', ') ||
    birthPlaceId !== (author?.birth_place_id || null) ||
    deathPlaceId !== (author?.death_place_id || null);

  const reset = () => {
    if (!author) return;
    setNationality(author.nationality || '');
    setEthnicOrigin(author.ethnic_origin || '');
    setCulturalIdentity(author.cultural_identity || '');
    setLanguages((author.languages || []).join(', '));
    setWritingLanguages((author.writing_languages || []).join(', '));
    setBirthName(author.birth_name || '');
    setSortName(author.sort_name || '');
    setPenNamesText((author.pen_names || []).join(', '));
    setBirthPlaceId(author.birth_place_id || null);
    setBirthPlaceName(author.birth_place || null);
    setDeathPlaceId(author.death_place_id || null);
    setDeathPlaceName(author.death_place || null);
    setOccupations(author.occupations || []);
    setLiteraryMovements(author.literary_movements || []);
  };

  const handleSave = async () => {
    const data: AdminAuthorUpdate = {
      nationality: nationality || null,
      ethnic_origin: ethnicOrigin || null,
      cultural_identity: culturalIdentity || null,
      languages: languages ? languages.split(',').map((s) => s.trim()).filter(Boolean) : [],
      writing_languages: writingLanguages ? writingLanguages.split(',').map((s) => s.trim()).filter(Boolean) : [],
      birth_name: birthName || null,
      sort_name: sortName || null,
      pen_names: penNamesText ? penNamesText.split(',').map((s) => s.trim()).filter(Boolean) : [],
      birth_place_id: birthPlaceId,
      death_place_id: deathPlaceId,
      occupations,
      literary_movements: literaryMovements,
    };
    await updateAuthor(data);
  };

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={idLocale.nationalityStates}>
        <DetailGrid columns={2}>
          <FormField label={idLocale.nationality} value={nationality} onChange={setNationality} placeholder="e.g. Russian" />
          <FormField label="Ethnic Origin" value={ethnicOrigin} onChange={setEthnicOrigin} placeholder="e.g. Jewish" />
        </DetailGrid>
        <div style={{ marginTop: '12px' }}>
          <FormField label="Cultural Identity" value={culturalIdentity} onChange={setCulturalIdentity} placeholder="e.g. Russian literature" />
        </div>
      </EditorSectionCard>

      <EditorSectionCard title="Citizenship History">
        {citizenships.map((c) => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', marginBottom: '4px',
            background: 'var(--surface-hover)', borderRadius: '6px', fontSize: '13px',
          }}>
            <span style={{ flex: 1, color: 'var(--text-primary)' }}>
              {c.state_name}
              <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                {c.from_date || '?'} — {c.to_date || 'present'}
              </span>
            </span>
            <span style={FIELD_STYLES.status(c.status)}>{c.status}</span>
            <button type="button" onClick={() => deleteCitizenship(c.id)}
              style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '16px' }}>
              ×
            </button>
          </div>
        ))}
        {showCitForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <input type="text" value={citState} onChange={(e) => setCitState(e.target.value)}
              placeholder="State name (e.g. USSR)" style={inputStyle} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={citFrom} onChange={(e) => setCitFrom(e.target.value)}
                placeholder="From" style={{ ...inputStyle, flex: 1 }} />
              <input type="text" value={citTo} onChange={(e) => setCitTo(e.target.value)}
                placeholder="To" style={{ ...inputStyle, flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowCitForm(false)}
                style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-soft)', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '12px' }}>
                Cancel
              </button>
              <button type="button" onClick={addCitizenship}
                disabled={!citState.trim()}
                style={{ padding: '6px 12px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>
                Add
              </button>
            </div>
          </div>
        )}
        {!showCitForm && (
          <button type="button" onClick={() => setShowCitForm(true)}
            style={{ marginTop: '8px', padding: '8px', width: '100%', background: 'var(--surface-hover)', borderRadius: '6px', border: '1px dashed var(--border-soft)', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
            + Add Citizenship
          </button>
        )}
      </EditorSectionCard>

      <EditorSectionCard title="Languages & Birth/Death">
        <DetailGrid columns={2}>
          <FormField label={idLocale.spokenLanguages} value={languages} onChange={setLanguages} placeholder="English, Russian..." />
          <FormField label={idLocale.writingLanguages} value={writingLanguages} onChange={setWritingLanguages} placeholder="Russian, French..." />
        </DetailGrid>
        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {idLocale.birthPlace}
            </div>
            <PlaceSelector label="" placeId={birthPlaceId} placeName={birthPlaceName} onChange={(id, name) => { setBirthPlaceId(id); setBirthPlaceName(name); }} />
          </div>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {idLocale.deathPlace}
            </div>
            <PlaceSelector label="" placeId={deathPlaceId} placeName={deathPlaceName} onChange={(id, name) => { setDeathPlaceId(id); setDeathPlaceName(name); }} />
          </div>
        </div>
      </EditorSectionCard>

      <EditorSectionCard title="Alternative Names">
        <DetailGrid columns={2}>
          <FormField label={idLocale.birthName} value={birthName} onChange={setBirthName} />
          <FormField label={idLocale.sortName} value={sortName} onChange={setSortName} />
        </DetailGrid>
        <div style={{ marginTop: '12px' }}>
          <FormField label={idLocale.penNames} value={penNamesText} onChange={setPenNamesText} placeholder="Pen name 1, Pen name 2..." />
        </div>
      </EditorSectionCard>

      <EditorSectionCard title={idLocale.occupations}>
        <TaxonomyPicker
          nodeType="occupation"
          value={occupations}
          onChange={setOccupations}
          placeholder="Search or create occupations..."
        />
      </EditorSectionCard>

      <EditorSectionCard title={idLocale.literaryMovements}>
        <TaxonomyPicker
          nodeType="literary_direction"
          value={literaryMovements}
          onChange={setLiteraryMovements}
          placeholder="Search or create literary movements..."
        />
      </EditorSectionCard>

      {saveError && (
        <div style={{ padding: '12px 16px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '8px', color: 'var(--error)', fontSize: '13px' }}>
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
