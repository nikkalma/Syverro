import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  quote_type?: string;
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
  author_slug?: string | null;
}

interface GoldenMetadata {
  genres: string[];
  themes: string[];
  motifs: string[];
  concepts: string[];
  atmospheres: string[];
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
  pseudonyms: string[] | null;
  birth_date: string | null;
  death_date: string | null;
  birth_place: string | null;
  birth_place_region: string | null;
  birth_place_country: string | null;
  death_place: string | null;
  death_place_region: string | null;
  death_place_country: string | null;
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

const relationsLabelsEn: Record<string, string> = {
  influenced_by: 'Influenced by', influenced: 'Influenced',
  contemporary_of: 'Contemporary of', collaborated_with: 'Collaborated with',
  relative_of: 'Relative of', friend_of: 'Friend of', mentor_of: 'Mentor of',
  student_of: 'Student of', literary_movement: 'Movement', identity: 'Identity',
  work: 'Work', character: 'Character',
};
const relationsLabelsRu: Record<string, string> = {
  influenced_by: 'Под влиянием', influenced: 'Повлиял на',
  contemporary_of: 'Современник', collaborated_with: 'Сотрудничал',
  relative_of: 'Родственник', friend_of: 'Друг', mentor_of: 'Наставник',
  student_of: 'Ученик', literary_movement: 'Направление', identity: 'Псевдоним',
  work: 'Произведение', character: 'Персонаж',
};

function TimelineSection({ events, t }: { events: TimelineEvent[]; t: any }) {
  const [expanded, setExpanded] = useState(false);
  const INITIAL_SHOW = 3;
  const showAll = expanded || events.length <= INITIAL_SHOW;
  const visibleEvents = showAll ? events : events.slice(0, INITIAL_SHOW);

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
      {visibleEvents.map((ev) => (
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
      {events.length > INITIAL_SHOW && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none', border: '1px solid var(--glass-border)',
            borderRadius: '8px', padding: '8px 16px', cursor: 'pointer',
            fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic',
            alignSelf: 'flex-start',
          }}
        >
          {expanded ? t.showLess || 'Collapse timeline' : `${t.readMore || 'Show full timeline'} (${events.length})`}
        </button>
      )}
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

export default function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [author, setAuthor] = useState<AuthorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bioModalOpen, setBioModalOpen] = useState(false);

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
            concepts: res.data.metadata?.concepts ?? [],
            atmospheres: res.data.metadata?.atmospheres ?? [],
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
  const localRelationLabels = getBrowserLocale()?.startsWith('ru') ? relationsLabelsRu : relationsLabelsEn;

function localizeField(value: string | null | undefined, map: Record<string, string>): string | null {
  if (!value) return null;
  return map[value.toLowerCase()] || value;
}

function formatPlace(place: string | null | undefined, region: string | null | undefined, country: string | null | undefined): string {
  if (!place) return '';
  const parts = [place];
  if (region && region !== place) parts.push(region);
  if (country && country !== place && country !== region) parts.push(localizeField(country, countryMap) || country);
  return parts.join(', ');
}

function formatLiteraryMovement(value: string): string {
  let result = value.charAt(0).toUpperCase() + value.slice(1);
  result = result.replace(/\b([ivxlcdm]+)\b/gi, (m) => m.toUpperCase());
  return result;
}

function BiographyModal({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000, padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)', borderRadius: '16px',
          border: '1px solid var(--glass-border)',
          maxWidth: '680px', width: '100%', maxHeight: '80vh',
          overflowY: 'auto', padding: '32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '20px',
            fontWeight: 500, color: 'var(--accent)',
          }}>Биография</div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: '20px', cursor: 'pointer', padding: '0 4px',
          }}>✕</button>
        </div>
        <div style={{
          fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.85,
          whiteSpace: 'pre-wrap',
        }}>
          {text}
        </div>
      </div>
    </div>
  );
}

const nationalityMap: Record<string, string> = {
  english: 'англичанка',
  russian: 'русская',
  french: 'француженка',
  german: 'немка',
  italian: 'итальянка',
  spanish: 'испанка',
  american: 'американка',
  british: 'британка',
  irish: 'ирландка',
  scottish: 'шотландка',
  dutch: 'голландка',
  polish: 'полька',
  japanese: 'японка',
  chinese: 'китаянка',
  indian: 'индианка',
  swedish: 'шведка',
  norwegian: 'норвежка',
  danish: 'датчанка',
  greek: 'гречанка',
  turkish: 'турчанка',
  australian: 'австралийка',
  canadian: 'канадка',
  mexican: 'мексиканка',
  brazilian: 'бразильянка',
  portuguese: 'португалка',
  belgian: 'бельгийка',
  swiss: 'швейцарка',
  austrian: 'австрийка',
  czech: 'чешка',
  hungarian: 'венгерка',
  romanian: 'румынка',
  ukrainian: 'украинка',
  belarusian: 'белоруска',
  kazakh: 'казашка',
  albanian: 'албанка',
  croatian: 'хорватка',
  serbian: 'сербка',
  bulgarian: 'болгарка',
  finnish: 'финка',
  icelandic: 'исландка',
  persian: 'персиянка',
  arabic: 'арабка',
  hebrew: 'еврейка',
  armenian: 'армянка',
  georgian: 'грузинка',
  afghan: 'афганка',
};

