import { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminAuthor, AuthorAward, GENDER_OPTIONS, DISPLAY_NAME_MODE_LABELS, computeDisplayName } from '../../../types/admin';
import type { DisplayNameMode } from '../../../types/admin';
import ChipInput from '../../../components/ChipInput';
import { computeSearchAliases } from '../../../shared/utils/normalizeSearch';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.syverro.com';

interface AuthorModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  author: AdminAuthor | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px', color: '#E6EDF3', fontSize: '14px',
  fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: '80px',
};

const labelStyle: React.CSSProperties = {
  color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '28px',
};

const sectionTitleStyle: React.CSSProperties = {
  color: '#5B86A1', fontSize: '14px', fontWeight: '500',
  margin: '0 0 12px 0', letterSpacing: '0.5px',
  paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const tagColors: Record<string, string> = {
  pen_names: '#A855F7', languages: '#5B86A1', occupations: '#FFA726',
  literary_movements: '#4CAF50', notable_works: '#EF5350',
  genres: '#5B86A1', writing_languages: '#A855F7',
};

function loadDict(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem('syverro_chip_dict') || '{}');
  } catch { return {}; }
}

function saveDict(dict: Record<string, string[]>) {
  localStorage.setItem('syverro_chip_dict', JSON.stringify(dict));
}

function addToDict(key: string, value: string) {
  const dict = loadDict();
  const list = dict[key] || [];
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) return;
  if (list.some((item) => item.toLowerCase() === normalized.toLowerCase())) return;
  dict[key] = [...list, normalized];
  saveDict(dict);
}

const DISPLAY_NAME_OPTIONS: { value: DisplayNameMode; label: string }[] = [
  { value: 'real_name', label: DISPLAY_NAME_MODE_LABELS.real_name },
  { value: 'birth_name', label: DISPLAY_NAME_MODE_LABELS.birth_name },
  { value: 'pen_name', label: DISPLAY_NAME_MODE_LABELS.pen_name },
  { value: 'custom', label: DISPLAY_NAME_MODE_LABELS.custom },
];

