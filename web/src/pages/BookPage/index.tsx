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
  AboutBook,
  BookHero,
  BookMapPreview,
  BookPageState,
  KnowledgeAround,
  NarrativeForm,
  PersonalLibraryArea,
} from './BookPageSections';
import './BookPage.css';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

const DATE_LOCALES: Record<string, string> = {
  ru: 'ru-RU', en: 'en-GB', kk: 'kk-KZ', uk: 'uk-UA', be: 'be-BY', sr: 'sr-Latn-RS',
};

export default function BookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const locale = getBrowserLocale();
  const copy = getLocaleData(locale).bookPage;
  const [book, setBook] = useState<PublicBookDetail | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [personalBook, setPersonalBook] = useState<PersonalBook | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { trackReadingStart, trackNote } = useOffline();

  const loadBook = useCallback(async () => {
    if (!id) { setLoadState('not-found'); return; }
    setLoadState('loading');
    try {
      setBook(await bookDetailApi.getById(id));
      setLoadState('ready');
    } catch (error) {
      setBook(null);
      setLoadState(axios.isAxiosError(error) && error.response?.status === 404 ? 'not-found' : 'error');
    }
  }, [id]);

  useEffect(() => { void loadBook(); }, [loadBook]);

  useEffect(() => {
    if (!id) return;
    void bookApi.getUserBooks()
      .then((items) => setPersonalBook(items.find((item) => item.bookId === id) ?? null))
      .catch(() => setPersonalBook(null));
  }, [id]);

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
      <BookHero
        book={book}
        copy={copy}
        isInLibrary={personalBook !== null}
        onBack={() => navigate('/')}
        onAdd={openAddModal}
        onAuthor={(authorId, slug) => navigate(authorPath({ id: authorId, slug }))}
      />
      <div className="book-page__editorial-body">
        <div className="book-page__opening-spread">
          <AboutBook book={book} copy={copy} />
          <NarrativeForm copy={copy} />
        </div>
        <div className="book-page__semantic-spread">
          <KnowledgeAround book={book} copy={copy} onTag={(type, value) => navigate(`/?${type}=${encodeURIComponent(value)}`)} />
          <BookMapPreview book={book} copy={copy} />
        </div>
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