const ethnicOriginMap: Record<string, string> = {
  english: 'англичане',
  russian: 'русские',
  french: 'французы',
  german: 'немцы',
  italian: 'итальянцы',
  spanish: 'испанцы',
  american: 'американцы',
  british: 'британцы',
  irish: 'ирландцы',
  scottish: 'шотландцы',
  dutch: 'голландцы',
  polish: 'поляки',
  japanese: 'японцы',
  chinese: 'китайцы',
  indian: 'индийцы',
  jewish: 'евреи',
  celtic: 'кельты',
  scandinavian: 'скандинавы',
  slavic: 'славяне',
  germanic: 'германцы',
  latin: 'латиняне',
};

const culturalIdentityMap: Record<string, string> = {
  'victorian english literature / english literary tradition': 'викторианская английская литература / английская литературная традиция',
  'victorian english literature': 'викторианская английская литература',
  'english literary tradition': 'английская литературная традиция',
  'russian literature': 'русская литература',
  'soviet literature': 'советская литература',
  'french literature': 'французская литература',
  'american literature': 'американская литература',
};

const countryMap: Record<string, string> = {
  'united kingdom': 'Великобритания',
  england: 'Англия',
  scotland: 'Шотландия',
  ireland: 'Ирландия',
  wales: 'Уэльс',
  russia: 'Россия',
  'russian federation': 'Россия',
  'ussr': 'СССР',
  france: 'Франция',
  germany: 'Германия',
  italy: 'Италия',
  spain: 'Испания',
  usa: 'США',
  'united states': 'США',
};


