import { Link } from 'react-router-dom';
import type { LocaleData } from '../../locales';
import { bookPath, formatDate } from '../../shared/utils/routes';
import { formatStoredPlace, getApprovedAtmospheres, splitAuthorQuotes } from './authorPageModel';
import type { PublicAuthorDetail } from './types';

type AuthorLocale = LocaleData['author'];

export function AuthorHero({ author, t }: { author: PublicAuthorDetail; t: AuthorLocale }) {
  const displayName = author.display_name || author.name;
  const dates = [author.birth_date && formatDate(author.birth_date), author.death_date && formatDate(author.death_date)].filter(Boolean).join(' — ');
  const heroStatement = author.author_intro_quote || author.hero_quote;
  const place = formatStoredPlace(author.birth_place, author.birth_place_region, author.birth_place_country);
  const aliases = [...author.pen_names, ...author.pseudonyms].filter((name, index, all) => name && all.findIndex((item) => item.toLocaleLowerCase() === name.toLocaleLowerCase()) === index);

  return <header className="author-hero" style={author.hero_background_url ? { '--author-hero-image': `url("${author.hero_background_url}")` } as React.CSSProperties : undefined}>
    <div className="author-hero__shade" />
    <div className="author-hero__portrait" aria-hidden={!author.photo_url}>
      {author.photo_url ? <img src={author.photo_url} alt={displayName} /> : <span>{displayName.charAt(0)}</span>}
    </div>
    <div className="author-hero__identity">
      <h1>{displayName}</h1>
      {author.native_name && author.native_name !== displayName && <p className="author-hero__native">{author.native_name}</p>}
      {dates && <p className="author-hero__dates">{dates}</p>}
      {heroStatement && <blockquote>{heroStatement}</blockquote>}
    </div>
    <dl className="author-hero__facts">
      {place && <><dt>{t.metaBorn}</dt><dd>{place}</dd></>}
      {author.nationality && <><dt>{t.metaOrigin}</dt><dd>{author.nationality}</dd></>}
      {author.occupations.length > 0 && <><dt>{t.metaProfessions}</dt><dd>{author.occupations.join(', ')}</dd></>}
      {aliases.length > 0 && <><dt>{t.metaAltNames}</dt><dd>{aliases.join(', ')}</dd></>}
    </dl>
  </header>;
}

export function AuthorLocalNav({ items, label }: { items: Array<{ id: string; label: string }>; label: string }) {
  return <nav className="author-local-nav" aria-label={label}>
    {items.map((item) => <a key={item.id} href={`#${item.id}`}>{item.label}</a>)}
  </nav>;
}

export function AuthorAbout({ author, t }: { author: PublicAuthorDetail; t: AuthorLocale }) {
  return <section className="author-panel author-about" id="about">
    <h2>{t.aboutAuthor}</h2>
    {author.about_summary && <p className="author-about__lead">{author.about_summary}</p>}
    {author.biography && <p className="author-about__body">{author.biography}</p>}
    <dl className="author-about__context">
      {author.cultural_identity && <><dt>{t.metaCulturalIdentity}</dt><dd>{author.cultural_identity}</dd></>}
      {author.ethnic_origin && <><dt>{t.metaEthnicOrigin}</dt><dd>{author.ethnic_origin}</dd></>}
      {author.citizenships.length > 0 && <><dt>{t.citizenships}</dt><dd>{author.citizenships.map((item) => item.state_name).join(', ')}</dd></>}
      {author.awards.length > 0 && <><dt>{t.awards}</dt><dd>{author.awards.map((award) => [award.name, award.year].filter(Boolean).join(' · ')).join('; ')}</dd></>}
    </dl>
  </section>;
}

export function AuthorTimeline({ author, t, expanded, onToggle }: { author: PublicAuthorDetail; t: AuthorLocale; expanded: boolean; onToggle: () => void }) {
  const hasMore = author.timeline_events.length > 3;
  const events = expanded ? author.timeline_events : author.timeline_events.slice(0, 3);
  return <section className="author-panel author-timeline" id="chronology">
    <h2>{t.timeline}</h2>
    <ol id="author-timeline-events">
      {events.map((event) => <li key={event.id}>
        <time>{event.date_value}</time><div><h3>{event.label}</h3>{event.place_name && <p className="author-timeline__place">{event.place_name}</p>}{event.description && <p>{event.description}</p>}{event.source_title && <cite>{event.source_title}</cite>}</div>
      </li>)}
    </ol>
    {hasMore && <button className="author-timeline__toggle" type="button" aria-expanded={expanded} aria-controls="author-timeline-events" onClick={onToggle}>
      {expanded ? t.showLess : `${t.readMore} (${author.timeline_events.length})`}
    </button>}
  </section>;
}

export function AuthorAtmosphere({ author, t }: { author: PublicAuthorDetail; t: AuthorLocale }) {
  const atmospheres = getApprovedAtmospheres(author);
  return <section className="author-panel author-atmosphere" id="atmosphere">
    <h2>{t.atmosphere}</h2>
    <ul>{atmospheres.map((atmosphere) => <li key={atmosphere}>{atmosphere}</li>)}</ul>
  </section>;
}

export function AuthorWorks({ author, t }: { author: PublicAuthorDetail; t: AuthorLocale }) {
  return <section className="author-panel author-works" id="works">
    <h2>{t.authorBooks}</h2>
    {author.books.length > 0 && <div className="author-works__rail">
      {author.books.map((book) => <Link className="author-work-card" key={book.id} to={bookPath(book)}>
        <div className="author-work-card__cover">{book.cover ? <img src={book.cover} alt="" /> : <span aria-hidden="true">◇</span>}</div>
        <strong>{book.title}</strong>
      </Link>)}
    </div>}
    {author.publications.length > 0 && <div className="author-publications" aria-label={t.bibliography}>
      {author.publications.map((publication) => <article key={publication.id}>
        <div><strong>{publication.title}</strong>{publication.original_title && publication.original_title !== publication.title && <em>{publication.original_title}</em>}</div>
        <span>{publication.publication_year}</span>
      </article>)}
    </div>}
  </section>;
}

export function AuthorQuotes({ author, t }: { author: PublicAuthorDetail; t: AuthorLocale }) {
  const { byAuthor, aboutAuthor } = splitAuthorQuotes(author.quotes);
  return <section className="author-panel author-quotes" id="quotes">
    <h2>{t.quotes}</h2>
    <div className="author-quotes__columns">
      {byAuthor.length > 0 && <div><h3>{t.quote}</h3>{byAuthor.map((quote) => <figure key={quote.id}><blockquote>{quote.text}</blockquote>{quote.source_title && <figcaption>{quote.source_title}</figcaption>}</figure>)}</div>}
      {aboutAuthor.length > 0 && <div><h3>{t.quotesAboutTitle}</h3>{aboutAuthor.map((quote) => <figure key={quote.id}><blockquote>{quote.text}</blockquote>{quote.speaker && <figcaption>— {quote.speaker}</figcaption>}</figure>)}</div>}
    </div>
  </section>;
}

export function AuthorSources({ author, t }: { author: PublicAuthorDetail; t: AuthorLocale }) {
  return <details className="author-panel author-sources" id="sources"><summary><h2>{t.sources}</h2><span>{author.sources.length}</span></summary><ol>
    {author.sources.map((source) => <li key={source.id}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> : <span>{source.title}</span>}{source.citation && <small>{source.citation}</small>}</li>)}
  </ol></details>;
}
