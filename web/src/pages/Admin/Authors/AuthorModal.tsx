import { useState, useEffect } from 'react';
import { AdminAuthor, AuthorAward, GENDER_OPTIONS } from '../../../types/admin';

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

const tagStyle = (color: string): React.CSSProperties => ({
  padding: '3px 10px', background: `${color}12`, borderRadius: '12px',
  fontSize: '12px', color, cursor: 'pointer',
  border: `1px solid ${color}25`, display: 'inline-flex', alignItems: 'center', gap: '4px',
});

const tagColors: Record<string, string> = {
  pseudonyms: '#A855F7', languages: '#5B86A1', occupations: '#FFA726',
  literary_movements: '#4CAF50', notable_works: '#EF5350',
  genres: '#5B86A1', writing_languages: '#A855F7',
};

export default function AuthorModal({ isOpen, mode, author, onClose, onSave }: AuthorModalProps) {
  const token = localStorage.getItem('token');

  // --- Identity ---
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nativeName, setNativeName] = useState('');
  const [sortName, setSortName] = useState('');

  // --- Basic Information ---
  const [pseudonyms, setPseudonyms] = useState<string[]>([]);
  const [pseudonymInput, setPseudonymInput] = useState('');
  const [nationality, setNationality] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState('');
  const [gender, setGender] = useState('unknown');
  const [officialWebsite, setOfficialWebsite] = useState('');
  const [wikipediaUrl, setWikipediaUrl] = useState('');

  // --- Biography ---
  const [bio, setBio] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [deathYear, setDeathYear] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [deathPlace, setDeathPlace] = useState('');

  // --- Career ---
  const [occupations, setOccupations] = useState<string[]>([]);
  const [occupationInput, setOccupationInput] = useState('');
  const [literaryMovements, setLiteraryMovements] = useState<string[]>([]);
  const [literaryMovementInput, setLiteraryMovementInput] = useState('');
  const [activeFromYear, setActiveFromYear] = useState('');
  const [activeToYear, setActiveToYear] = useState('');

  // --- Bibliography ---
  const [notableWorks, setNotableWorks] = useState<string[]>([]);
  const [notableWorkInput, setNotableWorkInput] = useState('');
  const [authorGenres, setAuthorGenres] = useState<string[]>([]);
  const [authorGenreInput, setAuthorGenreInput] = useState('');
  const [writingLanguages, setWritingLanguages] = useState<string[]>([]);
  const [writingLanguageInput, setWritingLanguageInput] = useState('');

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

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && author) {
      setName(author.name || '');
      setFirstName(author.first_name || '');
      setMiddleName(author.middle_name || '');
      setLastName(author.last_name || '');
      setNativeName(author.native_name || '');
      setSortName(author.sort_name || '');
      setPseudonyms(author.pseudonyms || []);
      setNationality(author.nationality || '');
      setLanguages(author.languages || []);
      setGender(author.gender || 'unknown');
      setOfficialWebsite(author.official_website || '');
      setWikipediaUrl(author.wikipedia_url || '');
      setBio(author.bio || '');
      setBirthYear(author.birth_year?.toString() || '');
      setDeathYear(author.death_year?.toString() || '');
      setBirthDate(author.birth_date || '');
      setDeathDate(author.death_date || '');
      setBirthPlace(author.birth_place || '');
      setDeathPlace(author.death_place || '');
      setOccupations(author.occupations || []);
      setLiteraryMovements(author.literary_movements || []);
      setActiveFromYear(author.active_from_year?.toString() || '');
      setActiveToYear(author.active_to_year?.toString() || '');
      setNotableWorks(author.notable_works || []);
      setAuthorGenres(author.genres || []);
      setWritingLanguages(author.writing_languages || []);
      setAwards(author.awards || []);
      setPhoto(author.photo || '');
      setGallery(author.gallery || []);
      setSignatureImage(author.signature_image || '');
      setPortraitCaption(author.portrait_caption || '');
    } else {
      setName('');
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setNativeName('');
      setSortName('');
      setPseudonyms([]);
      setNationality('');
      setLanguages([]);
      setGender('unknown');
      setOfficialWebsite('');
      setWikipediaUrl('');
      setBio('');
      setBirthYear('');
      setDeathYear('');
      setBirthDate('');
      setDeathDate('');
      setBirthPlace('');
      setDeathPlace('');
      setOccupations([]);
      setLiteraryMovements([]);
      setActiveFromYear('');
      setActiveToYear('');
      setNotableWorks([]);
      setAuthorGenres([]);
      setWritingLanguages([]);
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

  // ===== Tag helpers =====
  const addTag = (value: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) => {
    if (value.trim() && !list.includes(value.trim())) {
      setList([...list, value.trim()]);
    }
    setInput('');
  };

  const removeTag = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter((i) => i !== item));
  };

  // ===== Award helpers =====
  const handleAddAward = async () => {
    if (!awardName.trim()) return;
    if (!author || mode === 'create') return;

    try {
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

    try {
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
    if (!author) return;
    try {
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
      const submitData: Record<string, any> = {
        name: name.trim(),
        first_name: firstName.trim() || null,
        middle_name: middleName.trim() || null,
        last_name: lastName.trim() || null,
        native_name: nativeName.trim() || null,
        sort_name: sortName.trim() || null,
        pseudonyms: pseudonyms.length > 0 ? pseudonyms : null,
        nationality: nationality.trim() || null,
        languages: languages.length > 0 ? languages : null,
        gender: gender || 'unknown',
        official_website: officialWebsite.trim() || null,
        wikipedia_url: wikipediaUrl.trim() || null,
        bio: bio.trim() || null,
        birth_year: birthYear ? parseInt(birthYear) : null,
        death_year: deathYear ? parseInt(deathYear) : null,
        birth_date: birthDate.trim() || null,
        death_date: deathDate.trim() || null,
        birth_place: birthPlace.trim() || null,
        death_place: deathPlace.trim() || null,
        occupations: occupations.length > 0 ? occupations : null,
        literary_movements: literaryMovements.length > 0 ? literaryMovements : null,
        active_from_year: activeFromYear ? parseInt(activeFromYear) : null,
        active_to_year: activeToYear ? parseInt(activeToYear) : null,
        notable_works: notableWorks.length > 0 ? notableWorks : null,
        genres: authorGenres.length > 0 ? authorGenres : null,
        writing_languages: writingLanguages.length > 0 ? writingLanguages : null,
        photo: photo.trim() || null,
        gallery: gallery.length > 0 ? gallery : null,
        signature_image: signatureImage.trim() || null,
        portrait_caption: portraitCaption.trim() || null,
      };

      if (!submitData.name) {
        throw new Error('Имя автора обязательно');
      }

      onSave(submitData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ===== Tag input renderer =====
  const renderTagInput = (
    tags: string[],
    input: string,
    setInput: (v: string) => void,
    setTags: (v: string[]) => void,
    placeholder: string,
    field: string,
  ) => (
    <div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
        {tags.map((t) => (
          <span key={t} onClick={() => removeTag(t, tags, setTags)}
            style={tagStyle(tagColors[field] || '#5B86A1')}>
            {t} <span style={{ marginLeft: '2px' }}>×</span>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addTag(input, tags, setTags, setInput); }
          }}
          placeholder={placeholder}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          onClick={() => addTag(input, tags, setTags, setInput)}
          style={{ padding: '8px 12px', background: `${tagColors[field] || '#5B86A1'}20`,
            border: `1px solid ${tagColors[field] || '#5B86A1'}40`, borderRadius: '8px',
            color: tagColors[field] || '#5B86A1', cursor: 'pointer', fontSize: '13px' }}>
          +
        </button>
      </div>
    </div>
  );

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
                <label style={labelStyle}>Имя *</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Полное имя автора" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Имя (first_name)</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Рэй" style={inputStyle} />
              </div>
            </div>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Отчество (middle_name)</label>
                <input value={middleName} onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Николаевич" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Фамилия (last_name)</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                  placeholder="Брэдбери" style={inputStyle} />
              </div>
            </div>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Имя на родном языке (native_name)</label>
                <input value={nativeName} onChange={(e) => setNativeName(e.target.value)}
                  placeholder="Рэй Брэдбери" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Sort name (для сортировки)</label>
                <input value={sortName} onChange={(e) => setSortName(e.target.value)}
                  placeholder="Брэдбери, Рэй" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* ===== 2. BASIC INFORMATION ===== */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>ОСНОВНАЯ ИНФОРМАЦИЯ</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Псевдонимы</label>
              {renderTagInput(pseudonyms, pseudonymInput, setPseudonymInput, setPseudonyms, 'Добавить псевдоним...', 'pseudonyms')}
            </div>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Национальность</label>
                <input value={nationality} onChange={(e) => setNationality(e.target.value)}
                  placeholder="Американская" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Языки</label>
                {renderTagInput(languages, languageInput, setLanguageInput, setLanguages, 'Добавить язык...', 'languages')}
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

          {/* ===== 3. BIOGRAPHY ===== */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>БИОГРАФИЯ</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Биография</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                placeholder="Краткая биография автора..." rows={4} style={textareaStyle} />
            </div>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Год рождения</label>
                <input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="1900" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Год смерти</label>
                <input type="number" value={deathYear} onChange={(e) => setDeathYear(e.target.value)}
                  placeholder="2000" style={inputStyle} />
              </div>
            </div>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Дата рождения</label>
                <input value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                  placeholder="1900-01-15" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Дата смерти</label>
                <input value={deathDate} onChange={(e) => setDeathDate(e.target.value)}
                  placeholder="2000-06-05" style={inputStyle} />
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

          {/* ===== 4. CAREER ===== */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>КАРЬЕРА</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Профессии / Роли</label>
              {renderTagInput(occupations, occupationInput, setOccupationInput, setOccupations,
                'Добавить профессию...', 'occupations')}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Литературные направления</label>
              {renderTagInput(literaryMovements, literaryMovementInput, setLiteraryMovementInput, setLiteraryMovements,
                'Добавить направление...', 'literary_movements')}
            </div>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Активен с года</label>
                <input type="number" value={activeFromYear} onChange={(e) => setActiveFromYear(e.target.value)}
                  placeholder="1920" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Активен по год</label>
                <input type="number" value={activeToYear} onChange={(e) => setActiveToYear(e.target.value)}
                  placeholder="2000" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* ===== 5. BIBLIOGRAPHY ===== */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>БИБЛИОГРАФИЯ</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Известные произведения</label>
              {renderTagInput(notableWorks, notableWorkInput, setNotableWorkInput, setNotableWorks,
                'Добавить произведение...', 'notable_works')}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Жанры</label>
              {renderTagInput(authorGenres, authorGenreInput, setAuthorGenreInput, setAuthorGenres,
                'Добавить жанр...', 'genres')}
            </div>
            <div>
              <label style={labelStyle}>Языки письма</label>
              {renderTagInput(writingLanguages, writingLanguageInput, setWritingLanguageInput, setWritingLanguages,
                'Добавить язык...', 'writing_languages')}
            </div>
          </div>

          {/* ===== 6. AWARDS ===== */}
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

          {/* ===== 7. MEDIA ===== */}
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
                  placeholder="Рэй Брэдбери, 1970" style={inputStyle} />
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
                  <span key={i} onClick={() => removeTag(url, gallery, setGallery)}
                    style={tagStyle('#5B86A1')}>
                    {url.substring(0, 30)}… <span style={{ marginLeft: '2px' }}>×</span>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input value={galleryInput} onChange={(e) => setGalleryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addTag(galleryInput, gallery, setGallery, setGalleryInput); }
                  }}
                  placeholder="https://example.com/image.jpg" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => addTag(galleryInput, gallery, setGallery, setGalleryInput)}
                  style={{ padding: '8px 12px', background: 'rgba(91,134,161,0.15)',
                    border: '1px solid rgba(91,134,161,0.3)', borderRadius: '8px',
                    color: '#5B86A1', cursor: 'pointer', fontSize: '13px' }}>+
                </button>
              </div>
            </div>
          </div>

          {/* ===== 8. METADATA (read-only, visually separated) ===== */}
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