const literaryMovementMap: Record<string, string> = {
  'victorian literature': 'викторианская литература',
  'english literature': 'английская литература',
  'romanticism': 'романтизм',
  'realism': 'реализм',
  'modernism': 'модернизм',
  'postmodernism': 'постмодернизм',
  'gothic fiction': 'готическая литература',
  'gothic literature': 'готическая литература',
  'naturalism': 'натурализм',
  'symbolism': 'символизм',
  'existentialism': 'экзистенциализм',
  'surrealism': 'сюрреализм',
  'classicism': 'классицизм',
  'sentimentalism': 'сентиментализм',
  'baroque': 'барокко',
  'renaissance': 'возрождение',
  'medieval literature': 'средневековая литература',
  'enlightenment': 'просвещение',
  'neoclassicism': 'неоклассицизм',
  'transcendentalism': 'трансцендентализм',
  'aestheticism': 'эстетизм',
  'decadence': 'декаданс',
  'futurism': 'футуризм',
  'impressionism': 'импрессионизм',
  'expressionism': 'экспрессионизм',
  'absurdism': 'абсурдизм',
  'magic realism': 'магический реализм',
  'socialist realism': 'социалистический реализм',
  'postcolonial literature': 'постколониальная литература',
};

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

  const heroBgImage = author.hero_background_url
    ? `var(--hero-overlay), var(--hero-glow-1), var(--hero-glow-2), url(${author.hero_background_url})`
    : 'linear-gradient(160deg, var(--surface) 0%, var(--bg) 35%, var(--bg) 100%)';

  const formattedBirth = author.birth_date ? formatDate(author.birth_date) : null;
  const formattedDeath = author.death_date ? formatDate(author.death_date) : null;
  const professions = author.occupations && author.occupations.length > 0
    ? author.occupations.join(' / ')
    : null;

  const localizedNationality = localizeField(author.nationality, nationalityMap);
  const localizedEthnicOrigin = localizeField(author.ethnic_origin, ethnicOriginMap);
  const localizedCulturalIdentity = localizeField(author.cultural_identity, culturalIdentityMap);
  const localizedMovements = (author.metadata?.literary_movements || [])
    .map((m) => localizeField(m, literaryMovementMap))
    .filter(Boolean)
    .map((m) => formatLiteraryMovement(m!))
    .join(', ');

  const birthPlaceFull = formatPlace(author.birth_place, author.birth_place_region, author.birth_place_country);
  const deathPlaceFull = formatPlace(author.death_place, author.death_place_region, author.death_place_country);

  const alternativeNames = [
    ...(author.pen_names || []),
    ...(author.pseudonyms || []),
  ].filter((n) => n && n.trim()).map((n) => n.trim());

  const metadataRows = [
    author.nationality && { label: t.author.metaOrigin, value: localizedNationality || author.nationality },
    author.ethnic_origin && { label: t.author.metaEthnicOrigin, value: localizedEthnicOrigin || author.ethnic_origin },
    author.cultural_identity && { label: t.author.metaCulturalIdentity, value: localizedCulturalIdentity || author.cultural_identity },
    localizedMovements && { label: t.author.metaMovements, value: localizedMovements },
    (author.birth_place || formattedBirth) && {
      label: t.author.metaBorn,
      value: [formattedBirth, birthPlaceFull].filter(Boolean).join('\n'),
    },
    (author.death_place || formattedDeath) && {
      label: t.author.metaDied,
      value: [formattedDeath, deathPlaceFull].filter(Boolean).join('\n'),
    },
    professions && { label: t.author.metaProfessions, value: professions },
    alternativeNames.length > 0 && { label: t.author.metaAltNames, value: alternativeNames.join(', ') },
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

      </div>

      {/* CONTENT GRID */}
      <div style={{ paddingLeft: '28px', paddingRight: '28px' }}>

        {/* Row 1: About | Timeline */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr 1fr',
          gap: '24px',
          marginTop: '40px',
        }}>
          <div>
            <div style={sectionTitleStyle}>{t.author.aboutAuthor}</div>
            <div style={glassCardStyle}>
              {author.about_summary && (
                <div style={{
                  fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic',
                  lineHeight: 1.7, marginBottom: '16px', paddingBottom: '16px',
                  borderBottom: '1px solid var(--glass-border)',
                }}>
                  {author.about_summary}
                </div>
              )}
              {hasBio && (
                <button
                  onClick={() => setBioModalOpen(true)}
                  style={{
                    background: 'none', border: '1px solid var(--glass-border)',
                    borderRadius: '8px', padding: '8px 18px', cursor: 'pointer',
                    fontSize: '13px', color: 'var(--accent)', fontStyle: 'italic',
                    fontFamily: 'Inter, sans-serif', marginTop: '4px',
                  }}
                >
                  {t.author.readMore}
                </button>
              )}
            </div>
          </div>

          <div>
            <div style={sectionTitleStyle}>{t.author.timeline}</div>
            <TimelineSection events={author.timeline_events} t={t.author} />
          </div>
        </div>

        {/* Row 2: Connections */}
        {author.knowledge_relations && author.knowledge_relations.length > 0 && (
          <div style={{ marginTop: '56px' }}>
            <div>
              <div style={sectionTitleStyle}>{t.author.connections}</div>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px',
              }}>
                {author.knowledge_relations.map((rel) => {
                  const isLinkedAuthor = rel.author_slug && rel.node_type === 'person';
                  const chip = (
                    <div key={rel.id} style={{
                      padding: '8px 14px', borderRadius: '20px',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      fontSize: '12px', color: 'var(--text-primary)',
                    }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        {localRelationLabels[rel.relation_type] || rel.relation_type}
                      </span>
                      {' '}
                      <span style={{ fontWeight: 500 }}>{rel.node_name}</span>
                    </div>
                  );
                  return isLinkedAuthor ? (
                    <Link
                      key={rel.id}
                      to={`/author/${rel.author_slug}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      {chip}
                    </Link>
                  ) : chip;
                })}
              </div>
            </div>
          </div>
        )}

        {/* Awards */}
        {author.awards.length > 0 && (
          <div style={{ marginTop: '56px' }}>
            <div>
              <div style={sectionTitleStyle}>{t.author.awards}</div>
              <AwardsSection awards={author.awards} t={t.author} />
            </div>
          </div>
        )}

        {/* Quotes */}
        {(author.quotes?.filter((q) => (q as any).quote_type !== 'about_author').length > 0) && (
          <div style={{ marginTop: '56px' }}>
            <div>
              <div style={sectionTitleStyle}>{t.author.quotes}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {author.quotes.filter((q) => (q as any).quote_type !== 'about_author').map((q) => (
                  <div key={q.id} style={{
                    padding: '16px 20px', borderRadius: '12px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '15px', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '6px' }}>
                      &ldquo;{q.text}&rdquo;
                    </div>
                    {q.speaker && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>— {q.speaker}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {author.quotes?.filter((q) => (q as any).quote_type === 'about_author').length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <div>
              <div style={sectionTitleStyle}>{t.author.quotesAboutTitle || 'About author'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {author.quotes.filter((q) => (q as any).quote_type === 'about_author').map((q) => (
                  <div key={q.id} style={{
                    padding: '16px 20px', borderRadius: '12px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '15px', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '6px' }}>
                      &ldquo;{q.text}&rdquo;
                    </div>
                    {q.speaker && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>— {q.speaker}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Books */}
        <div style={{
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
        </div>

        {/* Sources */}
        {author.sources && author.sources.length > 0 && (
          <div style={{ marginTop: '56px' }}>
            <div>
              <div style={sectionTitleStyle}>{t.author.sources}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {author.sources.map((s) => (
                  <div key={s.id} style={{
                    padding: '10px 16px', borderRadius: '8px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{s.title}</div>
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none' }}>
                        {s.url}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {bioModalOpen && author.biography && (
          <BiographyModal text={author.biography} onClose={() => setBioModalOpen(false)} />
        )}
      </div>
    </div>
  );
}