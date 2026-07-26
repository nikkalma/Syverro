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
  birth_place: string | null;
  death_place: string | null;
  occupations: string[] | null;
  biography: string | null;
  photo_url: string | null;
  hero_background_url?: string | null;
  author_intro_quote?: string | null;
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
  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
  borderBottom: active ? '1.5px solid var(--accent)' : '1.5px solid transparent',
  transition: 'color 0.25s, border-color 0.25s',
  textTransform: 'uppercase' as const,
});

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'Cormorant Garamond, serif',
  fontSize: '22px',
  fontStyle: 'italic',
  fontWeight: 500,
  letterSpacing: '0.02em',
  color: 'var(--accent)',
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
  background: 'var(--surface)',
  border: '1px dashed var(--border)',
  color: 'var(--text-muted)',
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

const glassCardStyle: React.CSSProperties = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  borderRadius: '16px',
  border: '1px solid var(--glass-border)',
  padding: '28px',
  height: '100%',
  boxShadow: 'var(--glass-shadow)',
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
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t.author.loading}</div>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div style={{ width: '100%', padding: '40px 24px' }}>
        <div style={{
          padding: '40px', textAlign: 'center', color: 'var(--error)',
          background: 'var(--glass-bg)', borderRadius: '12px',
          border: '1px solid var(--glass-border)',
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

  const hasGenres = author.metadata.genres.length > 0;
  const hasThemes = author.metadata.themes.length > 0;
  const hasMotifs = author.metadata.motifs.length > 0;
  const hasTags = hasGenres || hasThemes || hasMotifs;

  const heroBgImage = author.hero_background_url
    ? `var(--hero-overlay), var(--hero-glow-1), var(--hero-glow-2), url(${author.hero_background_url})`
    : 'linear-gradient(160deg, var(--surface) 0%, var(--bg) 35%, var(--bg) 100%)';

  const formattedBirth = author.birth_date ? formatDate(author.birth_date) : null;
  const formattedDeath = author.death_date ? formatDate(author.death_date) : null;
  const professions = author.occupations && author.occupations.length > 0
    ? author.occupations.join(' / ')
    : null;

  const metadataRows = [
    author.nationality && { label: t.author.metaOrigin, value: author.nationality },
    (author.birth_place || formattedBirth) && {
      label: t.author.metaBorn,
      value: [formattedBirth, author.birth_place].filter(Boolean).join('\n'),
    },
    (author.death_place || formattedDeath) && {
      label: t.author.metaDied,
      value: [formattedDeath, author.death_place].filter(Boolean).join('\n'),
    },
    professions && { label: t.author.metaProfessions, value: professions },
    { label: t.author.metaWorks, value: String(author.books.length) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div style={{ width: '100%', padding: '0 24px 80px' }}>

      {/* ======================================================================= */}
      {/* HERO                                                                    */}
      {/* ======================================================================= */}
      <div style={{ position: 'relative', paddingTop: '60px' }}>
        <div style={{
          width: '100%', height: '380px', borderRadius: '0 0 24px 24px',
          position: 'relative', overflow: 'hidden',
          backgroundImage: heroBgImage,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 20% 30%, rgba(91,134,161,0.12) 0%, transparent 55%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 75% 60%, rgba(212,167,106,0.05) 0%, transparent 50%)',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
            background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)',
          }} />

          {/* Hero name */}
          <div style={{
            position: 'absolute', bottom: '60px', left: '200px', right: '200px', zIndex: 2,
          }}>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '48px', fontWeight: 500, color: 'var(--text-primary)',
              margin: 0, lineHeight: 1.1, letterSpacing: '0.015em',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}>
              {displayName}
            </h1>
            {showNative && (
              <div style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '20px', fontStyle: 'italic', fontWeight: 400,
                color: 'var(--text-muted)', marginTop: '6px', letterSpacing: '0.03em',
              }}>
                {author.native_name}
              </div>
            )}
          </div>

          {/* Expanded metadata panel — entity passport */}
          <div style={{
            position: 'absolute', bottom: '60px', right: '24px', zIndex: 2,
            padding: '20px 28px', minWidth: '340px',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '14px',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
          }}>
            {metadataRows.map((row, i) => (
              <div key={i} style={{
                padding: '6px 0',
                borderBottom: i < metadataRows.length - 1 ? '1px solid var(--glass-border)' : 'none',
                marginBottom: i < metadataRows.length - 1 ? '6px' : '0',
              }}>
                <span style={{
                  color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase',
                  letterSpacing: '0.1em', display: 'block', marginBottom: '2px',
                }}>
                  {row.label}
                </span>
                <span style={{
                  fontSize: '13px', color: 'var(--text-primary)', letterSpacing: '0.02em',
                  lineHeight: 1.5, display: 'block', whiteSpace: 'pre-line',
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Portrait — bridges hero and content */}
        <div style={{
          position: 'absolute', bottom: '-52px', left: '28px', zIndex: 3,
          width: '156px', height: '156px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary-soft), var(--surface))',
          border: '3px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '56px', color: 'var(--primary)',
          overflow: 'hidden',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          boxShadow: 'var(--glass-shadow)',
        }}>
          {author.photo_url ? (
            <img src={author.photo_url} alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
      </div>

      {/* ──────── QUOTES ABOUT AUTHOR + TAGS ──────── */}
      <div style={{ paddingLeft: '204px', paddingRight: '28px', marginTop: '20px' }}>
        <div style={{
          marginBottom: '12px', maxWidth: '580px',
          padding: '20px 24px', borderRadius: '12px',
          background: 'var(--surface)', border: '1px solid var(--border)',
        }}>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '13px', fontWeight: 500,
            color: 'var(--accent)', letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: '10px',
          }}>
            {t.author.quotesAboutTitle}
          </div>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '36px', color: 'var(--primary)', opacity: 0.2,
            lineHeight: 0.5, marginBottom: '4px',
          }}>❝</div>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '15px', color: 'var(--text-muted)', fontStyle: 'italic',
            lineHeight: 1.6,
          }}>
            {t.author.noQuotesAbout}
          </div>
        </div>

        {hasTags && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {hasGenres && author.metadata.genres.map((g) => (
              <span key={g} style={{
                ...tagPillStyle, background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 15%, transparent)',
              }}>{g}</span>
            ))}
            {hasThemes && author.metadata.themes.map((t) => (
              <span key={t} style={{
                ...tagPillStyle, background: 'color-mix(in srgb, var(--warning) 8%, transparent)',
                color: 'var(--warning)', border: '1px solid color-mix(in srgb, var(--warning) 12%, transparent)',
              }}>{t}</span>
            ))}
            {hasMotifs && author.metadata.motifs.map((m) => (
              <span key={m} style={{
                ...tagPillStyle, background: 'color-mix(in srgb, var(--error) 8%, transparent)',
                color: 'var(--error)', border: '1px solid color-mix(in srgb, var(--error) 12%, transparent)',
              }}>{m}</span>
            ))}
          </div>
        )}
      </div>

      {/* ──────── TABS ──────── */}
      <div style={{
        display: 'flex', gap: '2px', marginTop: '40px',
        paddingLeft: '28px', paddingRight: '28px',
        borderBottom: '1px solid var(--border)',
      }}>
        <button style={tabStyle(true)}>{t.author.tabAbout}</button>
        <button style={tabStyle(false)}>{t.author.tabBooks}</button>
        <button style={tabStyle(false)}>{t.author.tabWorlds}</button>
        <button style={tabStyle(false)}>{t.author.tabConnections}</button>
        <button style={tabStyle(false)}>{t.author.tabQuotes}</button>
      </div>

      {/* ======================================================================= */}
      {/* CONTENT                                                                  */}
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
          <div style={glassCardStyle}>
            {hasBio ? (
              <div>
                <p style={{
                  fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.85,
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
                      background: 'none', border: 'none', color: 'var(--primary)',
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
              <p style={{ fontSize: '13px', color: 'var(--primary)', margin: 0, fontStyle: 'italic' }}>{t.author.noBiography}</p>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div style={sectionTitleStyle}>{t.author.timeline}</div>
          <div style={{
            ...placeholderStyle,
            minHeight: '180px',
            border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '22px', opacity: 0.3 }}>📜</span>
            <span>{t.author.timelineComingSoon}</span>
          </div>
        </div>

        {/* Atmosphere */}
        <div>
          <div style={sectionTitleStyle}>{t.author.atmosphere}</div>
          <div style={{
            ...glassCardStyle,
            minHeight: '180px',
          }}>
            {hasThemes ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-start' }}>
                {author.metadata.themes.map((t) => (
                  <span key={t} style={{
                    ...tagPillStyle,
                    padding: '6px 16px',
                    background: 'color-mix(in srgb, var(--warning) 8%, transparent)',
                    color: 'var(--warning)',
                    border: '1px solid color-mix(in srgb, var(--warning) 12%, transparent)',
                    fontSize: '13px',
                  }}>{t}</span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--primary)', margin: 0, fontStyle: 'italic' }}>{t.author.noAtmosphere}</p>
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
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s',
                    scrollSnapAlign: 'start',
                    boxShadow: 'var(--glass-shadow)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
                  }}
                >
                  <div style={{
                    width: '100%', aspectRatio: '2/3',
                    background: 'linear-gradient(145deg, var(--surface), var(--bg))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '36px', color: 'var(--primary)',
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
                      fontSize: '12px', color: 'var(--accent)',
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
            border: '1px solid var(--border)',
          }}>
            <span style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '48px', color: 'var(--primary)', opacity: 0.2,
              lineHeight: 0.5,
            }}>❝</span>
            <span style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '-4px' }}>{t.author.quoteComingSoon}</span>
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
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: 'var(--glass-shadow)',
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
          border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: '28px', opacity: 0.25 }}>✨</span>
          <span style={{ fontStyle: 'italic' }}>{t.author.recommendationsComingSoon}</span>
        </div>
      </div>

    </div>
  );
}
