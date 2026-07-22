import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminBook } from '../../../types/admin';
import { METADATA_STATUS_LABELS, METADATA_STATUS_COLORS, ENRICHMENT_FIELD_LABELS, CREATION_TYPE_LABELS } from '../../../types/admin';
import { Save, ArrowLeft, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { getLocaleData, getBrowserLocale } from '../../../locales';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.syverro.com';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px', color: '#E6EDF3', fontSize: '14px',
  fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '28px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '16px', fontWeight: '500', color: '#E6EDF3', margin: '0 0 16px 0',
  paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)',
};

export default function BookEnrichmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);

  const [book, setBook] = useState<AdminBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser?.role || 'user';
  const isModerator = userRole === 'moderator';
  const canEdit = userRole === 'owner' || userRole === 'admin';

  // Book enrichment fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [genreIds, setGenreIds] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState('');
  const [originalLanguage, setOriginalLanguage] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [originalPublicationYear, setOriginalPublicationYear] = useState('');
  const [seriesName, setSeriesName] = useState('');
  const [seriesPosition, setSeriesPosition] = useState('');
  const [themes, setThemes] = useState<string[]>([]);
  const [themeInput, setThemeInput] = useState('');
  const [motifs, setMotifs] = useState<string[]>([]);
  const [motifInput, setMotifInput] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [publicationType, setPublicationType] = useState('official');

  // Author fields
  const [authorId, setAuthorId] = useState('');
  const [authorQuery, setAuthorQuery] = useState('');
  const [authorSuggestions, setAuthorSuggestions] = useState<any[]>([]);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [authorCountry, setAuthorCountry] = useState('');
  const [authorBio, setAuthorBio] = useState('');
  const [authorBirthYear, setAuthorBirthYear] = useState('');
  const [authorDeathYear, setAuthorDeathYear] = useState('');
  const [authorCreationType, setAuthorCreationType] = useState('individual_author');

  // Fetch book data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_URL}/admin/metadata/books/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: AdminBook) => {
        setBook(data);
        setTitle(data.title || '');
        setSubtitle(data.subtitle || '');
        setOriginalTitle(data.original_title || '');
        setDescription(data.description || '');
        setCover(data.cover || '');
        setGenres(data.genres || []);
        setGenreIds(data.genre_ids || []);
        setOriginalLanguage(data.original_language || '');
        setCountryOfOrigin(data.country_of_origin || '');
        setOriginalPublicationYear(data.original_publication_year?.toString() || '');
        setSeriesName(data.series_name || '');
        setSeriesPosition(data.series_position?.toString() || '');
        setThemes(data.themes || []);
        setMotifs(data.motifs || []);
        setAuthorId(data.author_id || '');
        setAuthorQuery(data.author_name || data.author || '');
        setAuthorCountry(data.author_country || '');
        setAuthorBio(data.author_bio || '');
        setAuthorBirthYear(data.author_birth_year?.toString() || '');
        setAuthorDeathYear(data.author_death_year?.toString() || '');
        setAuthorCreationType(data.author_creation_type || 'individual_author');
        setTotalPages(data.total_pages?.toString() || '');
        setPublicationType(data.publication_type || 'official');
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id, token]);

  // Author search
  useEffect(() => {
    if (!authorQuery || authorQuery.length < 1) {
      setAuthorSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`${API_URL}/admin/authors?search=${encodeURIComponent(authorQuery)}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setAuthorSuggestions(data.data || []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [authorQuery, token]);

  const handleAddToList = (value: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) => {
    if (value.trim() && !list.includes(value.trim())) {
      setList([...list, value.trim()]);
    }
    setInput('');
  };

  const handleRemoveFromList = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter((i) => i !== item));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Step 1: Save basic fields via admin books endpoint (admin/owner only)
      if (canEdit) {
        const basicBody: Record<string, any> = {};
        if (title !== (book?.title || '')) basicBody.title = title;
        if (totalPages !== (book?.total_pages?.toString() || '')) basicBody.total_pages = totalPages ? parseInt(totalPages) : null;
        if (publicationType !== (book?.publication_type || 'official')) basicBody.publication_type = publicationType;

        if (Object.keys(basicBody).length > 0) {
          const basicRes = await fetch(`${API_URL}/admin/books/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(basicBody),
          });
          if (!basicRes.ok) {
            const err = await basicRes.json();
            throw new Error(err.detail || 'Ошибка сохранения основных полей');
          }
        }
      }

      // Step 2: Save enrichment fields via metadata endpoint
      const body: Record<string, any> = {
        subtitle: subtitle || null,
        original_title: originalTitle || null,
        description: description || null,
        cover: cover || null,
        genres: genres,
        genre_ids: genreIds.length > 0 ? genreIds : undefined,
        author_id: authorId || null,
        original_language: originalLanguage || null,
        country_of_origin: countryOfOrigin || null,
        original_publication_year: originalPublicationYear ? parseInt(originalPublicationYear) : null,
        series_name: seriesName || null,
        series_position: seriesPosition ? parseInt(seriesPosition) : null,
        themes: themes,
        motifs: motifs,
        author_country: authorCountry || null,
        author_bio: authorBio || null,
        author_birth_year: authorBirthYear ? parseInt(authorBirthYear) : null,
        author_death_year: authorDeathYear ? parseInt(authorDeathYear) : null,
        author_creation_type: authorCreationType,
      };

      const response = await fetch(`${API_URL}/admin/metadata/books/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Ошибка сохранения');
      }

      const updated = await response.json();
      setBook(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#97A6BA' }}>
        <RefreshCw size={24} className="spinner" />
      </div>
    );
  }

  if (!book) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#EF5350' }}>
        {t.admin.enrichment.bookNotFound}
      </div>
    );
  }

  const mc = METADATA_STATUS_COLORS[book.metadata_status] || '#97A6BA';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/admin/metadata')}
          style={{
            padding: '8px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
            color: '#97A6BA', cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '400', color: '#E6EDF3', margin: 0 }}>
            {t.admin.enrichment.title}: {book.title}
          </h1>
          <div style={{ fontSize: '13px', color: '#97A6BA', marginTop: '4px' }}>
            {book.author}
            <span style={{
              marginLeft: '10px', padding: '2px 10px', borderRadius: '10px', fontSize: '11px',
              background: `${mc}18`, color: mc, border: `1px solid ${mc}30`,
            }}>
              {METADATA_STATUS_LABELS[book.metadata_status as keyof typeof METADATA_STATUS_LABELS]}
            </span>
          </div>
        </div>
      </div>

      {isModerator && (
        <div style={{
          padding: '12px 16px', background: 'rgba(91,134,161,0.08)', borderRadius: '8px',
          border: '1px solid rgba(91,134,161,0.15)', fontSize: '13px', color: '#5B86A1',
        }}>
          {t.admin.enrichment.moderatorNotice}
        </div>
      )}

      {book.missing_fields && book.missing_fields.length > 0 && (
        <div style={{
          padding: '12px 16px', background: 'rgba(255,167,38,0.08)', borderRadius: '8px',
          border: '1px solid rgba(255,167,38,0.15)', fontSize: '13px', color: '#FFA726',
        }}>
          <strong>{t.admin.enrichment.missing}</strong> {book.missing_fields.map((f) => ENRICHMENT_FIELD_LABELS[f] || f).join(', ')}
        </div>
      )}

      {/* BASIC INFO */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>{t.admin.enrichment.basicInfo}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>{t.admin.enrichment.titleField}</label>
            <input
              value={title}
              onChange={(e) => canEdit && setTitle(e.target.value)}
              disabled={isModerator}
              style={{ ...inputStyle, opacity: isModerator ? 0.5 : 1 }}
            />
          </div>
          <div>
            <label style={labelStyle}>{t.admin.enrichment.subtitle}</label>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              disabled={isModerator}
              placeholder={t.admin.enrichment.subtitlePlaceholder}
              style={{ ...inputStyle, opacity: isModerator ? 0.5 : 1 }}
            />
          </div>
          <div>
            <label style={labelStyle}>{t.admin.enrichment.originalTitle}</label>
            <input
              value={originalTitle}
              onChange={(e) => setOriginalTitle(e.target.value)}
              disabled={isModerator}
              placeholder={t.admin.enrichment.originalTitlePlaceholder}
              style={{ ...inputStyle, opacity: isModerator ? 0.5 : 1 }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>{t.admin.enrichment.description}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isModerator}
              placeholder={t.admin.enrichment.descriptionPlaceholder}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', opacity: isModerator ? 0.5 : 1 }}
            />
          </div>
          <div>
            <label style={labelStyle}>{t.admin.enrichment.coverUrl}</label>
            <input
              type="url"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              disabled={isModerator}
              placeholder="https://..."
              style={{ ...inputStyle, opacity: isModerator ? 0.5 : 1 }}
            />
          </div>
          {canEdit && (
            <>
              <div>
                <label style={labelStyle}>{t.admin.enrichment.pages}</label>
                <input
                  type="number"
                  value={totalPages}
                  onChange={(e) => setTotalPages(e.target.value)}
                  placeholder={t.admin.enrichment.pagesPlaceholder}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>{t.admin.enrichment.publicationType}</label>
                <select
                  value={publicationType}
                  onChange={(e) => setPublicationType(e.target.value)}
                  style={inputStyle}
                >
                  <option value="official">{t.admin.enrichment.official}</option>
                  <option value="unofficial">{t.admin.enrichment.unofficial}</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label style={labelStyle}>{t.admin.enrichment.genres}</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
              {genres.map((g) => (
                <span key={g} onClick={() => handleRemoveFromList(g, genres, setGenres)} style={{
                  padding: '3px 10px', background: 'rgba(91,134,161,0.15)', borderRadius: '12px',
                  fontSize: '12px', color: '#5B86A1', cursor: 'pointer', border: '1px solid rgba(91,134,161,0.3)',
                }}>
                  {g} ×
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                value={genreInput}
                onChange={(e) => setGenreInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddToList(genreInput, genres, setGenres, setGenreInput); } }}
                placeholder={t.admin.enrichment.genresPlaceholder}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={() => handleAddToList(genreInput, genres, setGenres, setGenreInput)}
                style={{ padding: '8px 12px', background: 'rgba(91,134,161,0.15)', border: '1px solid rgba(91,134,161,0.3)', borderRadius: '8px', color: '#5B86A1', cursor: 'pointer', fontSize: '13px' }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AUTHOR */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>{t.admin.enrichment.authorSection}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
            <label style={labelStyle}>{t.admin.enrichment.authorField} {authorId && <span style={{ color: '#4CAF50', fontSize: '11px' }}>{t.admin.enrichment.authorFromDb}</span>}</label>
            <input
              value={authorQuery}
              onChange={(e) => { setAuthorQuery(e.target.value); setAuthorId(''); setShowAuthorDropdown(true); }}
              onFocus={() => authorQuery.length >= 1 && setShowAuthorDropdown(true)}
              onBlur={() => setTimeout(() => setShowAuthorDropdown(false), 200)}
              placeholder={t.admin.enrichment.authorSearchPlaceholder}
              style={inputStyle}
            />
            {showAuthorDropdown && authorSuggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: '#1A2832', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10,
              }}>
                {authorSuggestions.map((a: any) => (
                  <div
                    key={a.id}
                    onClick={() => { setAuthorId(a.id); setAuthorQuery(a.name); setShowAuthorDropdown(false); }}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#E6EDF3', fontSize: '14px' }}
                  >
                    {a.name}
                    {a.country && <span style={{ color: '#5B86A1', fontSize: '12px', marginLeft: '8px' }}>{a.country}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>{t.admin.enrichment.authorCountry}</label>
            <input value={authorCountry} onChange={(e) => setAuthorCountry(e.target.value)} placeholder={t.admin.enrichment.countryPlaceholder} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t.admin.enrichment.authorType}</label>
            <select value={authorCreationType} onChange={(e) => setAuthorCreationType(e.target.value)} style={inputStyle}>
              {Object.entries(CREATION_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{t.admin.enrichment.birthYear}</label>
            <input type="number" value={authorBirthYear} onChange={(e) => setAuthorBirthYear(e.target.value)} placeholder={t.admin.enrichment.yearPlaceholder} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t.admin.enrichment.deathYear}</label>
            <input type="number" value={authorDeathYear} onChange={(e) => setAuthorDeathYear(e.target.value)} placeholder={t.admin.enrichment.yearPlaceholder} style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>{t.admin.enrichment.authorBio}</label>
            <textarea value={authorBio} onChange={(e) => setAuthorBio(e.target.value)} placeholder={t.admin.enrichment.bioPlaceholder} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>
      </div>

      {/* CLASSIFICATION */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>{t.admin.enrichment.classification}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>{t.admin.enrichment.originalLanguage}</label>
            <input value={originalLanguage} onChange={(e) => setOriginalLanguage(e.target.value)} placeholder={t.admin.enrichment.languagePlaceholder} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t.admin.enrichment.countryOfOrigin}</label>
            <input value={countryOfOrigin} onChange={(e) => setCountryOfOrigin(e.target.value)} placeholder={t.admin.enrichment.countryPlaceholder} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t.admin.enrichment.firstPublishedYear}</label>
            <input type="number" value={originalPublicationYear} onChange={(e) => setOriginalPublicationYear(e.target.value)} placeholder={t.admin.enrichment.yearPlaceholder} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t.admin.enrichment.series}</label>
            <input value={seriesName} onChange={(e) => setSeriesName(e.target.value)} placeholder={t.admin.enrichment.seriesPlaceholder} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t.admin.enrichment.seriesPosition}</label>
            <input type="number" value={seriesPosition} onChange={(e) => setSeriesPosition(e.target.value)} placeholder="#" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t.admin.enrichment.themes}</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
              {themes.map((t) => (
                <span key={t} onClick={() => handleRemoveFromList(t, themes, setThemes)} style={{
                  padding: '3px 10px', background: 'rgba(168,85,247,0.12)', borderRadius: '12px',
                  fontSize: '12px', color: '#A855F7', cursor: 'pointer', border: '1px solid rgba(168,85,247,0.25)',
                }}>
                  {t} ×
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                value={themeInput}
                onChange={(e) => setThemeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddToList(themeInput, themes, setThemes, setThemeInput); } }}
                placeholder={t.admin.enrichment.themesPlaceholder}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={() => handleAddToList(themeInput, themes, setThemes, setThemeInput)}
                style={{ padding: '8px 12px', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '8px', color: '#A855F7', cursor: 'pointer', fontSize: '13px' }}
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>{t.admin.enrichment.motifs}</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
              {motifs.map((m) => (
                <span key={m} onClick={() => handleRemoveFromList(m, motifs, setMotifs)} style={{
                  padding: '3px 10px', background: 'rgba(255,167,38,0.12)', borderRadius: '12px',
                  fontSize: '12px', color: '#FFA726', cursor: 'pointer', border: '1px solid rgba(255,167,38,0.25)',
                }}>
                  {m} ×
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                value={motifInput}
                onChange={(e) => setMotifInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddToList(motifInput, motifs, setMotifs, setMotifInput); } }}
                placeholder={t.admin.enrichment.motifsPlaceholder}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={() => handleAddToList(motifInput, motifs, setMotifs, setMotifInput)}
                style={{ padding: '8px 12px', background: 'rgba(255,167,38,0.12)', border: '1px solid rgba(255,167,38,0.25)', borderRadius: '8px', color: '#FFA726', cursor: 'pointer', fontSize: '13px' }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SAVE */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingBottom: '20px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 24px', background: '#5B86A1', border: 'none', borderRadius: '8px',
            color: '#0A1118', fontSize: '14px', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1, fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          <Save size={16} />
          {saving ? t.admin.common.saving : t.admin.common.save}
        </button>
        {success && (
          <span style={{ color: '#4CAF50', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={14} /> {t.admin.enrichment.saved}
          </span>
        )}
        {error && (
          <span style={{ color: '#EF5350', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={14} /> {error}
          </span>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
