import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminBook } from '../../../types/admin';
import { METADATA_STATUS_LABELS, METADATA_STATUS_COLORS, ENRICHMENT_FIELD_LABELS } from '../../../types/admin';
import { Save, ArrowLeft, RefreshCw, AlertCircle, CheckCircle, X, Plus, UserPlus, Link2, Search } from 'lucide-react';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import { apiClient } from '../../../shared/api/client';

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
  // Taxonomy relations (themes & motifs from knowledge graph)
  const [themeRelations, setThemeRelations] = useState<Array<{ id: string; node_id: string; name: string; relation_type: string }>>([]);
  const [motifRelations, setMotifRelations] = useState<Array<{ id: string; node_id: string; name: string; relation_type: string }>>([]);
  const [themeSearchQuery, setThemeSearchQuery] = useState('');
  const [motifSearchQuery, setMotifSearchQuery] = useState('');
  const [themeSearchResults, setThemeSearchResults] = useState<any[]>([]);
  const [motifSearchResults, setMotifSearchResults] = useState<any[]>([]);
  const [showThemeSearch, setShowThemeSearch] = useState(false);
  const [showMotifSearch, setShowMotifSearch] = useState(false);
  const [taxonomyLoading, setTaxonomyLoading] = useState(false);
  const [totalPages, setTotalPages] = useState('');
  const [publicationType, setPublicationType] = useState('official');

  // Author management
  const [linkedAuthors, setLinkedAuthors] = useState<Array<{ id: string; name: string; country?: string | null }>>([]);
  const [authorSearchQuery, setAuthorSearchQuery] = useState('');
  const [authorSearchResults, setAuthorSearchResults] = useState<any[]>([]);
  const [showAuthorSearch, setShowAuthorSearch] = useState(false);
  const [createAuthorName, setCreateAuthorName] = useState('');
  const [showCreateAuthor, setShowCreateAuthor] = useState(false);

  // Fetch book data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      apiClient.get(`/admin/metadata/books/${id}`).then((r) => r.data),
      apiClient.get(`/admin/books/${id}/taxonomy`).then((r) => r.data).catch(() => []),
    ])
      .then(([bookData, taxonomyData]) => {
        setBook(bookData);
        setTitle(bookData.title || '');
        setSubtitle(bookData.subtitle || '');
        setOriginalTitle(bookData.original_title || '');
        setDescription(bookData.description || '');
        setCover(bookData.cover || '');
        setGenres(bookData.genres || []);
        setGenreIds(bookData.genre_ids || []);
        setOriginalLanguage(bookData.original_language || '');
        setCountryOfOrigin(bookData.country_of_origin || '');
        setOriginalPublicationYear(bookData.original_publication_year?.toString() || '');
        setSeriesName(bookData.series_name || '');
        setSeriesPosition(bookData.series_position?.toString() || '');
        setLinkedAuthors(bookData.authors || []);
        setTotalPages(bookData.total_pages?.toString() || '');
        setPublicationType(bookData.publication_type || 'official');
        // Load taxonomy relations
        if (Array.isArray(taxonomyData)) {
          setThemeRelations(taxonomyData.filter((r: any) => r.relation_type === 'theme'));
          setMotifRelations(taxonomyData.filter((r: any) => r.relation_type === 'motif'));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  // Theme search (debounced)
  useEffect(() => {
    if (!themeSearchQuery || themeSearchQuery.length < 1) {
      setThemeSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      apiClient.get(`/taxonomy/nodes?node_type=theme&search=${encodeURIComponent(themeSearchQuery)}`)
        .then((r) => {
          const results = r.data;
          const filtered = (results || []).filter(
            (n: any) => !themeRelations.some((r) => r.node_id === n.id)
          );
          setThemeSearchResults(filtered);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [themeSearchQuery, themeRelations]);

  // Motif search (debounced)
  useEffect(() => {
    if (!motifSearchQuery || motifSearchQuery.length < 1) {
      setMotifSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      apiClient.get(`/taxonomy/nodes?node_type=motif&search=${encodeURIComponent(motifSearchQuery)}`)
        .then((r) => {
          const results = r.data;
          const filtered = (results || []).filter(
            (n: any) => !motifRelations.some((r) => r.node_id === n.id)
          );
          setMotifSearchResults(filtered);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [motifSearchQuery, motifRelations]);

  // Author search (for linking existing authors)
  useEffect(() => {
    if (!authorSearchQuery || authorSearchQuery.length < 1) {
      setAuthorSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      apiClient.get(`/admin/authors?search=${encodeURIComponent(authorSearchQuery)}&limit=10`)
        .then((r) => {
          const results = (r.data.data || []).filter(
            (a: any) => !linkedAuthors.some((la) => la.id === a.id)
          );
          setAuthorSearchResults(results);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [authorSearchQuery, linkedAuthors]);

  const handleAddToList = (value: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) => {
    if (value.trim() && !list.includes(value.trim())) {
      setList([...list, value.trim()]);
    }
    setInput('');
  };

  const handleRemoveFromList = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter((i) => i !== item));
  };

  // ===== TAXONOMY HELPERS =====

  const handleAddTaxonomyRelation = async (nodeId: string, relationType: string) => {
    try {
      const res = await apiClient.post(`/admin/books/${id}/taxonomy`, {
        node_id: nodeId, relation_type: relationType, status: 'approved',
      });
      const relation = res.data;
      const entry = { id: relation.id, node_id: relation.node_id, name: relation.node_name, relation_type: relation.relation_type };
      if (relationType === 'theme') {
        setThemeRelations((prev) => [...prev, entry]);
        setThemeSearchQuery('');
        setThemeSearchResults([]);
        setShowThemeSearch(false);
      } else {
        setMotifRelations((prev) => [...prev, entry]);
        setMotifSearchQuery('');
        setMotifSearchResults([]);
        setShowMotifSearch(false);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveTaxonomyRelation = async (relationId: string, relationType: string) => {
    try {
      await apiClient.delete(`/admin/books/${id}/taxonomy/${relationId}`);
      if (relationType === 'theme') {
        setThemeRelations((prev) => prev.filter((r) => r.id !== relationId));
      } else {
        setMotifRelations((prev) => prev.filter((r) => r.id !== relationId));
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateTaxonomyNode = async (name: string, nodeType: string) => {
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const res = await apiClient.post('/admin/taxonomy/nodes', { name, slug, node_type: nodeType });
      const node = res.data;
      await handleAddTaxonomyRelation(node.id, nodeType);
    } catch (err: any) {
      setError(err.message);
    }
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
          await apiClient.put(`/admin/books/${id}`, basicBody);
        }
      }

      // Step 2: Save enrichment fields via metadata endpoint (author data not included — managed separately)
      const body: Record<string, any> = {
        subtitle: subtitle || null,
        original_title: originalTitle || null,
        description: description || null,
        cover: cover || null,
        genre_ids: genreIds.length > 0 ? genreIds : undefined,
        original_language: originalLanguage || null,
        country_of_origin: countryOfOrigin || null,
        original_publication_year: originalPublicationYear ? parseInt(originalPublicationYear) : null,
        series_name: seriesName || null,
        series_position: seriesPosition ? parseInt(seriesPosition) : null,
        // themes and motifs are now managed via /admin/books/{id}/taxonomy endpoints
      };

      const response = await apiClient.put(`/admin/metadata/books/${id}`, body);
      const updated = response.data;
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

      {/* AUTHORS — entity-based management */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>{t.admin.enrichment.authorSection}</h3>

        {/* Linked authors list */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {linkedAuthors.length === 0 && (
            <span style={{ color: '#97A6BA', fontSize: '13px', fontStyle: 'italic' }}>{t.admin.enrichment.noAuthors}</span>
          )}
          {linkedAuthors.map((a) => (
            <span key={a.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px 4px 14px', background: 'rgba(91,134,161,0.15)', borderRadius: '16px',
              fontSize: '13px', color: '#5B86A1', border: '1px solid rgba(91,134,161,0.3)',
            }}>
              <Link2 size={12} />
              {a.name}
              {a.country && <span style={{ color: '#97A6BA', fontSize: '11px' }}>({a.country})</span>}
              {canEdit && (
                <button
                  onClick={async () => {
                    await apiClient.delete(`/admin/books/${id}/authors/${a.id}`);
                    setLinkedAuthors((prev) => prev.filter((x) => x.id !== a.id));
                  }}
                  style={{ background: 'none', border: 'none', color: '#EF5350', cursor: 'pointer', padding: 0, display: 'flex' }}
                  title={t.admin.enrichment.removeAuthor}
                >
                  <X size={14} />
                </button>
              )}
            </span>
          ))}
        </div>

        {/* Add author controls */}
        {canEdit && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {!showCreateAuthor ? (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    value={authorSearchQuery}
                    onChange={(e) => { setAuthorSearchQuery(e.target.value); setShowAuthorSearch(true); }}
                    onFocus={() => authorSearchQuery.length >= 1 && setShowAuthorSearch(true)}
                    onBlur={() => setTimeout(() => setShowAuthorSearch(false), 200)}
                    placeholder={t.admin.enrichment.authorSearchPlaceholder}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    onClick={() => { setShowCreateAuthor(true); setCreateAuthorName(authorSearchQuery); }}
                    style={{
                      padding: '8px 12px', background: 'rgba(91,134,161,0.15)', border: '1px solid rgba(91,134,161,0.3)',
                      borderRadius: '8px', color: '#5B86A1', cursor: 'pointer', fontSize: '13px',
                      display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
                    }}
                    title={t.admin.enrichment.createAuthor}
                  >
                    <UserPlus size={14} /> {t.admin.enrichment.createAuthor}
                  </button>
                </div>
                {showAuthorSearch && authorSearchResults.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: '#1A2832', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10,
                  }}>
                    {authorSearchResults.map((a: any) => (
                      <div
                        key={a.id}
                        onClick={async () => {
                          await apiClient.post(`/admin/books/${id}/authors?author_id=${a.id}`);
                          setLinkedAuthors((prev) => [...prev, { id: a.id, name: a.name, country: a.country }]);
                          setAuthorSearchQuery('');
                          setAuthorSearchResults([]);
                          setShowAuthorSearch(false);
                        }}
                        style={{
                          padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)',
                          color: '#E6EDF3', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                        }}
                      >
                        <Plus size={14} color="#5B86A1" />
                        {a.name}
                        {a.country && <span style={{ color: '#5B86A1', fontSize: '12px' }}>{a.country}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  value={createAuthorName}
                  onChange={(e) => setCreateAuthorName(e.target.value)}
                  placeholder={t.admin.enrichment.createAuthorPlaceholder}
                  style={{ ...inputStyle, flex: 1 }}
                  autoFocus
                />
                <button
                  onClick={async () => {
                    if (!createAuthorName.trim()) return;
                    try {
                      const res = await apiClient.post('/admin/authors', { name: createAuthorName.trim() });
                      const newAuthor = res.data;
                      await apiClient.post(`/admin/books/${id}/authors?author_id=${newAuthor.id}`);
                      setLinkedAuthors((prev) => [...prev, { id: newAuthor.id, name: newAuthor.name, country: newAuthor.country }]);
                    } catch (_) { /* ignore */ }
                    setCreateAuthorName('');
                    setShowCreateAuthor(false);
                  }}
                  style={{
                    padding: '8px 16px', background: '#5B86A1', border: 'none', borderRadius: '8px',
                    color: '#0A1118', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                  }}
                >
                  {t.admin.common.save}
                </button>
                <button
                  onClick={() => { setShowCreateAuthor(false); setCreateAuthorName(''); }}
                  style={{
                    padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px', color: '#97A6BA', cursor: 'pointer', fontSize: '13px',
                  }}
                >
                  {t.admin.common.cancel}
                </button>
              </div>
            )}
          </div>
        )}
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
          {/* THEMES — knowledge-graph backed */}
          <div>
            <label style={labelStyle}>{t.admin.enrichment.themes}</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
              {themeRelations.length === 0 && (
                <span style={{ color: '#97A6BA', fontSize: '13px', fontStyle: 'italic' }}>{t.admin.enrichment.noThemes}</span>
              )}
              {themeRelations.map((r) => (
                <span key={r.id} style={{
                  padding: '3px 10px', background: 'rgba(168,85,247,0.12)', borderRadius: '12px',
                  fontSize: '12px', color: '#A855F7', cursor: canEdit ? 'pointer' : 'default',
                  border: '1px solid rgba(168,85,247,0.25)', display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}>
                  {r.name}
                  {canEdit && (
                    <span onClick={() => handleRemoveTaxonomyRelation(r.id, 'theme')} style={{ marginLeft: '2px' }}>×</span>
                  )}
                </span>
              ))}
            </div>
            {canEdit && (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    value={themeSearchQuery}
                    onChange={(e) => { setThemeSearchQuery(e.target.value); setShowThemeSearch(true); }}
                    onFocus={() => themeSearchQuery.length >= 1 && setShowThemeSearch(true)}
                    onBlur={() => setTimeout(() => setShowThemeSearch(false), 200)}
                    placeholder={t.admin.enrichment.themesPlaceholder}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
                {showThemeSearch && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: '#1A2832', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10,
                  }}>
                    {themeSearchResults.length === 0 && themeSearchQuery.length >= 1 && (
                      <div
                        onClick={() => handleCreateTaxonomyNode(themeSearchQuery.trim(), 'theme')}
                        style={{
                          padding: '10px 14px', cursor: 'pointer', color: '#5B86A1',
                          fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
                        }}
                      >
                        <Plus size={14} /> {t.admin.enrichment.createTheme} "{themeSearchQuery}"
                      </div>
                    )}
                    {themeSearchResults.map((node: any) => (
                      <div
                        key={node.id}
                        onClick={() => handleAddTaxonomyRelation(node.id, 'theme')}
                        style={{
                          padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)',
                          color: '#E6EDF3', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                        }}
                      >
                        <Plus size={14} color="#A855F7" />
                        {node.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MOTIFS — knowledge-graph backed */}
          <div>
            <label style={labelStyle}>{t.admin.enrichment.motifs}</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
              {motifRelations.length === 0 && (
                <span style={{ color: '#97A6BA', fontSize: '13px', fontStyle: 'italic' }}>{t.admin.enrichment.noMotifs}</span>
              )}
              {motifRelations.map((r) => (
                <span key={r.id} style={{
                  padding: '3px 10px', background: 'rgba(255,167,38,0.12)', borderRadius: '12px',
                  fontSize: '12px', color: '#FFA726', cursor: canEdit ? 'pointer' : 'default',
                  border: '1px solid rgba(255,167,38,0.25)', display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}>
                  {r.name}
                  {canEdit && (
                    <span onClick={() => handleRemoveTaxonomyRelation(r.id, 'motif')} style={{ marginLeft: '2px' }}>×</span>
                  )}
                </span>
              ))}
            </div>
            {canEdit && (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    value={motifSearchQuery}
                    onChange={(e) => { setMotifSearchQuery(e.target.value); setShowMotifSearch(true); }}
                    onFocus={() => motifSearchQuery.length >= 1 && setShowMotifSearch(true)}
                    onBlur={() => setTimeout(() => setShowMotifSearch(false), 200)}
                    placeholder={t.admin.enrichment.motifsPlaceholder}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
                {showMotifSearch && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: '#1A2832', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10,
                  }}>
                    {motifSearchResults.length === 0 && motifSearchQuery.length >= 1 && (
                      <div
                        onClick={() => handleCreateTaxonomyNode(motifSearchQuery.trim(), 'motif')}
                        style={{
                          padding: '10px 14px', cursor: 'pointer', color: '#FFA726',
                          fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
                        }}
                      >
                        <Plus size={14} /> {t.admin.enrichment.createMotif} "{motifSearchQuery}"
                      </div>
                    )}
                    {motifSearchResults.map((node: any) => (
                      <div
                        key={node.id}
                        onClick={() => handleAddTaxonomyRelation(node.id, 'motif')}
                        style={{
                          padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)',
                          color: '#E6EDF3', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                        }}
                      >
                        <Plus size={14} color="#FFA726" />
                        {node.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
