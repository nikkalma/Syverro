import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../shared/api/client';
import { formatAuthorName } from '../../shared/utils/formatAuthorName';
import { getLocaleData, getBrowserLocale } from '../../locales';

interface AuthorBook {
  id: string;
  title: string;
  cover: string | null;
}

interface AuthorMetadata {
  genres: string[];
  themes: string[];
  motifs: string[];
}

interface AuthorResponse {
  id: string;
  name: string;
  display_name?: string | null;
  display_name_mode?: string | null;
  first_name: string | null;
  last_name: string | null;
  native_name: string | null;
  nationality: string | null;
  birth_date: string | null;
  death_date: string | null;
  biography: string | null;
  photo_url: string | null;
  books: AuthorBook[];
  metadata: AuthorMetadata;
}

const tabStyle = (active: boolean): React.CSSProperties => ({
  background: 'none',
  border: 'none',
  padding: '8px 16px',
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  cursor: 'default',
  color: active ? '#E6EDF3' : '#5B86A1',
  borderBottom: active ? '2px solid #5B86A1' : '2px solid transparent',
  fontWeight: active ? '500' : '400',
});

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#97A6BA',
  marginBottom: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(18, 28, 36, 0.6)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.06)',
  padding: '20px',
  height: '100%',
};

const placeholderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '120px',
  borderRadius: '12px',
  background: 'rgba(18, 28, 36, 0.4)',
  border: '1px dashed rgba(255,255,255,0.08)',
  color: '#5B86A1',
  fontSize: '13px',
};

const tagPillStyle: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: '14px',
  fontSize: '12px',
  display: 'inline-block',
};

