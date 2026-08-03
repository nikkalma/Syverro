import {
  BookOpen,
  Check,
  Compass,
  FileText,
  Globe2,
  Library,
  NotebookPen,
  Plus,
  Sparkles,
} from 'lucide-react';
import type { LocaleData } from '../../locales';
import { formatAuthorName } from '../../shared/utils/formatAuthorName';
import type { PublicBookDetail, PublicBookKnowledgeItem } from '../../types/bookDetail';
import type { PersonalBook } from '../../types/personalBook';

export type BookPageCopy = LocaleData['bookPage'];

const KNOWLEDGE_TYPES = ['theme', 'motif', 'concept', 'atmosphere'] as const;

const publicationTypeLabel = (copy: BookPageCopy, value: string) =>
  copy.publicationTypes[value as keyof BookPageCopy['publicationTypes']] ?? value;

function knowledgeLabel(copy: BookPageCopy, nodeType: string) {
  const labels: Record<string, string> = {
    genre: copy.genres,
    theme: copy.themes,
    motif: copy.motifs,
    concept: copy.concepts,
    atmosphere: copy.atmospheres,
  };
  return labels[nodeType] ?? nodeType.replace(/_/g, ' ');
}

export function BookBreadcrumbs({ book, copy, onBack }: { book: PublicBookDetail; copy: BookPageCopy; onBack: () => void }) {
  const genre = book.genres[0];
  return (
    <nav className="book-page__breadcrumbs" aria-label={book.title}>
      <button type="button" onClick={onBack}>{copy.backToLibrary}</button>
      <span aria-hidden="true">/</span>
      {genre ? <><span>{genre.name}</span><span aria-hidden="true">/</span></> : null}
      <strong>{book.title}</strong>
    </nav>
  );
}

export function BookCoverRail({ book, copy, isInLibrary, onAdd }: {
  book: PublicBookDetail;
  copy: BookPageCopy;
  isInLibrary: boolean;
  onAdd: () => void;
}) {
  return (
    <aside className="book-page__cover-rail">
      <div className="book-page__cover-frame">
        {book.cover ? <img className="book-page__cover" src={book.cover} alt={book.title} /> : (
          <div className="book-page__cover-empty" aria-hidden="true"><BookOpen size={44} /></div>
        )}
      </div>
      {isInLibrary ? (
        <div className="book-page__library-presence"><Check size={16} aria-hidden="true" />{copy.inLibrary}</div>
      ) : (
        <button className="book-page__primary-action" type="button" onClick={onAdd}>
          <Plus size={17} aria-hidden="true" />{copy.addToLibrary}
        </button>
      )}
    </aside>
  );
}

export function BookIdentity({ book, copy, onAuthor, onTag }: {
  book: PublicBookDetail;
  copy: BookPageCopy;
  onAuthor: (id: string, slug: string | null) => void;
  onTag: (type: string, value: string) => void;
}) {
  const facts = [book.publicationYear, book.totalPages ? `${book.totalPages} ${copy.metadata.pages}` : null, book.seriesName]
    .filter((value): value is string | number => value !== null && value !== '');
  const knowledgeGroups = [
    { type: 'genre', label: copy.genres, items: book.genres.map((item) => ({ id: item.id, name: item.name })) },
    ...KNOWLEDGE_TYPES.map((type) => ({
      type,
      label: knowledgeLabel(copy, type),
      items: book.knowledge.filter((item) => item.nodeType === type).map((item) => ({ id: item.nodeId, name: item.name })),
    })),
  ].filter((group) => group.items.length > 0);

  return (
    <section className="book-page__identity" id="book-overview">
      <h1>{book.title}</h1>
      {book.subtitle ? <p className="book-page__subtitle">{book.subtitle}</p> : null}
      <div className="book-page__authors">
        {book.authors.map((author) => (
          <button key={author.id} type="button" onClick={() => onAuthor(author.id, author.slug)}>
            {formatAuthorName(author.displayName || author.name)}
          </button>
        ))}
      </div>
      <div className="book-page__identity-meta">
        {facts.map((fact) => <span key={fact}>{fact}</span>)}
        {book.originalTitle && book.originalTitle !== book.title ? <span>{book.originalTitle}</span> : null}
      </div>
      <nav className="book-page__section-nav" aria-label={book.title}>
        <a href="#book-overview">{copy.aboutTitle}</a>
        <a href="#book-story">{copy.howToldTitle}</a>
        <a href="#book-map">{copy.mapTitle}</a>
        <a href="#book-personal">{copy.personalTitle}</a>
      </nav>
      {knowledgeGroups.map((group) => (
        <div className="book-page__knowledge-row" key={group.type}>
          <span>{group.label}</span>
          <div>{group.items.map((item) => (
            <button type="button" key={`${group.type}-${item.id}`} onClick={() => onTag(group.type, item.name)}>{item.name}</button>
          ))}</div>
        </div>
      ))}
    </section>
  );
}

