import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AdminAuthor, AuthorAward, GENDER_OPTIONS, DISPLAY_NAME_MODE_LABELS, computeDisplayName } from '../../../types/admin';
import type { DisplayNameMode } from '../../../types/admin';
import ChipInput from '../../../components/ChipInput';
import { computeSearchAliases } from '../../../shared/utils/normalizeSearch';

function normalizeDate(d: string | null | undefined): string {
  if (!d) return '';
  const m = d.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const p = new Date(d);
  if (!isNaN(p.getTime())) return p.toISOString().split('T')[0];
  return '';
}

function toUTCDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

const CYRILLIC_TO_LATIN: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
};

function transliterate(text: string): string {
  return text.toLowerCase().split('').map((ch) => CYRILLIC_TO_LATIN[ch] || ch).join('');
}

function slugify(text: string): string {
  const translit = transliterate(text);
  return translit.replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
}

interface AuthorModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  author: AdminAuthor | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
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
  const [slug, setSlug] = useState('');

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
  const [heroBackgroundUrl, setHeroBackgroundUrl] = useState('');
  const [authorIntroQuote, setAuthorIntroQuote] = useState('');
  const [activeFromYear, setActiveFromYear] = useState<number | null>(null);
  const [activeToYear, setActiveToYear] = useState<number | null>(null);
  const [notableWorks, setNotableWorks] = useState<string[]>([]);
  const [writingLanguages, setWritingLanguages] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [formReady, setFormReady] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [chipDict] = useState(() => loadDict());

  const recordChip = useCallback((key: string, value: string) => {
    addToDict(key, value);
  }, []);

  const computedDisplayName = useMemo(() => {
    if (displayNameMode === 'custom') return customDisplayName.trim();
    return computeDisplayName(displayNameMode, firstName, lastName, middleName, birthName, penNames);
  }, [displayNameMode, firstName, lastName, middleName, birthName, penNames, customDisplayName]);

  const slugManuallyEdited = useRef(false);

  useEffect(() => {
    if (slugManuallyEdited.current || !computedDisplayName) return;
    setSlug(slugify(computedDisplayName));
  }, [computedDisplayName]);

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
      setSlug(author.slug || '');
      if (author.slug) slugManuallyEdited.current = true;
      setPenNames(author.pen_names || author.pseudonyms || []);
      setSortName(author.sort_name || '');
      setNationality(author.nationality || '');
      setLanguages(author.languages || []);
      setGender(author.gender || 'unknown');
      setOfficialWebsite(author.official_website || '');
      setWikipediaUrl(author.wikipedia_url || '');
      setBio(author.bio || '');
      setBirthDate(normalizeDate(author.birth_date));
      setDeathDate(normalizeDate(author.death_date));
      setBirthPlace(author.birth_place || '');
      setDeathPlace(author.death_place || '');
      setOccupations(author.occupations || []);
      setLiteraryMovements(author.literary_movements || []);
      if (author.awards) console.debug('[author-load] awards count:', author.awards.length);
      setAwards(author.awards || []);
      setActiveFromYear(author.active_from_year ?? null);
      setActiveToYear(author.active_to_year ?? null);
      setNotableWorks(author.notable_works || []);
      setWritingLanguages(author.writing_languages || []);
      setGenres(author.genres || []);
      setPhoto(author.photo || '');
      setGallery(author.gallery || []);
      setSignatureImage(author.signature_image || '');
      setPortraitCaption(author.portrait_caption || '');
      setHeroBackgroundUrl(author.hero_background_url || '');
      setAuthorIntroQuote(author.author_intro_quote || '');
    } else {
      setFirstName('');
      setLastName('');
      setMiddleName('');
      setBirthName('');
      setNativeName('');
      setDisplayNameMode('real_name');
      setCustomDisplayName('');
      setSlug('');
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
      setActiveFromYear(null);
      setActiveToYear(null);
      setNotableWorks([]);
      setWritingLanguages([]);
      setGenres([]);
      setPhoto('');
      setGallery([]);
      setSignatureImage('');
      setPortraitCaption('');
      setHeroBackgroundUrl('');
      setAuthorIntroQuote('');
    }
    setError(null);
    setShowAwardForm(false);
    setEditingAwardId(null);
    setSaveStatus('idle');
    setFormReady(true);
  }, [mode, author, isOpen]);

  // ===== Beforeunload warning for unsaved changes =====
  useEffect(() => {
    if (!formReady || !isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [formReady, isDirty]);

  if (!isOpen) return null;

  // ===== Award helpers (local state only — submitted in main payload) =====
  const handleAddAward = () => {
    if (!awardName.trim()) return;
    setIsDirty(true);
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
  };

  const handleUpdateAward = () => {
    if (!awardName.trim() || !editingAwardId) return;
    setIsDirty(true);
    setAwards((prev) => prev.map((a) =>
      a.id === editingAwardId
        ? { ...a, name: awardName.trim(), year: awardYear ? parseInt(awardYear) : null, organization: awardOrganization.trim() || null, work: awardWork.trim() || null }
        : a
    ));
    resetAwardForm();
  };

  const handleDeleteAward = (awardId: string) => {
    setIsDirty(true);
    setAwards((prev) => prev.filter((a) => a.id !== awardId));
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

  // ===== Date validation =====
  const validateDates = (): string | null => {
    if (!birthDate && !deathDate) return null;
    if (birthDate) {
      const bd = toUTCDate(birthDate);
      if (isNaN(bd.getTime())) return 'Некорректная дата рождения';
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      if (bd > today) return 'Дата рождения не может быть в будущем';
    }
    if (deathDate) {
      const dd = toUTCDate(deathDate);
      if (isNaN(dd.getTime())) return 'Некорректная дата смерти';
    }
    if (birthDate && deathDate) {
      const bd = toUTCDate(birthDate);
      const dd = toUTCDate(deathDate);
      if (dd < bd) return 'Дата смерти не может быть раньше даты рождения';
    }
    return null;
  };

  // ===== Close guard =====
  const handleClose = () => {
    if (saveStatus === 'saving') return;
    if (isDirty && saveStatus !== 'success' && !window.confirm('У вас есть несохранённые изменения. Отменить?')) return;
    onClose();
  };

  // ===== Submit =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const displayName = computedDisplayName || [firstName, lastName].filter(Boolean).join(' ') || birthName || penNames[0] || '';
    if (!displayName) {
      setError('Имя автора обязательно');
      return;
    }

    const dateErr = validateDates();
    if (dateErr) {
      setError(dateErr);
      return;
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
      slug: slug.trim() || null,
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
      birth_date: birthDate || null,
      death_date: deathDate || null,
      birth_place: birthPlace.trim() || null,
      death_place: deathPlace.trim() || null,
      occupations: occupations.length > 0 ? occupations : null,
      literary_movements: literaryMovements.length > 0 ? literaryMovements : null,
      active_from_year: activeFromYear,
      active_to_year: activeToYear,
      notable_works: notableWorks.length > 0 ? notableWorks : null,
      writing_languages: writingLanguages.length > 0 ? writingLanguages : null,
      genres: genres.length > 0 ? genres : null,
      awards: awards.map(({ name, year, organization, work }) => ({ name, year, organization, work })),
      photo: photo.trim() || null,
      gallery: gallery.length > 0 ? gallery : null,
      signature_image: signatureImage.trim() || null,
      portrait_caption: portraitCaption.trim() || null,
      hero_background_url: heroBackgroundUrl.trim() || null,
      author_intro_quote: authorIntroQuote.trim() || null,
    };

    setSaveStatus('saving');
    try {
      await onSave(submitData);
      setSaveStatus('success');
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setSaveStatus('error');
      setError(err.message || 'Ошибка сохранения');
    }
  };

  // ===== Gallery helpers =====
  const addGalleryItem = () => {
    const val = galleryInput.trim();
    if (val && !gallery.includes(val)) {
      setGallery([...gallery, val]);
      setIsDirty(true);
    }
    setGalleryInput('');
  };

  const removeGalleryItem = (item: string) => {
    setGallery(gallery.filter((i) => i !== item));
    setIsDirty(true);
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
          <button onClick={handleClose} style={{
            background: 'none', border: 'none', color: '#97A6BA',
            fontSize: '24px', cursor: 'pointer', padding: '4px 8px',
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} onChange={() => { if (formReady) setIsDirty(true); }}>
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
                    onClick={() => { setIsDirty(true); setDisplayNameMode(opt.value); }}
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
            <ChipInput tags={penNames} onChange={(v) => { setIsDirty(true); setPenNames(v); v.forEach((t) => recordChip('pen_names', t)); }}
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
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>URL-идентификатор (slug)</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input value={slug} onChange={(e) => { slugManuallyEdited.current = true; setSlug(e.target.value); }}
                  placeholder="lev-tolstoj" style={{ ...inputStyle, flex: 1 }} />
                <button type="button" onClick={() => { slugManuallyEdited.current = false; if (computedDisplayName) setSlug(slugify(computedDisplayName)); }}
                  style={{ padding: '8px 12px', background: 'rgba(91,134,161,0.15)',
                    border: '1px solid rgba(91,134,161,0.3)', borderRadius: '8px',
                    color: '#5B86A1', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  ↻
                </button>
              </div>
            </div>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Национальность</label>
                <input value={nationality} onChange={(e) => setNationality(e.target.value)}
                  placeholder="Русская" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Языки</label>
                <ChipInput tags={languages} onChange={(v) => { setIsDirty(true); setLanguages(v); v.forEach((t) => recordChip('languages', t)); }}
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
                <label style={labelStyle}>Дата рождения</label>
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Дата смерти</label>
                <input type="date" value={deathDate} onChange={(e) => setDeathDate(e.target.value)}
                  style={inputStyle} />
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
              <ChipInput tags={occupations} onChange={(v) => { setIsDirty(true); setOccupations(v); v.forEach((t) => recordChip('occupations', t)); }}
                placeholder="Добавить профессию..." color={tagColors.occupations} suggestions={chipDict.occupations || []} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Литературные направления</label>
              <ChipInput tags={literaryMovements} onChange={(v) => { setIsDirty(true); setLiteraryMovements(v); v.forEach((t) => recordChip('literary_movements', t)); }}
                placeholder="Добавить направление..." color={tagColors.literary_movements} suggestions={chipDict.literary_movements || []} />
            </div>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Год начала активности</label>
                <input type="number" value={activeFromYear ?? ''} onChange={(e) => setActiveFromYear(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="1850" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Год окончания активности</label>
                <input type="number" value={activeToYear ?? ''} onChange={(e) => setActiveToYear(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="1910" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Известные произведения</label>
              <ChipInput tags={notableWorks} onChange={(v) => { setIsDirty(true); setNotableWorks(v); v.forEach((t) => recordChip('notable_works', t)); }}
                placeholder="Добавить произведение..." color={tagColors.notable_works} suggestions={chipDict.notable_works || []} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Языки письма</label>
              <ChipInput tags={writingLanguages} onChange={(v) => { setIsDirty(true); setWritingLanguages(v); v.forEach((t) => recordChip('writing_languages', t)); }}
                placeholder="Добавить язык..." color={tagColors.writing_languages} suggestions={chipDict.writing_languages || []} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Жанры</label>
              <ChipInput tags={genres} onChange={(v) => { setIsDirty(true); setGenres(v); v.forEach((t) => recordChip('genres', t)); }}
                placeholder="Добавить жанр..." color={tagColors.genres} suggestions={chipDict.genres || []} />
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
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Фон страницы автора</label>
              <input value={heroBackgroundUrl} onChange={(e) => setHeroBackgroundUrl(e.target.value)}
                placeholder="https://example.com/hero-bg.jpg" style={inputStyle} />
              <div style={{ fontSize: '11px', color: '#6E7C90', marginTop: '4px', fontStyle: 'italic' }}>
                Рекомендуемый размер: 1920×600px, соотношение 16:5
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Вступительная цитата об авторе</label>
              <textarea value={authorIntroQuote} onChange={(e) => setAuthorIntroQuote(e.target.value)}
                placeholder="One of the most influential voices of Russian literature..."
                style={{ ...inputStyle, minHeight: '60px', resize: 'vertical', fontStyle: 'italic' }} />
              <div style={{ fontSize: '11px', color: '#6E7C90', marginTop: '4px', fontStyle: 'italic' }}>
                Короткая цитата или описание автора, отображаемая в шапке страницы
              </div>
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

          {error && saveStatus !== 'saving' && (
            <div style={{ color: '#EF5350', fontSize: '13px', marginBottom: '16px', padding: '10px 14px', background: 'rgba(239,83,80,0.08)', borderRadius: '8px', border: '1px solid rgba(239,83,80,0.15)' }}>
              {error}
            </div>
          )}

          {saveStatus === 'success' && (
            <div style={{ color: '#4CAF50', fontSize: '13px', marginBottom: '16px', padding: '10px 14px', background: 'rgba(76,175,80,0.08)', borderRadius: '8px', border: '1px solid rgba(76,175,80,0.15)', textAlign: 'center' }}>
              ✓ Сохранено
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={saveStatus === 'saving' || saveStatus === 'success'}
              style={{
                flex: 1, padding: '12px', background: saveStatus === 'success' ? '#4CAF50' : saveStatus === 'error' ? '#EF5350' : '#5B86A1',
                border: 'none', borderRadius: '8px',
                color: '#0A1118', fontSize: '14px',
                fontWeight: '500',
                cursor: saveStatus === 'saving' || saveStatus === 'success' ? 'not-allowed' : 'pointer',
                opacity: saveStatus === 'saving' ? 0.6 : 1,
                fontFamily: 'Inter, sans-serif', transition: 'background 0.2s',
              }}
            >
              {saveStatus === 'saving' ? '⏳ Сохранение...' : saveStatus === 'success' ? '✓ Сохранено' : mode === 'create' ? '➕ Создать' : '💾 Сохранить'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={saveStatus === 'saving'}
              style={{
                padding: '12px 24px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                color: '#97A6BA', fontSize: '14px',
                cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                opacity: saveStatus === 'saving' ? 0.5 : 1,
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