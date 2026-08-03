import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOffline } from '@/lib/offline';
import { getBrowserLocale, getLocaleData } from '../../locales';
import { bookDetailApi } from '../../shared/api/bookDetailApi';
import { bookApi } from '../../shared/api/bookApi';
import { authorPath } from '../../shared/utils/authorUrl';
import type { PublicBookDetail } from '../../types/bookDetail';
import type { PersonalBook, PersonalBookStatus } from '../../types/personalBook';
import { AddToLibraryModal } from './AddToLibraryModal';
import {
  Bibliography,
  BookBreadcrumbs,
  BookCoverRail,
  BookDescription,
  BookIdentity,
  BookMapPreview,
  BookPageState,
  Chronology,
  NarrativeForm,
  PersonalLibraryArea,
  ReaderFit,
} from './BookPageSections';
import './BookPage.css';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

const DATE_LOCALES: Record<string, string> = {
  ru: 'ru-RU', en: 'en-GB', kk: 'kk-KZ', uk: 'uk-UA', be: 'be-BY', sr: 'sr-Latn-RS',
};

export default function BookPage() {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const navigate = useNavigate();
  const locale = getBrowserLocale();
  const copy = getLocaleData(locale).bookPage;
  const [book, setBook] = useState<PublicBookDetail | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [personalBook, setPersonalBook] = useState<PersonalBook | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { trackReadingStart, trackNote } = useOffline();

  const loadBook = useCallback(async () => {
    if (!slugOrId) { setLoadState('not-found'); return; }
    setLoadState('loading');
    try {
      setBook(await bookDetailApi.getBySlugOrId(slugOrId));
      setLoadState('ready');
    } catch (error) {
      setBook(null);
      setLoadState(axios.isAxiosError(error) && error.response?.status === 404 ? 'not-found' : 'error');
    }
  }, [slugOrId]);

  useEffect(() => { void loadBook(); }, [loadBook]);

  useEffect(() => {
    if (!book?.id) return;
    void bookApi.getUserBooks()
      .then((items) => setPersonalBook(items.find((item) => item.bookId === book.id) ?? null))
      .catch(() => setPersonalBook(null));
  }, [book?.id]);

  if (loadState === 'loading') return <BookPageState title={copy.loading} />;
  if (loadState === 'not-found') return <BookPageState title={copy.notFound} action={copy.backToLibrary} onAction={() => navigate('/')} />;
  if (loadState === 'error' || !book) return <BookPageState title={copy.loadError} action={copy.retry} onAction={() => void loadBook()} />;

  const primaryAuthor = book.authors.find((author) => author.isPrimary) ?? book.authors[0] ?? null;

  const handleAddToLibrary = async (status: PersonalBookStatus) => {
    await bookApi.addToLibrary(book.title, primaryAuthor?.name ?? '', status);
    const personalBooks = await bookApi.getUserBooks();
    setPersonalBook(personalBooks.find((item) => item.bookId === book.id) ?? null);
    setIsAddModalOpen(false);
    if (status === 'reading') trackReadingStart(book.id, { title: book.title, author: primaryAuthor?.name ?? '' });
  };

  const openAddModal = () => setIsAddModalOpen(true);

  return (
    <main className="book-page">
      <BookBreadcrumbs book={book} copy={copy} onBack={() => navigate('/')} />
      <div className="book-page__top-grid">
        <BookCoverRail book={book} copy={copy} isInLibrary={personalBook !== null} onAdd={openAddModal} />
        <BookIdentity
          book={book}
          copy={copy}
          onAuthor={(authorId, slug) => navigate(authorPath({ id: authorId, slug }))}
          onTag={(type, value) => navigate(`/?${type}=${encodeURIComponent(value)}`)}
        />
      </div>
      <div className="book-page__content-grid">
        <Bibliography book={book} copy={copy} onTag={(type, value) => navigate(`/?${type}=${encodeURIComponent(value)}`)} />
        <NarrativeForm copy={copy} />
        <ReaderFit copy={copy} />
        <BookDescription book={book} copy={copy} />
        <Chronology copy={copy} />
        <BookMapPreview book={book} copy={copy} />
        <PersonalLibraryArea
          personalBook={personalBook}
          copy={copy}
          locale={DATE_LOCALES[locale] ?? 'ru-RU'}
          onAdd={openAddModal}
          onSaveNote={(text) => trackNote(book.id, text)}
        />
      </div>
      <AddToLibraryModal
        isOpen={isAddModalOpen}
        bookTitle={book.title}
        copy={copy}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddToLibrary}
      />
    </main>
  );
}
