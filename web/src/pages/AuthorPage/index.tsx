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

interface TimelineEvent {
  id: string;
  event_type: string;
  date_value: string;
  date_precision: string;
  label: string;
  description: string | null;
  place_name: string | null;
  source_title: string | null;
  extraction_source: string;
  confidence: number;
  status: string;
}

interface Quote {
  id: string;
  text: string;
  speaker: string | null;
  source_title: string | null;
  date_value: string | null;
  confidence: number;
  status: string;
}

interface Citizenship {
  id: string;
  state_name: string;
  from_date: string | null;
  to_date: string | null;
  notes: string | null;
  confidence: number;
  status: string;
}

interface Award {
  id: string;
  name: string;
  year: number | null;
  organization: string | null;
  work: string | null;
}

interface Source {
  id: string;
  title: string;
  source_type: string;
  url: string | null;
  citation: string | null;
}

interface KnowledgeRelation {
  id: string;
  node_name: string | null;
  node_type: string | null;
  relation_type: string;
  source: string | null;
  status: string;
}

interface GoldenMetadata {
  genres: string[];
  themes: string[];
  motifs: string[];
  literary_movements: string[];
  languages: string[];
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
  sort_name: string | null;
  nationality: string | null;
  ethnic_origin: string | null;
  cultural_identity: string | null;
  birth_name: string | null;
  pen_names: string[] | null;
  birth_date: string | null;
  death_date: string | null;
  birth_place: string | null;
  death_place: string | null;
  biography: string | null;
  hero_quote: string | null;
  about_summary: string | null;
  occupations: string[] | null;
  photo_url: string | null;
  hero_background_url?: string | null;
  author_intro_quote?: string | null;
  books: AuthorBook[];
  awards: Award[];
  timeline_events: TimelineEvent[];
  quotes: Quote[];
  citizenships: Citizenship[];
  sources: Source[];
  knowledge_relations: KnowledgeRelation[];
  metadata: GoldenMetadata;
}

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

const eventIcons: Record<string, string> = {
  birth: '✦',
  death: '✠',
  publication: '📖',
  military_service: '⚔',
  milestone: '◆',
};

