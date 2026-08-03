import { useState, useEffect, useCallback } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';
import ActionBar from '../../../../../components/Studio/shared/ActionBar';
import PlaceSelector from '../../../../../components/Studio/shared/PlaceSelector';
import TaxonomyPicker from '../../../../../components/Studio/shared/TaxonomyPicker';
import { apiClient } from '../../../../../shared/api/client';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import type { AdminAuthorUpdate, AuthorCitizenship, AuthorCitizenshipCreate } from '../../../../../types/admin';
import { normalizePseudonyms } from '../pseudonyms';

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

function ChipInput({ label, values, onChange, placeholder }: {
  label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v)) return;
    onChange(normalizePseudonyms(values, [v]));
    setDraft('');
  };
  const remove = (idx: number) => onChange(values.filter((_, i) => i !== idx));
  return (
    <div>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {label}
      </div>
      {values.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {values.map((v, i) => (
            <span key={`${v}-${i}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 8px', borderRadius: '14px', fontSize: '13px',
              background: 'var(--primary-soft)', border: '1px solid var(--primary)',
              color: 'var(--primary)',
            }}>
              {v}
              <button type="button" onClick={() => remove(i)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '14px', padding: 0, lineHeight: 1 }}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input type="text" value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        placeholder={placeholder}
        style={inputStyle} />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {label}
      </div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }} />
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

function CitizenshipForm({ values, onChange, onCancel, onSave, saving, locale }: {
  values: { state_name: string; from_date: string; to_date: string; notes: string; source_id: string };
  onChange: (f: string, v: string) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  locale: any;
}) {
  const hasError = !values.state_name.trim();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {locale.citizenshipState} <span style={{ color: 'var(--error)' }}>*</span>
          </div>
          <input type="text" value={values.state_name}
            onChange={(e) => onChange('state_name', e.target.value)}
            placeholder={locale.citizenshipState}
            style={{ ...inputStyle, borderColor: hasError && values.state_name ? undefined : hasError ? 'var(--error)' : undefined }} />
        </div>
        <div></div>
        <FormField label={locale.citizenshipFrom} value={values.from_date} onChange={(v) => onChange('from_date', v)} placeholder="1924" />
        <FormField label={locale.citizenshipTo} value={values.to_date} onChange={(v) => onChange('to_date', v)} placeholder="1991" />
      </div>
      <TextAreaField label={locale.citizenshipNotes} value={values.notes} onChange={(v) => onChange('notes', v)} />
      <FormField label={locale.citizenshipSource} value={values.source_id} onChange={(v) => onChange('source_id', v)} />
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel}
          style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-soft)', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '12px' }}>
          {locale.cancelCitizenship}
        </button>
        <button type="button" onClick={onSave}
          disabled={hasError || saving}
          style={{ padding: '6px 12px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px', opacity: hasError || saving ? 0.6 : 1 }}>
          {locale.saveCitizenship}
        </button>
      </div>
      {hasError && (
        <div style={{ fontSize: '11px', color: 'var(--error)' }}>{locale.citizenshipRequired}</div>
      )}
    </div>
  );
}

export default function Identity() {
  const t = getLocaleData(getBrowserLocale());
  const { author, loading, saving, saveError, updateAuthor } = useAuthorEditor();
  const idLocale = t.admin.authors.editor.identity;

  const [nationality, setNationality] = useState('');
  const [ethnicOrigin, setEthnicOrigin] = useState('');
  const [culturalIdentity, setCulturalIdentity] = useState('');
  const [languages, setLanguages] = useState('');
  const [writingLanguages, setWritingLanguages] = useState('');

  const [birthName, setBirthName] = useState('');
  const [sortName, setSortName] = useState('');
  const [pseudonyms, setPseudonyms] = useState<string[]>([]);

  const [birthPlaceId, setBirthPlaceId] = useState<string | null>(null);
  const [birthPlaceName, setBirthPlaceName] = useState<string | null>(null);
  const [deathPlaceId, setDeathPlaceId] = useState<string | null>(null);
  const [deathPlaceName, setDeathPlaceName] = useState<string | null>(null);

  const [occupations, setOccupations] = useState<string[]>([]);

  const [citizenships, setCitizenships] = useState<AuthorCitizenship[]>([]);
  const [editCitId, setEditCitId] = useState<string | null>(null);
  const [editCit, setEditCit] = useState({ state_name: '', from_date: '', to_date: '', notes: '', source_id: '' });

  useEffect(() => {
    if (!author) return;
    setNationality(author.nationality || '');
    setEthnicOrigin(author.ethnic_origin || '');
    setCulturalIdentity(author.cultural_identity || '');
    setLanguages((author.languages || []).join(', '));
    setWritingLanguages((author.writing_languages || []).join(', '));
    setBirthName(author.birth_name || '');
    setSortName(author.sort_name || '');
    setPseudonyms(normalizePseudonyms(author.pen_names, author.pseudonyms));
    setBirthPlaceId(author.birth_place_id || null);
    setBirthPlaceName(author.birth_place || null);
    setDeathPlaceId(author.death_place_id || null);
    setDeathPlaceName(author.death_place || null);
    setOccupations(author.occupations || []);
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

  const openNewCitizen = () => {
    setEditCitId('__new__');
    setEditCit({ state_name: '', from_date: '', to_date: '', notes: '', source_id: '' });
  };

  const openEditCitizen = (c: AuthorCitizenship) => {
    setEditCitId(c.id);
    setEditCit({
      state_name: c.state_name,
      from_date: c.from_date || '',
      to_date: c.to_date || '',
      notes: c.notes || '',
      source_id: c.source_id || '',
    });
  };

  const cancelCitizen = () => {
    setEditCitId(null);
    setEditCit({ state_name: '', from_date: '', to_date: '', notes: '', source_id: '' });
  };

  const saveCitizen = async () => {
    if (!author || !editCit.state_name.trim()) return;
    const payload: AuthorCitizenshipCreate = {
      state_name: editCit.state_name.trim(),
      from_date: editCit.from_date.trim() || null,
      to_date: editCit.to_date.trim() || null,
      notes: editCit.notes.trim() || null,
      source_id: editCit.source_id.trim() || null,
    };
    try {
      if (editCitId === '__new__') {
        await apiClient.post(`/admin/authors/${author.id}/citizenships`, payload);
      } else {
        await apiClient.put(`/admin/authors/${author.id}/citizenships/${editCitId}`, payload);
      }
      cancelCitizen();
      await fetchCitizenships();
    } catch {}
  };

  const deleteCitizenship = async (id: string) => {
    if (!author) return;
    if (!window.confirm(idLocale.confirmDeleteCitizenship)) return;
    try {
      await apiClient.delete(`/admin/authors/${author.id}/citizenships/${id}`);
      if (editCitId === id) cancelCitizen();
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
    pseudonyms.join(',') !== normalizePseudonyms(author?.pen_names, author?.pseudonyms).join(',') ||
    birthPlaceId !== (author?.birth_place_id || null) ||
    deathPlaceId !== (author?.death_place_id || null) ||
    occupations.join(',') !== (author?.occupations || []).join(',');

  const reset = () => {
    if (!author) return;
    setNationality(author.nationality || '');
    setEthnicOrigin(author.ethnic_origin || '');
    setCulturalIdentity(author.cultural_identity || '');
    setLanguages((author.languages || []).join(', '));
    setWritingLanguages((author.writing_languages || []).join(', '));
    setBirthName(author.birth_name || '');
    setSortName(author.sort_name || '');
    setPseudonyms(normalizePseudonyms(author.pen_names, author.pseudonyms));
    setBirthPlaceId(author.birth_place_id || null);
    setBirthPlaceName(author.birth_place || null);
    setDeathPlaceId(author.death_place_id || null);
    setDeathPlaceName(author.death_place || null);
    setOccupations(author.occupations || []);
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
      pen_names: pseudonyms,
      pseudonyms: pseudonyms,
      birth_place_id: birthPlaceId,
      death_place_id: deathPlaceId,
      occupations,
    };
    await updateAuthor(data);
  };

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={idLocale.nationalityStates}>
        <DetailGrid columns={2}>
          <FormField label={idLocale.nationality} value={nationality} onChange={setNationality} />
          <FormField label={idLocale.ethnicOrigin} value={ethnicOrigin} onChange={setEthnicOrigin} />
        </DetailGrid>
        <div style={{ marginTop: '12px' }}>
          <FormField label={idLocale.culturalIdentity} value={culturalIdentity} onChange={setCulturalIdentity} />
        </div>
      </EditorSectionCard>

      <EditorSectionCard title={idLocale.citizenshipHistory}>
        {citizenships.map((c) => (
          <div key={c.id}>
            {editCitId === c.id ? (
              <CitizenshipForm
                values={editCit}
                onChange={(f, v) => setEditCit((p) => ({ ...p, [f]: v }))}
                onCancel={cancelCitizen}
                onSave={saveCitizen}
                saving={saving}
                locale={idLocale}
              />
            ) : (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                padding: '8px 12px', marginBottom: '4px',
                background: 'var(--surface-hover)', borderRadius: '6px', fontSize: '13px',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--text-primary)' }}>
                    {c.state_name}
                    <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                      {c.from_date || '?'} — {c.to_date || t.admin.studioCleanup.present}
                    </span>
                  </div>
                  {c.notes && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>
                      {c.notes}
                    </div>
                  )}
                </div>
                <span style={FIELD_STYLES.status(c.status)}>{c.status === 'verified' ? t.admin.studioCleanup.verified : t.admin.studioCleanup.unverified}</span>
                <button type="button" onClick={() => openEditCitizen(c)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', padding: '0 4px' }}>
                  ✎
                </button>
                <button type="button" onClick={() => deleteCitizenship(c.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '16px' }}>
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
        {editCitId === '__new__' && (
          <CitizenshipForm
            values={editCit}
            onChange={(f, v) => setEditCit((p) => ({ ...p, [f]: v }))}
            onCancel={cancelCitizen}
            onSave={saveCitizen}
            saving={saving}
            locale={idLocale}
          />
        )}
        {editCitId !== '__new__' && editCitId === null && (
          <button type="button" onClick={openNewCitizen}
            style={{ marginTop: '8px', padding: '8px', width: '100%', background: 'var(--surface-hover)', borderRadius: '6px', border: '1px dashed var(--border-soft)', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
            + {idLocale.addCitizenship}
          </button>
        )}
      </EditorSectionCard>

      <EditorSectionCard title={idLocale.languagesBirthDeath}>
        <DetailGrid columns={2}>
          <FormField label={idLocale.spokenLanguages} value={languages} onChange={setLanguages} />
          <FormField label={idLocale.writingLanguages} value={writingLanguages} onChange={setWritingLanguages} />
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

      <EditorSectionCard title={idLocale.alternativeNames}>
        <DetailGrid columns={2}>
          <FormField label={idLocale.birthName} value={birthName} onChange={setBirthName} />
          <FormField label={idLocale.sortName} value={sortName} onChange={setSortName} />
        </DetailGrid>
        <div style={{ marginTop: '12px' }}>
          <ChipInput label={idLocale.pseudonyms} values={pseudonyms} onChange={setPseudonyms} />
        </div>
      </EditorSectionCard>

      <EditorSectionCard title={idLocale.occupations}>
        <TaxonomyPicker
          nodeType="occupation"
          value={occupations}
          onChange={setOccupations}
          placeholder={t.admin.studioCleanup.searchOrCreateTaxonomy}
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
