import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../shared/api/client';
import { formatAuthorName } from '../../shared/utils/formatAuthorName';
import { bookPath, formatDate } from '../../shared/utils/routes';
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
  hero_background_url?: string | null;
  books: AuthorBook[];
  metadata: AuthorMetadata;
}

const tabStyle = (active: boolean): React.CSSProperties => ({
  background: 'none',
  border: 'none',
  padding: '6px 20px',
  fontFamily: 'Inter, sans-serif',
  fontSize: '12px',
  fontWeight: active ? '500' : '400',
  letterSpacing: '0.8px',
  cursor: 'default',
  color: active ? '#E6EDF3' : '#6E7C90',
  borderBottom: active ? '1.5px solid rgba(212, 199, 180, 0.5)' : '1.5px solid transparent',
  transition: 'color 0.25s, border-color 0.25s',
  textTransform: 'uppercase' as const,
});

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'Cormorant Garamond, serif',
  fontSize: '22px',
  fontStyle: 'italic',
  fontWeight: 500,
  letterSpacing: '0.02em',
  color: '#D4C7B4',
  marginBottom: '20px',
};

const placeholderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  minHeight: '160px',
  borderRadius: '16px',
  background: 'rgba(14, 26, 38, 0.35)',
  border: '1px dashed rgba(140, 170, 200, 0.08)',
  color: '#6E7C90',
  fontSize: '13px',
  fontStyle: 'italic',
  padding: '32px 24px',
};