export default function AuthorModal({ isOpen, mode, author, onClose, onSave }: AuthorModalProps) {
  // --- Identity ---
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [birthName, setBirthName] = useState('');
  const [nativeName, setNativeName] = useState('');

  // --- Display Name ---
  const [displayNameMode, setDisplayNameMode] = useState<DisplayNameMode>('real_name');
  const [customDisplayName, setCustomDisplayName] = useState('');

  // --- Pen Names ---
  const [penNames, setPenNames] = useState<string[]>([]);

  // --- Basic Information ---
  const [sortName, setSortName] = useState('');
  const [nationality, setNationality] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [gender, setGender] = useState('unknown');
  const [officialWebsite, setOfficialWebsite] = useState('');
  const [wikipediaUrl, setWikipediaUrl] = useState('');

  // --- Biography ---
  const [bio, setBio] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [deathPlace, setDeathPlace] = useState('');

  // --- Career ---
  const [occupations, setOccupations] = useState<string[]>([]);
  const [literaryMovements, setLiteraryMovements] = useState<string[]>([]);

  // --- Awards ---
  const [awards, setAwards] = useState<AuthorAward[]>([]);
  const [showAwardForm, setShowAwardForm] = useState(false);
  const [editingAwardId, setEditingAwardId] = useState<string | null>(null);
  const [awardName, setAwardName] = useState('');
  const [awardYear, setAwardYear] = useState('');
  const [awardOrganization, setAwardOrganization] = useState('');
  const [awardWork, setAwardWork] = useState('');

  // --- Media ---
  const [photo, setPhoto] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [galleryInput, setGalleryInput] = useState('');
  const [signatureImage, setSignatureImage] = useState('');
  const [portraitCaption, setPortraitCaption] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [chipDict] = useState(() => loadDict());

  const recordChip = useCallback((key: string, value: string) => {
    addToDict(key, value);
  }, []);

  const computedDisplayName = useMemo(() => {
    if (displayNameMode === 'custom') return customDisplayName.trim();
    return computeDisplayName(displayNameMode, firstName, lastName, middleName, birthName, penNames);
  }, [displayNameMode, firstName, lastName, middleName, birthName, penNames, customDisplayName]);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && author) {
      setFirstName(author.first_name || '');
      setLastName(author.last_name || '');
      setMiddleName(author.middle_name || '');
      setBirthName(author.birth_name || '');
      setNativeName(author.native_name || '');
      setDisplayNameMode(author.display_name_mode || 'real_name');
      setCustomDisplayName(
        author.display_name_mode === 'custom' ? (author.display_name || '') : '',
      );
      setPenNames(author.pen_names || author.pseudonyms || []);
      setSortName(author.sort_name || '');
      setNationality(author.nationality || '');
      setLanguages(author.languages || []);
      setGender(author.gender || 'unknown');
      setOfficialWebsite(author.official_website || '');
      setWikipediaUrl(author.wikipedia_url || '');
      setBio(author.bio || '');
      setBirthDate(author.birth_date || '');
      setDeathDate(author.death_date || '');
      setBirthPlace(author.birth_place || '');
      setDeathPlace(author.death_place || '');
      setOccupations(author.occupations || []);
      setLiteraryMovements(author.literary_movements || []);
      setAwards(author.awards || []);
      setPhoto(author.photo || '');
      setGallery(author.gallery || []);
      setSignatureImage(author.signature_image || '');
      setPortraitCaption(author.portrait_caption || '');
    } else {
      setFirstName('');
      setLastName('');
      setMiddleName('');
      setBirthName('');
      setNativeName('');
      setDisplayNameMode('real_name');
      setCustomDisplayName('');
      setPenNames([]);
      setSortName('');
      setNationality('');
      setLanguages([]);
      setGender('unknown');
      setOfficialWebsite('');
      setWikipediaUrl('');
      setBio('');
      setBirthDate('');
      setDeathDate('');
      setBirthPlace('');
      setDeathPlace('');
      setOccupations([]);
      setLiteraryMovements([]);
      setAwards([]);
      setPhoto('');
      setGallery([]);
      setSignatureImage('');
      setPortraitCaption('');
    }
    setError(null);
    setShowAwardForm(false);
    setEditingAwardId(null);
  }, [mode, author, isOpen]);

  if (!isOpen) return null;

  // ===== Award helpers =====
  const handleAddAward = async () => {
    if (!awardName.trim()) return;
    if (!author || mode === 'create') {
      setAwards((prev) => [...prev, {
        id: `temp-${Date.now()}`,
        author_id: author?.id || '',
        name: awardName.trim(),
        year: awardYear ? parseInt(awardYear) : null,
        organization: awardOrganization.trim() || null,
        work: awardWork.trim() || null,
        created_at: new Date().toISOString(),
      }]);
      resetAwardForm();
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/authors/${author.id}/awards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: awardName.trim(),
          year: awardYear ? parseInt(awardYear) : null,
          organization: awardOrganization.trim() || null,
          work: awardWork.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save award');
      const saved = await res.json();
      setAwards((prev) => [...prev, saved]);
      resetAwardForm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateAward = async () => {
    if (!awardName.trim() || !editingAwardId || !author) return;
    if (editingAwardId.startsWith('temp-')) {
      setAwards((prev) => prev.map((a) => a.id === editingAwardId ? { ...a, name: awardName.trim(), year: awardYear ? parseInt(awardYear) : null, organization: awardOrganization.trim() || null, work: awardWork.trim() || null } : a));
      resetAwardForm();
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/authors/${author.id}/awards/${editingAwardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: awardName.trim(),
          year: awardYear ? parseInt(awardYear) : null,
          organization: awardOrganization.trim() || null,
          work: awardWork.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to update award');
      const updated = await res.json();
      setAwards((prev) => prev.map((a) => (a.id === editingAwardId ? updated : a)));
      resetAwardForm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteAward = async (awardId: string) => {
    if (awardId.startsWith('temp-')) {
      setAwards((prev) => prev.filter((a) => a.id !== awardId));
      return;
    }
    if (!author) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/admin/authors/${author.id}/awards/${awardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setAwards((prev) => prev.filter((a) => a.id !== awardId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetAwardForm = () => {
    setShowAwardForm(false);
    setEditingAwardId(null);
    setAwardName('');
    setAwardYear('');
    setAwardOrganization('');
    setAwardWork('');
  };

  const startEditAward = (award: AuthorAward) => {
    setShowAwardForm(true);
    setEditingAwardId(award.id);
    setAwardName(award.name);
    setAwardYear(award.year?.toString() || '');
    setAwardOrganization(award.organization || '');
    setAwardWork(award.work || '');
  };

  // ===== Submit =====
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const displayName = computedDisplayName || [firstName, lastName].filter(Boolean).join(' ') || birthName || penNames[0] || '';
      if (!displayName) {
        throw new Error('Имя автора обязательно');
      }

      const searchAliases = computeSearchAliases(
        displayName,
        [firstName, middleName, lastName].filter(Boolean).join(' '),
        birthName,
        nativeName,
        ...penNames,
      );

      const submitData: Record<string, any> = {
        name: displayName,
        display_name_mode: displayNameMode,
        display_name: displayName,
        pen_names: penNames.length > 0 ? penNames : null,
        pseudonyms: penNames.length > 0 ? penNames : null,
        search_aliases: searchAliases || null,
        birth_name: birthName.trim() || null,
        first_name: firstName.trim() || null,
        middle_name: middleName.trim() || null,
        last_name: lastName.trim() || null,
        native_name: nativeName.trim() || null,
        sort_name: sortName.trim() || null,
        nationality: nationality.trim() || null,
        languages: languages.length > 0 ? languages : null,
        gender: gender || 'unknown',
        official_website: officialWebsite.trim() || null,
        wikipedia_url: wikipediaUrl.trim() || null,
        bio: bio.trim() || null,
        birth_date: birthDate.trim() || null,
        death_date: deathDate.trim() || null,
        birth_place: birthPlace.trim() || null,
        death_place: deathPlace.trim() || null,
        occupations: occupations.length > 0 ? occupations : null,
        literary_movements: literaryMovements.length > 0 ? literaryMovements : null,
        awards: awards.map((a) => ({
          name: a.name,
          year: a.year,
          organization: a.organization,
          work: a.work,
        })),
        photo: photo.trim() || null,
        gallery: gallery.length > 0 ? gallery : null,
        signature_image: signatureImage.trim() || null,
        portrait_caption: portraitCaption.trim() || null,
      };

      onSave(submitData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ===== Gallery helpers =====
  const addGalleryItem = () => {
    const val = galleryInput.trim();
    if (val && !gallery.includes(val)) {
      setGallery([...gallery, val]);
    }
    setGalleryInput('');
  };

  const removeGalleryItem = (item: string) => {
    setGallery(gallery.filter((i) => i !== item));
  };

  const grid2Style: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000, padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#121C24', borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
          maxWidth: '800px', width: '100%', maxHeight: '90vh',
          overflowY: 'auto', padding: '32px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#E6EDF3', fontSize: '22px', fontWeight: '400', margin: 0 }}>
            {mode === 'create' ? '➕ Новый автор' : '✏️ Редактировать автора'}
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#97A6BA',
            fontSize: '24px', cursor: 'pointer', padding: '4px 8px',
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ===== 1. IDENTITY ===== */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>ИДЕНТИФИКАЦИЯ</h3>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Имя (first_name)</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Лев" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Фамилия (last_name)</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                  placeholder="Толстой" style={inputStyle} />
              </div>
            </div>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Отчество (middle_name)</label>
                <input value={middleName} onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Николаевич" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Имя при рождении</label>
                <input value={birthName} onChange={(e) => setBirthName(e.target.value)}
                  placeholder="Граф Лев Николаевич Толстой" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Имя на родном языке (native_name)</label>
              <input value={nativeName} onChange={(e) => setNativeName(e.target.value)}
                placeholder="Лев Николаевич Толстой" style={inputStyle} />
            </div>
          </div>

          {/* ===== 2. DISPLAY NAME ===== */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>ОТОБРАЖАЕМОЕ ИМЯ</h3>
            <p style={{ color: '#6B7A8D', fontSize: '12px', margin: '0 0 12px 0', lineHeight: 1.5 }}>
              Определяет, какое имя показывается на платформе.
            </p>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Режим отображения</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {DISPLAY_NAME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDisplayNameMode(opt.value)}
                    style={{
                      padding: '8px 16px',
                      background: displayNameMode === opt.value ? '#5B86A1' : 'rgba(255,255,255,0.05)',
                      border: displayNameMode === opt.value
                        ? '1px solid #5B86A1'
                        : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      color: displayNameMode === opt.value ? '#0A1118' : '#97A6BA',
                      cursor: 'pointer', fontSize: '13px',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: displayNameMode === opt.value ? '500' : '400',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {displayNameMode === 'custom' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Отображаемое имя</label>
                <input value={customDisplayName} onChange={(e) => setCustomDisplayName(e.target.value)}
                  placeholder="Введите отображаемое имя" style={inputStyle} />
              </div>
            )}
            {computedDisplayName && (
              <div style={{
                padding: '10px 14px', background: 'rgba(91,134,161,0.08)',
                border: '1px solid rgba(91,134,161,0.15)', borderRadius: '8px',
              }}>
                <span style={{ color: '#5B86A1', fontSize: '12px' }}>Будет отображаться как: </span>
                <span style={{ color: '#E6EDF3', fontSize: '14px', fontWeight: '500' }}>{computedDisplayName}</span>
              </div>
            )}
          </div>

          {/* ===== 3. PEN NAMES ===== */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>ПСЕВДОНИМЫ</h3>
            <ChipInput tags={penNames} onChange={(v) => { setPenNames(v); v.forEach((t) => recordChip('pen_names', t)); }}
              placeholder="Добавить псевдоним..." color={tagColors.pen_names} suggestions={chipDict.pen_names || []} />
          </div>

          {/* ===== 4. BASIC INFORMATION ===== */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>ОСНОВНАЯ ИНФОРМАЦИЯ</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Sort name (для сортировки)</label>
              <input value={sortName} onChange={(e) => setSortName(e.target.value)}
                placeholder="Толстой, Лев Николаевич" style={inputStyle} />
            </div>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Национальность</label>
                <input value={nationality} onChange={(e) => setNationality(e.target.value)}
                  placeholder="Русская" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Языки</label>
                <ChipInput tags={languages} onChange={(v) => { setLanguages(v); v.forEach((t) => recordChip('languages', t)); }}
                  placeholder="Добавить язык..." color={tagColors.languages} suggestions={chipDict.languages || []} />
              </div>
            </div>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Гендер</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} style={selectStyle}>
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Официальный сайт</label>
                <input value={officialWebsite} onChange={(e) => setOfficialWebsite(e.target.value)}
                  placeholder="https://example.com" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Wikipedia URL</label>
              <input value={wikipediaUrl} onChange={(e) => setWikipediaUrl(e.target.value)}
                placeholder="https://en.wikipedia.org/wiki/..." style={inputStyle} />
            </div>
          </div>

          {/* ===== 5. BIOGRAPHY ===== */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>БИОГРАФИЯ</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Биография</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                placeholder="Краткая биография автора..." rows={4} style={textareaStyle} />
            </div>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Дата рождения (ДД/ММ/ГГГГ)</label>
                <input value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                  placeholder="15.01.1900" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Дата смерти (ДД/ММ/ГГГГ)</label>
                <input value={deathDate} onChange={(e) => setDeathDate(e.target.value)}
                  placeholder="05.06.2000" style={inputStyle} />
              </div>
            </div>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Место рождения</label>
                <input value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="Москва, Россия" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Место смерти</label>
                <input value={deathPlace} onChange={(e) => setDeathPlace(e.target.value)}
                  placeholder="Лос-Анджелес, США" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* ===== 6. CAREER ===== */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>КАРЬЕРА</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Профессии / Роли</label>
              <ChipInput tags={occupations} onChange={(v) => { setOccupations(v); v.forEach((t) => recordChip('occupations', t)); }}
                placeholder="Добавить профессию..." color={tagColors.occupations} suggestions={chipDict.occupations || []} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Литературные направления</label>
              <ChipInput tags={literaryMovements} onChange={(v) => { setLiteraryMovements(v); v.forEach((t) => recordChip('literary_movements', t)); }}
                placeholder="Добавить направление..." color={tagColors.literary_movements} suggestions={chipDict.literary_movements || []} />
            </div>
          </div>

          {/* ===== 7. AWARDS ===== */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>НАГРАДЫ</h3>

            {awards.length > 0 && (
              <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {awards.map((award) => (
                  <div key={award.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', background: 'rgba(255,193,7,0.06)',
                    border: '1px solid rgba(255,193,7,0.12)', borderRadius: '8px',
                  }}>
                    <div>
                      <span style={{ color: '#FFD54F', fontSize: '13px', fontWeight: '500' }}>{award.name}</span>
                      {award.year && <span style={{ color: '#97A6BA', fontSize: '12px', marginLeft: '8px' }}>({award.year})</span>}
                      {award.organization && (
                        <span style={{ color: '#97A6BA', fontSize: '12px', marginLeft: '8px' }}>— {award.organization}</span>
                      )}
                      {award.work && (
                        <span style={{ color: '#5B86A1', fontSize: '12px', display: 'block', marginTop: '2px' }}>
                          {award.work}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => startEditAward(award)} style={{
                        background: 'none', border: 'none', color: '#5B86A1',
                        cursor: 'pointer', fontSize: '12px', padding: '2px 6px',
                      }}>✎</button>
                      <button onClick={() => handleDeleteAward(award.id)} style={{
                        background: 'none', border: 'none', color: '#EF5350',
                        cursor: 'pointer', fontSize: '12px', padding: '2px 6px',
                      }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAwardForm && (
              <div style={{
                padding: '16px', background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px', marginBottom: '12px',
              }}>
                <div style={grid2Style}>
                  <div>
                    <label style={labelStyle}>Название награды *</label>
                    <input value={awardName} onChange={(e) => setAwardName(e.target.value)}
                      placeholder="Пулитцеровская премия" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Год</label>
                    <input type="number" value={awardYear} onChange={(e) => setAwardYear(e.target.value)}
                      placeholder="1953" style={inputStyle} />
                  </div>
                </div>
                <div style={grid2Style}>
                  <div>
                    <label style={labelStyle}>Организация</label>
                    <input value={awardOrganization} onChange={(e) => setAwardOrganization(e.target.value)}
                      placeholder="Американская академия" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Произведение (опционально)</label>
                    <input value={awardWork} onChange={(e) => setAwardWork(e.target.value)}
                      placeholder="451° по Фаренгейту" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={resetAwardForm} style={{
                    padding: '8px 16px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                    color: '#97A6BA', cursor: 'pointer', fontSize: '13px',
                  }}>Отмена</button>
                  <button
                    onClick={editingAwardId ? handleUpdateAward : handleAddAward}
                    disabled={!awardName.trim()}
                    style={{
                      padding: '8px 16px', background: '#FFD54F', border: 'none', borderRadius: '8px',
                      color: '#0A1118', cursor: awardName.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '13px', fontWeight: '500', opacity: awardName.trim() ? 1 : 0.5,
                    }}>
                    {editingAwardId ? 'Обновить' : 'Добавить'}
                  </button>
                </div>
              </div>
            )}

            {!showAwardForm && (
              <button onClick={() => setShowAwardForm(true)} style={{
                padding: '8px 16px', background: 'rgba(255,193,7,0.1)',
                border: '1px solid rgba(255,193,7,0.2)', borderRadius: '8px',
                color: '#FFD54F', cursor: 'pointer', fontSize: '13px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                + Добавить награду
              </button>
            )}
          </div>

          {/* ===== 8. MEDIA ===== */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>МЕДИА</h3>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Фото (URL)</label>
                <input value={photo} onChange={(e) => setPhoto(e.target.value)}
                  placeholder="https://example.com/photo.jpg" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Подпись к портрету</label>
                <input value={portraitCaption} onChange={(e) => setPortraitCaption(e.target.value)}
                  placeholder="Лев Толстой, 1870" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Изображение подписи</label>
              <input value={signatureImage} onChange={(e) => setSignatureImage(e.target.value)}
                placeholder="https://example.com/signature.png" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Галерея (URL изображений)</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                {gallery.map((url, i) => (
                  <span key={i} onClick={() => removeGalleryItem(url)}
                    style={{
                      padding: '3px 10px', background: '#5B86A112', borderRadius: '12px',
                      fontSize: '12px', color: '#5B86A1', cursor: 'pointer',
                      border: '1px solid #5B86A125', display: 'inline-flex', alignItems: 'center', gap: '4px',
                    }}>
                    {url.substring(0, 30)}… <span style={{ marginLeft: '2px' }}>×</span>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input value={galleryInput} onChange={(e) => setGalleryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addGalleryItem(); }
                  }}
                  placeholder="https://example.com/image.jpg" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={addGalleryItem}
                  style={{ padding: '8px 12px', background: 'rgba(91,134,161,0.15)',
                    border: '1px solid rgba(91,134,161,0.3)', borderRadius: '8px',
                    color: '#5B86A1', cursor: 'pointer', fontSize: '13px' }}>+
                </button>
              </div>
            </div>
          </div>

          {/* ===== 9. METADATA (read-only) ===== */}
          {mode === 'edit' && author && (
            <div style={{
              ...sectionStyle,
              padding: '20px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <h3 style={{
                ...sectionTitleStyle,
                color: '#6B7A8D',
                fontSize: '12px',
                borderBottomColor: 'rgba(255,255,255,0.04)',
              }}>
                СИСТЕМНАЯ ИНФОРМАЦИЯ
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: '11px', color: '#6B7A8D' }}>ID</label>
                  <div style={{ color: '#97A6BA', fontSize: '12px', fontFamily: 'monospace' }}>{author.id}</div>
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '11px', color: '#6B7A8D' }}>Тип создания</label>
                  <div style={{ color: '#97A6BA', fontSize: '12px' }}>{author.creation_type}</div>
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '11px', color: '#6B7A8D' }}>Создан</label>
                  <div style={{ color: '#97A6BA', fontSize: '12px' }}>{new Date(author.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '11px', color: '#6B7A8D' }}>Обновлён</label>
                  <div style={{ color: '#97A6BA', fontSize: '12px' }}>{new Date(author.updated_at).toLocaleString()}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ ...labelStyle, fontSize: '11px', color: '#6B7A8D' }}>Книг в каталоге</label>
                  <div style={{ color: '#97A6BA', fontSize: '12px' }}>{author.book_count || 0}</div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ color: '#EF5350', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: '12px', background: '#5B86A1', border: 'none',
                borderRadius: '8px', color: '#0A1118', fontSize: '14px',
                fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1, fontFamily: 'Inter, sans-serif',
              }}
            >
              {loading ? 'Сохранение...' : mode === 'create' ? '➕ Создать' : '💾 Сохранить'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                color: '#97A6BA', fontSize: '14px', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}