export function Bibliography({ book, copy, onTag }: {
  book: PublicBookDetail;
  copy: BookPageCopy;
  onTag: (type: string, value: string) => void;
}) {
  const items = [
    [copy.originalTitle, book.originalTitle],
    [copy.metadata.year, book.publicationYear],
    [copy.metadata.language, book.originalLanguage],
    [copy.metadata.country, book.countryOfOrigin],
    [copy.metadata.pages, book.totalPages],
    [copy.metadata.publicationType, publicationTypeLabel(copy, book.publicationType)],
    [copy.metadata.series, book.seriesName],
    [copy.metadata.seriesPosition, book.seriesPosition],
  ].filter((item): item is [string, string | number] => item[1] !== null && item[1] !== '');

  return (
    <section className="book-page__panel book-page__bibliography">
      <h2>{copy.aboutTitle}</h2>
      <dl>{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      {book.genres.length > 0 ? (
        <div className="book-page__genre-list">
          <h3>{copy.genres}</h3>
          {book.genres.map((genre) => <button type="button" key={genre.id} onClick={() => onTag('genre', genre.name)}>{genre.name}</button>)}
        </div>
      ) : null}
    </section>
  );
}

export function NarrativeForm({ copy }: { copy: BookPageCopy }) {
  return (
    <section className="book-page__panel book-page__narrative" id="book-story">
      <h2>{copy.howToldTitle}</h2>
      <div className="book-page__restrained-empty"><Sparkles size={17} aria-hidden="true" /><p>{copy.howToldEmpty}</p></div>
    </section>
  );
}

export function ReaderFit({ copy }: { copy: BookPageCopy }) {
  return (
    <section className="book-page__panel book-page__reader-fit">
      <h2>{copy.readerFitTitle}</h2>
      <p className="book-page__empty-copy">{copy.readerFitEmpty}</p>
    </section>
  );
}

export function BookDescription({ book, copy }: { book: PublicBookDetail; copy: BookPageCopy }) {
  return (
    <section className="book-page__panel book-page__description">
      <h2>{copy.descriptionTitle}</h2>
      <p className={book.description ? 'book-page__prose' : 'book-page__empty-copy'}>{book.description || copy.noDescription}</p>
    </section>
  );
}

export function Chronology({ copy }: { copy: BookPageCopy }) {
  return (
    <section className="book-page__panel book-page__chronology">
      <h2>{copy.chronologyTitle}</h2>
      <p className="book-page__empty-copy">{copy.chronologyEmpty}</p>
    </section>
  );
}

export function BookMapPreview({ book, copy }: { book: PublicBookDetail; copy: BookPageCopy }) {
  const nodes: PublicBookKnowledgeItem[] = book.knowledge.slice(0, 8);
  const nodeTypes = [...new Set(nodes.map((node) => node.nodeType))];
  return (
    <section className="book-page__panel book-page__map-section" id="book-map">
      <h2>{copy.mapTitle}</h2>
      {nodes.length > 0 ? (
        <>
          <div className="book-page__map" aria-label={copy.mapTitle}>
            <div className="book-page__map-center"><BookOpen size={18} aria-hidden="true" /><span>{book.title}</span></div>
            <div className="book-page__map-nodes">
              {nodes.map((node) => <span key={node.nodeId} data-node-type={node.nodeType}>{node.name}</span>)}
            </div>
          </div>
          <div className="book-page__map-legend">
            {nodeTypes.map((nodeType) => <span key={nodeType} data-node-type={nodeType}>{knowledgeLabel(copy, nodeType)}</span>)}
          </div>
        </>
      ) : <p className="book-page__empty-copy">{copy.mapEmpty}</p>}
      <button className="book-page__sapphire-action" type="button" disabled aria-disabled="true">
        <Compass size={16} aria-hidden="true" />{copy.openSapphire}<span>{copy.comingSoon}</span>
      </button>
    </section>
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
    <section className="book-page__panel book-page__personal" id="book-personal">
      <div className="book-page__personal-heading"><NotebookPen size={17} aria-hidden="true" /><h2>{copy.notes}</h2></div>
      {personalBook ? (
        <div className="book-page__personal-content">
          <div className="book-page__reading-state">
            <Library size={17} aria-hidden="true" />
            <dl>
              <div><dt>{copy.status}</dt><dd>{copy.statuses[personalBook.status]}</dd></div>
              {personalBook.startedAt ? <div><dt>{copy.started}</dt><dd>{formatDate(personalBook.startedAt)}</dd></div> : null}
              {personalBook.completedAt ? <div><dt>{copy.completed}</dt><dd>{formatDate(personalBook.completedAt)}</dd></div> : null}
              {personalBook.rereadCount ? <div><dt>{copy.reads}</dt><dd>{personalBook.rereadCount}</dd></div> : null}
            </dl>
          </div>
          {personalBook.notes ? <p className="book-page__saved-note"><FileText size={14} aria-hidden="true" />{personalBook.notes}</p> : null}
          <label className="book-page__notes">
            <span>{copy.notesPlaceholder}</span>
            <textarea onBlur={(event) => {
              const value = event.currentTarget.value.trim();
              if (value) { onSaveNote(value); event.currentTarget.value = ''; }
            }} />
            <small>{copy.notesHint}</small>
          </label>
        </div>
      ) : (
        <div className="book-page__personal-empty"><p>{copy.personalEmpty}</p><button type="button" onClick={onAdd}><Plus size={16} aria-hidden="true" />{copy.addToLibrary}</button></div>
      )}
    </section>
  );
}

export function BookPageState({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <main className="book-page book-page--state">
      <Globe2 size={28} aria-hidden="true" />
      <h1>{title}</h1>
      {action && onAction ? <button type="button" onClick={onAction}>{action}</button> : null}
    </main>
  );
}
