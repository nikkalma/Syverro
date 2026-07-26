import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../shared/api/client';
import { formatAuthorName } from '../../shared/utils/formatAuthorName';
import { bookPath } from '../../shared/utils/routes';
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
  slug?: string | null;
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
  padding: '6px 20px',
  fontFamily: 'Inter, sans-serif',
  fontSize: '13px',
  fontWeight: active ? '500' : '400',
  letterSpacing: '0.5px',
  cursor: 'default',
  color: active ? '#E6EDF3' : '#6E7C90',
  borderBottom: active ? '1.5px solid rgba(91,134,161,0.6)' : '1.5px solid transparent',
  transition: 'color 0.2s, border-color 0.2s',
});

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'Playfair Display, serif',
  fontSize: '20px',
  fontStyle: 'italic',
  fontWeight: 400,
  letterSpacing: '0.02em',
  color: '#D4C7B4',
  marginBottom: '16px',
};

const glassCardStyle: React.CSSProperties = {
  background: 'rgba(14, 26, 38, 0.6)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderRadius: '16px',
  border: '1px solid rgba(140, 170, 200, 0.08)',
  padding: '24px',
  height: '100%',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
};

const placeholderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  height: '140px',
  borderRadius: '16px',
  background: 'rgba(14, 26, 38, 0.4)',
  border: '1px dashed rgba(140, 170, 200, 0.1)',
  color: '#5B86A1',
  fontSize: '13px',
  fontStyle: 'italic',
};

const tagPillStyle: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: '14px',
  fontSize: '12px',
  display: 'inline-block',
  fontWeight: 400,
};