function TimelineSection({ events, t }: { events: TimelineEvent[]; t: { timelineEmpty: string } }) {
  if (events.length === 0) {
    return (
      <div style={placeholderStyle}>
        <span style={{ fontSize: '22px', opacity: 0.3 }}>📜</span>
        <span>{t.timelineEmpty}</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {events.map((ev) => (
        <div key={ev.id} style={{
          display: 'flex', gap: '12px', padding: '12px 16px',
          borderRadius: '12px', background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
            background: 'var(--glass-bg)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '14px',
            border: '1px solid var(--glass-border)',
          }}>
            {eventIcons[ev.event_type] || '•'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
              {ev.date_value}
              {ev.place_name ? ` — ${ev.place_name}` : ''}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' }}>
              {ev.label}
            </div>
            {ev.description && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {ev.description}
              </div>
            )}
            {ev.source_title && (
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                {ev.source_title}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function QuotesSection({ quotes, t }: { quotes: Quote[]; t: any }) {
  if (quotes.length === 0) {
    return (
      <div style={placeholderStyle}>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '48px', color: 'var(--primary)', opacity: 0.2, lineHeight: 0.5 }}>❝</span>
        <span style={{ fontStyle: 'italic' }}>{t.quotesEmpty}</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {quotes.map((q) => (
        <div key={q.id} style={{
          padding: '20px 24px', borderRadius: '12px',
          background: 'var(--surface)', border: '1px solid var(--border)',
        }}>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '36px', color: 'var(--primary)', opacity: 0.2,
            lineHeight: 0.5, marginBottom: '4px',
          }}>❝</div>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '15px', color: 'var(--text-muted)', fontStyle: 'italic',
            lineHeight: 1.6, marginBottom: '8px',
          }}>
            {q.text}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {q.speaker && <span>{q.speaker}</span>}
            {q.source_title && <span> — {q.source_title}</span>}
            {q.date_value && <span> ({q.date_value})</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function AwardsSection({ awards, t }: { awards: Award[]; t: { awardsEmpty: string } }) {
  if (awards.length === 0) {
    return (
      <div style={placeholderStyle}>
        <span style={{ fontSize: '24px', opacity: 0.3 }}>🏆</span>
        <span>{t.awardsEmpty}</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {awards.map((a) => (
        <div key={a.id} style={{
          padding: '12px 16px', borderRadius: '10px',
          background: 'var(--surface)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{a.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {[a.organization, a.year].filter(Boolean).join(', ')}
            {a.work ? ` — ${a.work}` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

function CitizenshipsSection({ citizenships }: { citizenships: Citizenship[] }) {
  if (citizenships.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {citizenships.map((c) => (
        <div key={c.id} style={{
          padding: '10px 14px', borderRadius: '10px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          fontSize: '13px',
        }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.state_name}</span>
          <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
            {c.from_date}{c.to_date ? ` — ${c.to_date}` : ''}
          </span>
          {c.notes && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{c.notes}</div>}
        </div>
      ))}
    </div>
  );
}

function KnowledgeSection({ relations, t }: { relations: KnowledgeRelation[]; t: { connectionsEmpty: string } }) {
  if (relations.length === 0) {
    return (
      <div style={placeholderStyle}>
        <span style={{ fontSize: '28px', opacity: 0.25 }}>🔮</span>
        <span>{t.connectionsEmpty}</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {relations.map((r) => (
        <div key={r.id} style={{
          ...tagPillStyle,
          background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
          color: 'var(--primary)',
          border: '1px solid color-mix(in srgb, var(--primary) 12%, transparent)',
          fontSize: '11px',
        }}>
          {r.node_name || r.relation_type}
        </div>
      ))}
    </div>
  );
}

function SourcesSection({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {sources.map((s) => (
        <div key={s.id} style={{
          padding: '12px 16px', borderRadius: '10px',
          background: 'var(--surface)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                {s.title}
              </a>
            ) : s.title}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {s.source_type}
            {s.citation ? ` — ${s.citation}` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

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
        setAuthor({
          ...res.data,
          books: res.data.books ?? [],
          awards: res.data.awards ?? [],
          timeline_events: res.data.timeline_events ?? [],
          quotes: res.data.quotes ?? [],
          citizenships: res.data.citizenships ?? [],
          sources: res.data.sources ?? [],
          knowledge_relations: res.data.knowledge_relations ?? [],
          metadata: {
            genres: res.data.metadata?.genres ?? [],
            themes: res.data.metadata?.themes ?? [],
            motifs: res.data.metadata?.motifs ?? [],
            literary_movements: res.data.metadata?.literary_movements ?? [],
            languages: res.data.metadata?.languages ?? [],
          },
        });
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
  const hasLiteraryMovements = author.metadata.literary_movements.length > 0;
  const hasTags = hasGenres || hasThemes || hasMotifs || hasLiteraryMovements;

  const heroBgImage = author.hero_background_url
    ? `var(--hero-overlay), var(--hero-glow-1), var(--hero-glow-2), url(${author.hero_background_url})`
    : 'linear-gradient(160deg, var(--surface) 0%, var(--bg) 35%, var(--bg) 100%)';

  const formattedBirth = author.birth_date ? formatDate(author.birth_date) : null;
  const formattedDeath = author.death_date ? formatDate(author.death_date) : null;
  const professions = author.occupations && author.occupations.length > 0
    ? author.occupations.join(' / ')
    : null;

  const hasCitizenships = author.citizenships.length > 0;
  const hasSources = author.sources.length > 0;

  const metadataRows = [
    author.nationality && { label: t.author.metaOrigin, value: author.nationality },
    author.ethnic_origin && { label: t.author.metaEthnicOrigin, value: author.ethnic_origin },
    author.cultural_identity && { label: t.author.metaCulturalIdentity, value: author.cultural_identity },
    author.metadata.literary_movements.length > 0 && {
      label: t.author.metaMovements,
      value: author.metadata.literary_movements.join(' / '),
    },
    author.metadata.languages.length > 0 && {
      label: t.author.metaLanguages,
      value: author.metadata.languages.join(', '),
    },
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

      {/* HERO */}
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

      {/* FEATURED QUOTE + TAGS */}
      <div style={{ paddingLeft: '204px', paddingRight: '28px', marginTop: '20px' }}>
        {(author.hero_quote || author.about_summary) && (
          <div style={{
            marginBottom: '12px', maxWidth: '580px',
            padding: '20px 24px', borderRadius: '12px',
            background: 'var(--surface)', border: '1px solid var(--border)',
          }}>
            {author.hero_quote && (
              <>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '13px', fontWeight: 500,
                  color: 'var(--accent)', letterSpacing: '0.06em',
                  textTransform: 'uppercase', marginBottom: '10px',
                }}>
                  {t.author.heroQuote}
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
                  {author.hero_quote}
                </div>
              </>
            )}
            {author.about_summary && !author.hero_quote && (
              <div style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '15px', color: 'var(--text-muted)', fontStyle: 'italic',
                lineHeight: 1.6,
              }}>
                {author.about_summary}
              </div>
            )}
          </div>
        )}

        {hasTags && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {hasGenres && author.metadata.genres.map((g) => (
              <span key={g} style={{
                ...tagPillStyle, background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 15%, transparent)',
              }}>{g}</span>
            ))}
            {hasLiteraryMovements && author.metadata.literary_movements.map((lm) => (
              <span key={lm} style={{
                ...tagPillStyle, background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
              }}>{lm}</span>
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

      {/* CONTENT GRID */}
      <div style={{ paddingLeft: '28px', paddingRight: '28px' }}>

        {/* Row 1: About | Timeline | Citizenships */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr 1fr 1fr',
          gap: '24px',
          marginTop: '40px',
        }}>
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

          <div>
            <div style={sectionTitleStyle}>{t.author.timeline}</div>
            <TimelineSection events={author.timeline_events} t={t.author} />
          </div>

          <div>
            <div style={sectionTitleStyle}>{t.author.citizenships}</div>
            {hasCitizenships ? (
              <CitizenshipsSection citizenships={author.citizenships} />
            ) : (
              <div style={{ ...placeholderStyle, minHeight: '120px' }}>
                <span style={{ fontSize: '22px', opacity: 0.3 }}>🪪</span>
                <span>{t.author.citizenshipsEmpty}</span>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Awards | Quotes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '28px',
          marginTop: '56px',
        }}>
          <div>
            <div style={sectionTitleStyle}>{t.author.awards}</div>
            <AwardsSection awards={author.awards} t={t.author} />
          </div>

          <div>
            <div style={sectionTitleStyle}>{t.author.quotes}</div>
            <QuotesSection quotes={author.quotes} t={t.author} />
          </div>
        </div>

        {/* Row 3: Books | Connections */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: '28px',
          marginTop: '56px',
        }}>
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

          <div>
            <div style={sectionTitleStyle}>{t.author.connections}</div>
            <KnowledgeSection relations={author.knowledge_relations} t={t.author} />
          </div>
        </div>

        {/* Sources / References */}
        {hasSources && (
          <div style={{ marginTop: '56px' }}>
            <div style={sectionTitleStyle}>{t.author.sources}</div>
            <SourcesSection sources={author.sources} />
          </div>
        )}

        {/* You May Also Like */}
        <div style={{ marginTop: '56px' }}>
          <div style={sectionTitleStyle}>{t.author.youMayAlsoLike}</div>
          <div style={{
            ...placeholderStyle,
            minHeight: '120px',
            border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '28px', opacity: 0.25 }}>✨</span>
            <span style={{ fontStyle: 'italic' }}>{t.author.recommendationsEmpty}</span>
          </div>
        </div>

      </div>

    </div>
  );
}