export default function AuthorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [author, setAuthor] = useState<AuthorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    apiClient.get<AuthorResponse>(`/authors/${id}`)
      .then((res) => {
        setAuthor(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || err.message || 'Failed to load author');
        setLoading(false);
      });
  }, [id]);

  const t = getLocaleData(getBrowserLocale());

  if (loading) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ color: '#97A6BA', fontSize: '14px' }}>{t.author.loading}</div>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{
          padding: '40px', textAlign: 'center', color: '#EF5350',
          background: 'rgba(18, 28, 36, 0.6)', borderRadius: '12px',
          border: '1px solid rgba(239,83,80,0.2)',
        }}>
          <p>{error || t.author.authorNotFound}</p>
        </div>
      </div>
    );
  }

  const displayName = author.display_name || formatAuthorName(author.name, author.first_name, author.last_name);
  const showNative = author.native_name && author.native_name !== displayName;

  const hasBio = author.biography && author.biography.trim().length > 0;
  const bioIsLong = hasBio && (author.biography!.length > 300);
  const shortDescription = hasBio
    ? (author.biography!.length > 150 ? author.biography!.slice(0, 150) + '...' : author.biography!)
    : null;

  const hasGenres = author.metadata.genres.length > 0;
  const hasThemes = author.metadata.themes.length > 0;
  const hasMotifs = author.metadata.motifs.length > 0;
  const hasTags = hasGenres || hasThemes || hasMotifs;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px 60px' }}>

      {/* ──────── AUTHOR HEADER ──────── */}
      <div style={{
        width: '100%', height: '220px', borderRadius: '16px', marginTop: '20px',
        background: 'linear-gradient(135deg, #1A2832 0%, #0F1A22 50%, #1A2832 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 30% 40%, rgba(91,134,161,0.12) 0%, transparent 60%)',
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginTop: '-52px', paddingLeft: '20px' }}>
        <div style={{
          width: '104px', height: '104px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #2A4B60, #1A2832)',
          border: '3px solid var(--bg, #121C24)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '40px', color: '#5B86A1', position: 'relative', zIndex: 1,
          flexShrink: 0, overflow: 'hidden',
        }}>
          {author.photo_url ? (
            <img src={author.photo_url} alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div style={{ paddingBottom: '6px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '500', color: '#E6EDF3', margin: 0, lineHeight: 1.2 }}>
            {displayName}
          </h1>
          {showNative && (
            <div style={{ fontSize: '14px', color: '#5B86A1', marginTop: '2px' }}>
              {author.native_name}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '13px', color: '#97A6BA', marginTop: '4px' }}>
            {author.nationality && <span>{author.nationality}</span>}
            {author.birth_date && (
              <span>
                {author.birth_date}{author.death_date ? ` — ${author.death_date}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      {hasTags && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '16px' }}>
          {hasGenres && author.metadata.genres.map((g) => (
            <span key={g} style={{ ...tagPillStyle, background: 'rgba(91,134,161,0.12)', color: '#5B86A1', border: '1px solid rgba(91,134,161,0.2)' }}>{g}</span>
          ))}
          {hasThemes && author.metadata.themes.map((t) => (
            <span key={t} style={{ ...tagPillStyle, background: 'rgba(251,191,36,0.1)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.2)' }}>{t}</span>
          ))}
          {hasMotifs && author.metadata.motifs.map((m) => (
            <span key={m} style={{ ...tagPillStyle, background: 'rgba(236,72,153,0.1)', color: '#EC4899', border: '1px solid rgba(236,72,153,0.2)' }}>{m}</span>
          ))}
        </div>
      )}

      {/* Short description */}
      {shortDescription && (
        <p style={{ fontSize: '14px', color: '#97A6BA', lineHeight: 1.6, marginTop: '14px', marginBottom: 0 }}>
          {shortDescription}
        </p>
      )}

      {/* ──────── AUTHOR NAVIGATION TABS ──────── */}
      <div style={{
        display: 'flex', gap: '4px', marginTop: '28px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button style={tabStyle(true)}>{t.author.tabAbout}</button>
        <button style={tabStyle(false)}>{t.author.tabBooks}</button>
        <button style={tabStyle(false)}>{t.author.tabWorlds}</button>
        <button style={tabStyle(false)}>{t.author.tabConnections}</button>
        <button style={tabStyle(false)}>{t.author.tabQuotes}</button>
      </div>

      {/* ──────── CONTENT GRID ──────── */}
      {/* Row 1: About Author | Timeline | Atmosphere */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '20px',
        marginTop: '24px',
      }}>
        {/* About Author */}
        <div>
          <div style={sectionTitleStyle}>{t.author.aboutAuthor}</div>
          <div style={cardStyle}>
            {hasBio ? (
              <div>
                <p style={{ fontSize: '13px', color: '#97A6BA', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {bioExpanded || !bioIsLong
                    ? author.biography
                    : author.biography!.slice(0, 300) + '...'}
                </p>
                {bioIsLong && (
                  <button
                    onClick={() => setBioExpanded(!bioExpanded)}
                    style={{
                      background: 'none', border: 'none', color: '#5B86A1',
                      cursor: 'pointer', fontSize: '12px', marginTop: '8px', padding: 0,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {bioExpanded ? t.author.showLess : t.author.readMore}
                  </button>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#5B86A1', margin: 0 }}>{t.author.noBiography}</p>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div style={sectionTitleStyle}>{t.author.timeline}</div>
          <div style={placeholderStyle}>
            {t.author.timelineComingSoon}
          </div>
        </div>

        {/* Atmosphere */}
        <div>
          <div style={sectionTitleStyle}>{t.author.atmosphere}</div>
          <div style={cardStyle}>
            {hasThemes ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {author.metadata.themes.map((t) => (
                  <span key={t} style={{
                    ...tagPillStyle, background: 'rgba(251,191,36,0.1)', color: '#FBBF24',
                    border: '1px solid rgba(251,191,36,0.2)',
                  }}>{t}</span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#5B86A1', margin: 0 }}>{t.author.noAtmosphere}</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Author Books | Quote */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '20px',
        marginTop: '24px',
      }}>
        {/* Author Books */}
        <div>
          <div style={sectionTitleStyle}>{t.author.authorBooks}</div>
          {author.books.length > 0 ? (
            <div style={{
              display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px',
            }}>
              {author.books.map((book) => (
                <div
                  key={book.id}
                  onClick={() => navigate(`/book/${book.id}`)}
                  style={{
                    flex: '0 0 140px', cursor: 'pointer', borderRadius: '10px', overflow: 'hidden',
                    background: 'rgba(18, 28, 36, 0.6)', border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(91,134,161,0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                >
                  <div style={{
                    width: '100%', aspectRatio: '2/3',
                    background: 'linear-gradient(135deg, #1A2832, #0F1A22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '32px', color: '#5B86A1',
                  }}>
                    {book.cover ? (
                      <img src={book.cover} alt={book.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ opacity: 0.3 }}>📖</span>
                    )}
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{
                      fontSize: '12px', color: '#E6EDF3',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {book.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={placeholderStyle}>{t.author.noBooks}</div>
          )}
        </div>

        {/* Quote */}
        <div>
          <div style={sectionTitleStyle}>{t.author.quote}</div>
          <div style={placeholderStyle}>
            {t.author.quoteComingSoon}
          </div>
        </div>
      </div>

      {/* Row 3: Connections | Collections */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginTop: '24px',
      }}>
        {/* Connections */}
        <div>
          <div style={sectionTitleStyle}>{t.author.connections}</div>
          <div style={{
            padding: '40px 20px', borderRadius: '12px', textAlign: 'center',
            background: 'rgba(18, 28, 36, 0.4)', border: '1px solid rgba(255,255,255,0.06)',
            color: '#5B86A1', fontSize: '13px',
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.4 }}>🔮</div>
            {t.author.graphComingSoon}
          </div>
        </div>

        {/* Collections */}
        <div>
          <div style={sectionTitleStyle}>{t.author.collections}</div>
          <div style={placeholderStyle}>
            {t.author.collectionsComingSoon}
          </div>
        </div>
      </div>

      {/* ──────── BOTTOM: YOU MAY ALSO LIKE ──────── */}
      <div style={{ marginTop: '32px' }}>
        <div style={sectionTitleStyle}>{t.author.youMayAlsoLike}</div>
        <div style={placeholderStyle}>
          {t.author.recommendationsComingSoon}
        </div>
      </div>

    </div>
  );
}