export default function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [author, setAuthor] = useState<AuthorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    apiClient.get<AuthorResponse>(`/authors/${slug}`)
      .then((res) => {
        setAuthor(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || err.message || 'Failed to load author');
        setLoading(false);
      });
  }, [slug]);

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
    <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '0 24px 80px' }}>

      {/* ──────── CINEMATIC HERO ──────── */}
      <div style={{
        width: '100%', height: '380px', borderRadius: '0 0 24px 24px', marginTop: 0,
        background: 'linear-gradient(145deg, #1A2832 0%, #0F1A22 40%, #0A1218 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 25% 35%, rgba(91,134,161,0.18) 0%, transparent 55%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 75% 65%, rgba(212,167,106,0.06) 0%, transparent 50%)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
          background: 'linear-gradient(to top, rgba(11,18,32,0.85) 0%, transparent 100%)',
        }} />
      </div>

      {/* ──────── HERO OVERLAY CONTENT ──────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: '28px',
        marginTop: '-108px', paddingLeft: '28px', position: 'relative', zIndex: 2,
      }}>
        <div style={{
          width: '140px', height: '140px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #2A4B60, #1A2832)',
          border: '3px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '52px', color: '#5B86A1',
          flexShrink: 0, overflow: 'hidden',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}>
          {author.photo_url ? (
            <img src={author.photo_url} alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div style={{ paddingBottom: '8px', flex: 1 }}>
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '42px', fontWeight: 400, color: '#E6EDF3',
            margin: 0, lineHeight: 1.15, letterSpacing: '0.01em',
          }}>
            {displayName}
          </h1>
          {showNative && (
            <div style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '18px', fontStyle: 'italic', color: '#6E7C90',
              marginTop: '4px', letterSpacing: '0.02em',
            }}>
              {author.native_name}
            </div>
          )}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px',
            fontSize: '13px', color: '#97A6BA', marginTop: '8px', opacity: 0.75,
          }}>
            {author.nationality && (
              <span style={{
                padding: '2px 10px', borderRadius: '10px',
                background: 'rgba(91,134,161,0.1)',
                border: '1px solid rgba(91,134,161,0.15)',
              }}>{author.nationality}</span>
            )}
            {author.birth_date && (
              <span style={{
                padding: '2px 10px', borderRadius: '10px',
                background: 'rgba(91,134,161,0.1)',
                border: '1px solid rgba(91,134,161,0.15)',
              }}>
                {author.birth_date}{author.death_date ? ` — ${author.death_date}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ──────── TAGS + SHORT DESCRIPTION ──────── */}
      <div style={{ paddingLeft: '28px', paddingRight: '28px', marginTop: '24px' }}>
        {shortDescription && (
          <p style={{
            fontSize: '14px', color: '#97A6BA', lineHeight: 1.7,
            margin: 0, marginBottom: '12px', maxWidth: '680px',
            fontStyle: 'italic', opacity: 0.8,
          }}>
            {shortDescription}
          </p>
        )}

        {hasTags && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {hasGenres && author.metadata.genres.map((g) => (
              <span key={g} style={{
                ...tagPillStyle, background: 'rgba(91,134,161,0.1)',
                color: '#7A9ABA', border: '1px solid rgba(91,134,161,0.15)',
              }}>{g}</span>
            ))}
            {hasThemes && author.metadata.themes.map((t) => (
              <span key={t} style={{
                ...tagPillStyle, background: 'rgba(212,167,106,0.08)',
                color: '#D4A76A', border: '1px solid rgba(212,167,106,0.15)',
              }}>{t}</span>
            ))}
            {hasMotifs && author.metadata.motifs.map((m) => (
              <span key={m} style={{
                ...tagPillStyle, background: 'rgba(196,122,122,0.08)',
                color: '#C47A7A', border: '1px solid rgba(196,122,122,0.15)',
              }}>{m}</span>
            ))}
          </div>
        )}
      </div>

      {/* ──────── AUTHOR NAVIGATION TABS ──────── */}
      <div style={{
        display: 'flex', gap: '4px', marginTop: '40px',
        paddingLeft: '28px', paddingRight: '28px',
        borderBottom: '1px solid rgba(140, 170, 200, 0.06)',
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
        gridTemplateColumns: '1.2fr 1fr 1fr',
        gap: '24px',
        marginTop: '32px',
        paddingLeft: '28px', paddingRight: '28px',
      }}>
        {/* About Author */}
        <div>
          <div style={sectionTitleStyle}>{t.author.aboutAuthor}</div>
          <div style={glassCardStyle}>
            {hasBio ? (
              <div>
                <p style={{
                  fontSize: '13px', color: '#97A6BA', lineHeight: 1.8,
                  margin: 0, whiteSpace: 'pre-wrap',
                }}>
                  {bioExpanded || !bioIsLong
                    ? author.biography
                    : author.biography!.slice(0, 300) + '...'}
                </p>
                {bioIsLong && (
                  <button
                    onClick={() => setBioExpanded(!bioExpanded)}
                    style={{
                      background: 'none', border: 'none', color: '#7A9ABA',
                      cursor: 'pointer', fontSize: '12px', marginTop: '10px', padding: 0,
                      fontFamily: 'Inter, sans-serif', fontStyle: 'italic',
                    }}
                  >
                    {bioExpanded ? t.author.showLess : t.author.readMore}
                  </button>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#5B86A1', margin: 0, fontStyle: 'italic' }}>{t.author.noBiography}</p>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div style={sectionTitleStyle}>{t.author.timeline}</div>
          <div style={placeholderStyle}>
            <span style={{ fontSize: '24px', opacity: 0.4 }}>📜</span>
            {t.author.timelineComingSoon}
          </div>
        </div>

        {/* Atmosphere */}
        <div>
          <div style={sectionTitleStyle}>{t.author.atmosphere}</div>
          <div style={glassCardStyle}>
            {hasThemes ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {author.metadata.themes.map((t) => (
                  <span key={t} style={{
                    ...tagPillStyle, background: 'rgba(212,167,106,0.08)',
                    color: '#D4A76A', border: '1px solid rgba(212,167,106,0.12)',
                  }}>{t}</span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#5B86A1', margin: 0, fontStyle: 'italic' }}>{t.author.noAtmosphere}</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Author Books | Quote */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        marginTop: '48px',
        paddingLeft: '28px', paddingRight: '28px',
      }}>
        {/* Author Books */}
        <div>
          <div style={sectionTitleStyle}>{t.author.authorBooks}</div>
          {author.books.length > 0 ? (
            <div style={{
              display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px',
              scrollSnapType: 'x mandatory',
            }}>
              {author.books.map((book) => (
                <div
                  key={book.id}
                  onClick={() => navigate(bookPath(book))}
                  style={{
                    flex: '0 0 160px', cursor: 'pointer', borderRadius: '12px', overflow: 'hidden',
                    background: 'rgba(14, 26, 38, 0.5)',
                    border: '1px solid rgba(140, 170, 200, 0.06)',
                    transition: 'border-color 0.2s, transform 0.2s',
                    scrollSnapAlign: 'start',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(91,134,161,0.2)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(140, 170, 200, 0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    width: '100%', aspectRatio: '2/3',
                    background: 'linear-gradient(145deg, #1A2832, #0F1A22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '36px', color: '#5B86A1',
                  }}>
                    {book.cover ? (
                      <img src={book.cover} alt={book.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ opacity: 0.2 }}>📖</span>
                    )}
                  </div>
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{
                      fontSize: '12px', color: '#D4C7B4', fontWeight: 400,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      lineHeight: 1.4,
                    }}>
                      {book.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={placeholderStyle}>
              <span style={{ fontSize: '24px', opacity: 0.4 }}>📚</span>
              {t.author.noBooks}
            </div>
          )}
        </div>

        {/* Quote */}
        <div>
          <div style={sectionTitleStyle}>{t.author.quote}</div>
          <div style={{
            ...placeholderStyle,
            height: 'auto', minHeight: '160px', padding: '32px 24px',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '28px', opacity: 0.3 }}>❝</span>
            <span style={{ fontStyle: 'italic' }}>{t.author.quoteComingSoon}</span>
          </div>
        </div>
      </div>

      {/* Row 3: Connections | Collections */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: '24px',
        marginTop: '48px',
        paddingLeft: '28px', paddingRight: '28px',
      }}>
        {/* Connections */}
        <div>
          <div style={sectionTitleStyle}>{t.author.connections}</div>
          <div style={{
            padding: '48px 32px', borderRadius: '16px', textAlign: 'center',
            background: 'rgba(14, 26, 38, 0.5)',
            border: '1px solid rgba(140, 170, 200, 0.06)',
            color: '#5B86A1', fontSize: '13px', fontStyle: 'italic',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.35 }}>🔮</div>
            {t.author.graphComingSoon}
          </div>
        </div>

        {/* Collections */}
        <div>
          <div style={sectionTitleStyle}>{t.author.collections}</div>
          <div style={placeholderStyle}>
            <span style={{ fontSize: '24px', opacity: 0.4 }}>📦</span>
            {t.author.collectionsComingSoon}
          </div>
        </div>
      </div>

      {/* ──────── BOTTOM: YOU MAY ALSO LIKE ──────── */}
      <div style={{
        marginTop: '48px',
        paddingLeft: '28px', paddingRight: '28px',
      }}>
        <div style={sectionTitleStyle}>{t.author.youMayAlsoLike}</div>
        <div style={{
          ...placeholderStyle,
          height: '180px',
        }}>
          <span style={{ fontSize: '28px', opacity: 0.3 }}>✨</span>
          <span style={{ fontStyle: 'italic' }}>{t.author.recommendationsComingSoon}</span>
        </div>
      </div>

    </div>
  );
}
