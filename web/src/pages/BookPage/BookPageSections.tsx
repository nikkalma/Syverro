import { ArrowLeft, BookOpen, Check, Compass, Library, NotebookPen, Plus, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import type { LocaleData } from '../../locales';
import type { PublicBookDetail, PublicBookKnowledgeItem } from '../../types/bookDetail';
import type { PersonalBook } from '../../types/personalBook';
import { formatAuthorName } from '../../shared/utils/formatAuthorName';

export type BookPageCopy = LocaleData['bookPage'];

interface BookHeroProps {
  book: PublicBookDetail;
  copy: BookPageCopy;
  isInLibrary: boolean;
  onBack: () => void;
  onAdd: () => void;
  onAuthor: (id: string, slug: string | null) => void;
}

export function BookHero({ book, copy, isInLibrary, onBack, onAdd, onAuthor }: BookHeroProps) {
  const heroFacts = [
    book.publicationYear,
    book.countryOfOrigin,
    book.originalLanguage,
  ].filter((value): value is string | number => value !== null && value !== '');

  return (
    <header className="book-page__hero">
      <button className="book-page__back" type="button" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" /> {copy.backToLibrary}
      </button>
      <div className="book-page__hero-composition">
        <div className="book-page__cover-frame">
          {book.cover ? (
            <img className="book-page__cover" src={book.cover} alt={book.title} />
          ) : (
            <div className="book-page__cover-empty" aria-hidden="true"><BookOpen size={44} /></div>
          )}
        </div>
        <div className="book-page__hero-copy">
          <p className="book-page__eyebrow">{copy.heroEyebrow}</p>
          <h1>{book.title}</h1>
          {book.originalTitle ? (
            <p className="book-page__original"><span>{copy.originalTitle}</span>{book.originalTitle}</p>
          ) : null}
          {book.subtitle ? <p className="book-page__subtitle">{book.subtitle}</p> : null}
          <div className="book-page__authors">
            {book.authors.map((author) => (
              <button key={author.id} type="button" onClick={() => onAuthor(author.id, author.slug)}>
                {formatAuthorName(author.displayName || author.name)}
              </button>
            ))}
          </div>
          {heroFacts.length > 0 ? (
            <p className="book-page__hero-facts">{heroFacts.join(' · ')}</p>
          ) : null}
          {isInLibrary ? (
            <div className="book-page__library-presence"><Check size={16} aria-hidden="true" />{copy.inLibrary}</div>
          ) : (
            <button className="book-page__primary-action" type="button" onClick={onAdd}>
              <Plus size={17} aria-hidden="true" />{copy.addToLibrary}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function EditorialSection({ title, intro, children, className = '' }: {
  title: string;
  intro?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`book-page__section ${className}`.trim()}>
      <div className="book-page__section-heading">
        <h2>{title}</h2>
        {intro ? <p>{intro}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Metadata({ book, copy }: { book: PublicBookDetail; copy: BookPageCopy }) {
  const items = [
    [copy.metadata.year, book.publicationYear],
    [copy.metadata.country, book.countryOfOrigin],
    [copy.metadata.language, book.originalLanguage],
    [copy.metadata.pages, book.totalPages],
    [copy.metadata.publicationType, book.publicationType],
    [copy.metadata.series, book.seriesName],
    [copy.metadata.seriesPosition, book.seriesPosition],
  ].filter((item): item is [string, string | number] => item[1] !== null && item[1] !== '');

  return items.length > 0 ? (
    <dl className="book-page__metadata">
      {items.map(([label, value]) => (
        <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
      ))}
    </dl>
  ) : null;
}

export function AboutBook({ book, copy }: { book: PublicBookDetail; copy: BookPageCopy }) {
  return (
    <EditorialSection title={copy.aboutTitle}>
      <div className="book-page__about-grid">
        <p className={book.description ? 'book-page__prose' : 'book-page__empty-copy'}>
          {book.description || copy.noDescription}
        </p>
        <Metadata book={book} copy={copy} />
      </div>
    </EditorialSection>
  );
}

export function NarrativeForm({ copy }: { copy: BookPageCopy }) {
  return (
    <EditorialSection title={copy.howToldTitle} className="book-page__narrative">
      <div className="book-page__editorial-empty"><Sparkles size={18} aria-hidden="true" /><p>{copy.howToldEmpty}</p></div>
    </EditorialSection>
  );
}

const KNOWLEDGE_TYPES = ['genre', 'theme', 'motif', 'concept', 'atmosphere'] as const;

export function KnowledgeAround({ book, copy, onTag }: {
  book: PublicBookDetail;
  copy: BookPageCopy;
  onTag: (type: string, value: string) => void;
}) {
  const groups = [
    { key: 'genre', label: copy.genres, items: book.genres.map((genre) => ({ id: genre.id, name: genre.name, slug: genre.slug })) },
    ...KNOWLEDGE_TYPES.slice(1).map((nodeType) => ({
      key: nodeType,
      label: copy[`${nodeType}s` as 'themes' | 'motifs' | 'concepts' | 'atmospheres'],
      items: book.knowledge.filter((item) => item.nodeType === nodeType).map((item) => ({ id: item.nodeId, name: item.name, slug: item.slug })),
    })),
  ].filter((group) => group.items.length > 0);

  return (
    <EditorialSection title={copy.knowledgeTitle} intro={copy.knowledgeIntro}>
      {groups.length > 0 ? (
        <div className="book-page__knowledge-groups">
          {groups.map((group) => (
            <div className="book-page__knowledge-group" key={group.key}>
              <h3>{group.label}</h3>
              <div className="book-page__tags">
                {group.items.map((item) => (
                  <button type="button" key={item.id} onClick={() => onTag(group.key, item.name)}>{item.name}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : <p className="book-page__empty-copy">{copy.knowledgeEmpty}</p>}
    </EditorialSection>
  );
}

export function BookMapPreview({ book, copy }: { book: PublicBookDetail; copy: BookPageCopy }) {
  const nodes: PublicBookKnowledgeItem[] = book.knowledge.slice(0, 8);
  return (
    <EditorialSection title={copy.mapTitle} intro={copy.mapDescription} className="book-page__map-section">
      {nodes.length > 0 ? (
        <div className="book-page__map" aria-label={copy.mapTitle}>
          <div className="book-page__map-center"><BookOpen size={20} aria-hidden="true" /><span>{book.title}</span></div>
          <div className="book-page__map-nodes">
            {nodes.map((node) => <span key={node.nodeId} data-node-type={node.nodeType}>{node.name}</span>)}
          </div>
        </div>
      ) : <p className="book-page__empty-copy">{copy.mapEmpty}</p>}
      <button className="book-page__sapphire-action" type="button" disabled aria-disabled="true">
        <Compass size={17} aria-hidden="true" />{copy.openSapphire}<span>{copy.comingSoon}</span>
      </button>
    </EditorialSection>
  );
}

export function PersonalLibraryArea({ personalBook, copy, locale, onAdd, onSaveNote }: {
  personalBook: PersonalBook | null;
  copy: BookPageCopy;
  locale: string;
  onAdd: () => void;
  onSaveNote: (text: string) => void;
}) {
  const formatDate = (value: string) => new Intl.DateTimeFormat(locale).format(new Date(value));
  return (
    <EditorialSection title={copy.personalTitle} intro={copy.personalIntro} className="book-page__personal">
      {personalBook ? (
        <div className="book-page__personal-grid">
          <div className="book-page__reading-state">
            <Library size={19} aria-hidden="true" />
            <dl>
              <div><dt>{copy.status}</dt><dd>{copy.statuses[personalBook.status]}</dd></div>
              {personalBook.startedAt ? <div><dt>{copy.started}</dt><dd>{formatDate(personalBook.startedAt)}</dd></div> : null}
              {personalBook.completedAt ? <div><dt>{copy.completed}</dt><dd>{formatDate(personalBook.completedAt)}</dd></div> : null}
              {personalBook.rereadCount ? <div><dt>{copy.reads}</dt><dd>{personalBook.rereadCount}</dd></div> : null}
            </dl>
          </div>
          <label className="book-page__notes">
            <span><NotebookPen size={17} aria-hidden="true" />{copy.notes}</span>
            <textarea placeholder={copy.notesPlaceholder} onBlur={(event) => {
              const value = event.currentTarget.value.trim();
              if (value) { onSaveNote(value); event.currentTarget.value = ''; }
            }} />
            <small>{copy.notesHint}</small>
          </label>
        </div>
      ) : (
        <div className="book-page__personal-empty">
          <p>{copy.personalEmpty}</p>
          <button type="button" onClick={onAdd}><Plus size={16} aria-hidden="true" />{copy.addToLibrary}</button>
        </div>
      )}
    </EditorialSection>
  );
}

export function BookPageState({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <main className="book-page book-page--state">
      <BookOpen size={28} aria-hidden="true" />
      <h1>{title}</h1>
      {action && onAction ? <button type="button" onClick={onAction}>{action}</button> : null}
    </main>
  );
}