const tagPillStyle: React.CSSProperties = {
  padding: '5px 14px',
  borderRadius: '16px',
  fontSize: '12px',
  display: 'inline-block',
  fontWeight: 400,
  letterSpacing: '0.02em',
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
      <div style={{ width: '100%', padding: '40px 24px' }}>
        <div style={{ color: '#97A6BA', fontSize: '14px' }}>{t.author.loading}</div>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div style={{ width: '100%', padding: '40px 24px' }}>
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

  const heroBgImage = author.hero_background_url
    ? `linear-gradient(160deg, rgba(20,31,44,0.88) 0%, rgba(11,18,28,0.78) 40%, rgba(7,14,22,0.88) 100%), radial-gradient(ellipse at 20% 30%, rgba(91,134,161,0.18) 0%, transparent 55%), radial-gradient(ellipse at 75% 60%, rgba(212,167,106,0.08) 0%, transparent 50%), url(${author.hero_background_url})`
    : `linear-gradient(160deg, #141F2C 0%, #0B121C 35%, #070E16 100%)`;

  const lifetime = [
    author.birth_date && formatDate(author.birth_date),
    author.death_date && formatDate(author.death_date),
  ].filter(Boolean).join(' — ');

  return (
    <div style={{ width: '100%', padding: '0 24px 80px' }}>

      {/* ======================================================================= */}
      {/* HERO — archive-style literary profile                                  */}
      {/* Height ≈ 2× portrait height. Portrait bridges hero and content.          */}
      {/* ======================================================================= */}
      <div style={{
        position: 'relative',
      }}>
        <div style={{
          width: '100%', height: '320px', borderRadius: '0 0 24px 24px',
          position: 'relative', overflow: 'hidden',
          backgroundImage: heroBgImage,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
          {/* Warm glow overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 20% 30%, rgba(91,134,161,0.12) 0%, transparent 55%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 75% 60%, rgba(212,167,106,0.05) 0%, transparent 50%)',
          }} />
          {/* Decorative accent */}
          <div style={{
            position: 'absolute', top: '28%', left: '5%', right: '55%', height: '1px',
            background: 'linear-gradient(to right, rgba(212,199,180,0.1), transparent)',
          }} />
          {/* Bottom fade */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
            background: 'linear-gradient(to top, rgba(11,18,32,0.92) 0%, transparent 100%)',
          }} />

          {/* Hero name — inside the hero block, bottom area */}
          <div style={{
            position: 'absolute', bottom: '40px', left: '200px', right: '200px', zIndex: 2,
          }}>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '48px', fontWeight: 500, color: '#E6EDF3',
              margin: 0, lineHeight: 1.1, letterSpacing: '0.015em',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}>
              {displayName}
            </h1>
            {showNative && (
              <div style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '20px', fontStyle: 'italic', fontWeight: 400,
                color: '#8A9BAE', marginTop: '6px', letterSpacing: '0.03em',
              }}>
                {author.native_name}
              </div>
            )}
          </div>

          {/* Right metadata panel — floating glass inside hero */}
          {(author.nationality || author.birth_date) && (
            <div style={{
              position: 'absolute', bottom: '28px', right: '24px', zIndex: 2,
              padding: '16px 20px', minWidth: '150px',
              background: 'rgba(14, 26, 38, 0.5)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: '12px',
              border: '1px solid rgba(140, 170, 200, 0.06)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            }}>
              {author.nationality && (
                <div style={{
                  fontSize: '12px', color: '#97A6BA', letterSpacing: '0.03em',
                  padding: '3px 0',
                  borderBottom: author.birth_date ? '1px solid rgba(140,170,200,0.05)' : 'none',
                }}>
                  <span style={{
                    color: '#6E7C90', fontSize: '9px', textTransform: 'uppercase',
                    letterSpacing: '0.08em', display: 'block', marginBottom: '1px',
                  }}>Origin</span>
                  {author.nationality}
                </div>
              )}
              {author.birth_date && (
                <div style={{
                  fontSize: '12px', color: '#97A6BA', letterSpacing: '0.03em',
                  padding: '3px 0',
                }}>
                  <span style={{
                    color: '#6E7C90', fontSize: '9px', textTransform: 'uppercase',
                    letterSpacing: '0.08em', display: 'block', marginBottom: '1px',
                  }}>Lifespan</span>
                  {lifetime}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Portrait — bridges hero and content, 2/3 inside, 1/3 below */}
        <div style={{
          position: 'absolute', bottom: '-52px', left: '28px', zIndex: 3,
          width: '156px', height: '156px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #2A4B60, #182A38)',
          border: '3px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '56px', color: '#5B86A1',
          overflow: 'hidden',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
        }}>
          {author.photo_url ? (
            <img src={author.photo_url} alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
      </div>

      {/* ──────── DESCRIPTION + TAGS ──────── */}
      <div style={{
        paddingLeft: '204px', paddingRight: '28px', marginTop: '20px',
      }}>
        {shortDescription && (
          <p style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '15px', color: '#97A6BA', lineHeight: 1.7,
            margin: 0, marginBottom: '14px',
            maxWidth: '580px',
            fontStyle: 'italic', fontWeight: 400, opacity: 0.8,
          }}>
            {shortDescription}
          </p>
        )}

        {hasTags && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {hasGenres && author.metadata.genres.map((g) => (
              <span key={g} style={{
                ...tagPillStyle, background: 'rgba(91,134,161,0.08)',
                color: '#7A9ABA', border: '1px solid rgba(91,134,161,0.12)',
              }}>{g}</span>
            ))}
            {hasThemes && author.metadata.themes.map((t) => (
              <span key={t} style={{
                ...tagPillStyle, background: 'rgba(212,167,106,0.07)',
                color: '#D4A76A', border: '1px solid rgba(212,167,106,0.12)',
              }}>{t}</span>
            ))}
            {hasMotifs && author.metadata.motifs.map((m) => (
              <span key={m} style={{
                ...tagPillStyle, background: 'rgba(196,122,122,0.07)',
                color: '#C47A7A', border: '1px solid rgba(196,122,122,0.12)',
              }}>{m}</span>
            ))}
          </div>
        )}
      </div>

      {/* ──────── AUTHOR NAVIGATION TABS ──────── */}
      <div style={{
        display: 'flex', gap: '2px', marginTop: '40px',
        paddingLeft: '28px', paddingRight: '28px',
        borderBottom: '1px solid rgba(140, 170, 200, 0.05)',
      }}>
        <button style={tabStyle(true)}>{t.author.tabAbout}</button>
        <button style={tabStyle(false)}>{t.author.tabBooks}</button>
        <button style={tabStyle(false)}>{t.author.tabWorlds}</button>
        <button style={tabStyle(false)}>{t.author.tabConnections}</button>
        <button style={tabStyle(false)}>{t.author.tabQuotes}</button>
      </div>

      {/* ======================================================================= */}
      {/* CONTENT GRID                                                           */}
      {/* ======================================================================= */}

      {/* Row 1: About | Timeline | Atmosphere */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.3fr 1fr 1fr',
        gap: '24px',
        marginTop: '40px',
        paddingLeft: '28px', paddingRight: '28px',
      }}>
        {/* About */}
        <div>
          <div style={sectionTitleStyle}>{t.author.aboutAuthor}</div>
          <div style={{
            background: 'rgba(14, 26, 38, 0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(140, 170, 200, 0.06)',
            padding: '28px',
            height: '100%',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
          }}>
            {hasBio ? (
              <div>
                <p style={{
                  fontSize: '14px', color: '#A8B8C8', lineHeight: 1.85,
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
                      cursor: 'pointer', fontSize: '12px', marginTop: '12px', padding: 0,
                      fontFamily: 'Inter, sans-serif', fontStyle: 'italic',
                      letterSpacing: '0.03em',
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
          <div style={{
            ...placeholderStyle,
            minHeight: '180px',
            background: 'rgba(14, 26, 38, 0.3)',
            border: '1px solid rgba(140, 170, 200, 0.06)',
          }}>
            <span style={{ fontSize: '22px', opacity: 0.3 }}>📜</span>
            <span>{t.author.timelineComingSoon}</span>
          </div>
        </div>

        {/* Atmosphere */}
        <div>
          <div style={sectionTitleStyle}>{t.author.atmosphere}</div>
          <div style={{
            background: 'rgba(14, 26, 38, 0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(140, 170, 200, 0.06)',
            padding: '28px',
            minHeight: '180px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
          }}>
            {hasThemes ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-start' }}>
                {author.metadata.themes.map((t) => (
                  <span key={t} style={{
                    ...tagPillStyle,
                    padding: '6px 16px',
                    background: 'rgba(212,167,106,0.07)',
                    color: '#D4A76A',
                    border: '1px solid rgba(212,167,106,0.12)',
                    fontSize: '13px',
                  }}>{t}</span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#5B86A1', margin: 0, fontStyle: 'italic' }}>{t.author.noAtmosphere}</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Books | Quote */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '28px',
        marginTop: '56px',
        paddingLeft: '28px', paddingRight: '28px',
      }}>
        {/* Books */}
        <div>
          <div style={sectionTitleStyle}>{t.author.authorBooks}</div>
          {author.books.length > 0 ? (
            <div style={{
              display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px',
              scrollSnapType: 'x mandatory',
            }}>
              {author.books.map((book) => (
                <div
                  key={book.id}
                  onClick={() => navigate(bookPath(book))}
                  style={{
                    flex: '0 0 170px', cursor: 'pointer', borderRadius: '12px', overflow: 'hidden',
                    background: 'rgba(14, 26, 38, 0.4)',
                    border: '1px solid rgba(140, 170, 200, 0.05)',
                    transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s',
                    scrollSnapAlign: 'start',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(212,199,180,0.15)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(140, 170, 200, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.15)';
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
                  <div style={{ padding: '10px 14px 14px' }}>
                    <div style={{
                      fontSize: '12px', color: '#C8BAA6',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      lineHeight: 1.4, letterSpacing: '0.02em',
                    }}>
                      {book.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={placeholderStyle}>
              <span style={{ fontSize: '24px', opacity: 0.3 }}>📚</span>
              {t.author.noBooks}
            </div>
          )}
        </div>

        {/* Quote */}
        <div>
          <div style={sectionTitleStyle}>{t.author.quote}</div>
          <div style={{
            ...placeholderStyle,
            minHeight: '200px', padding: '36px 28px',
            justifyContent: 'center',
            background: 'rgba(14, 26, 38, 0.3)',
            border: '1px solid rgba(140, 170, 200, 0.06)',
          }}>
            <span style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '48px', color: '#5B86A1', opacity: 0.2,
              lineHeight: 0.5,
            }}>❝</span>
            <span style={{ fontStyle: 'italic', color: '#7A8D9E', marginTop: '-4px' }}>{t.author.quoteComingSoon}</span>
          </div>
        </div>
      </div>

      {/* Row 3: Connections | Collections */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr',
        gap: '28px',
        marginTop: '56px',
        paddingLeft: '28px', paddingRight: '28px',
      }}>
        {/* Connections */}
        <div>
          <div style={sectionTitleStyle}>{t.author.connections}</div>
          <div style={{
            padding: '56px 40px', borderRadius: '16px', textAlign: 'center',
            background: 'rgba(14, 26, 38, 0.4)',
            border: '1px solid rgba(140, 170, 200, 0.05)',
            color: '#6E7C90', fontSize: '13px', fontStyle: 'italic',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '14px', opacity: 0.3 }}>🔮</div>
            {t.author.graphComingSoon}
          </div>
        </div>

        {/* Collections */}
        <div>
          <div style={sectionTitleStyle}>{t.author.collections}</div>
          <div style={{
            ...placeholderStyle,
            minHeight: '180px',
          }}>
            <span style={{ fontSize: '24px', opacity: 0.3 }}>📦</span>
            {t.author.collectionsComingSoon}
          </div>
        </div>
      </div>

      {/* ──────── BOTTOM: YOU MAY ALSO LIKE ──────── */}
      <div style={{
        marginTop: '56px',
        paddingLeft: '28px', paddingRight: '28px',
      }}>
        <div style={sectionTitleStyle}>{t.author.youMayAlsoLike}</div>
        <div style={{
          ...placeholderStyle,
          minHeight: '200px',
          background: 'rgba(14, 26, 38, 0.3)',
          border: '1px solid rgba(140, 170, 200, 0.06)',
        }}>
          <span style={{ fontSize: '28px', opacity: 0.25 }}>✨</span>
          <span style={{ fontStyle: 'italic' }}>{t.author.recommendationsComingSoon}</span>
        </div>
      </div>

    </div>
  );
}
