import { useEffect, useMemo } from 'react';
import { useLibraryStore } from '../../store/libraryStore';
import { EnrichedBook } from '../../types/book';
import { UserBook } from '../../types/userBook';
import { getLocaleData, getBrowserLocale } from '../../locales';
import LibraryHeader from './LibraryHeader';
import LibraryControls from './LibraryControls';
import LibraryGrid from './LibraryGrid';
import LibraryList from './LibraryList';
import BookDrawer from './BookDrawer';

export default function MyLibraryPage() {
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);

  const {
    books,
    userBooks,
    loading,
    error,
    searchQuery,
    statusFilters,
    genreFilters,
    viewMode,
    selectedBookId,
    loadLibrary,
    setSearchQuery,
    toggleStatusFilter,
    toggleGenreFilter,
    clearFilters,
    setViewMode,
    selectBook,
    updateBookStatus,
    updateProgress,
    removeFromLibrary,
  } = useLibraryStore();

  const filteredBooks = useMemo(() => {
    let result = books.filter((book: EnrichedBook) =>
      userBooks.some((ub: UserBook) => ub.bookId === book.id)
    );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b: EnrichedBook) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
      );
    }

    if (statusFilters.length > 0) {
      result = result.filter((book: EnrichedBook) => {
        const ub = userBooks.find((u: UserBook) => u.bookId === book.id);
        return ub && statusFilters.includes(ub.status);
      });
    }

    if (genreFilters.length > 0) {
      result = result.filter((book: EnrichedBook) =>
        book.genres?.some((g: string) => genreFilters.includes(g))
      );
    }

    return result;
  }, [books, userBooks, searchQuery, statusFilters, genreFilters]);

  const stats = useMemo(() => {
    const ub = userBooks;
    return {
      total: ub.length,
      reading: ub.filter((x: UserBook) => x.status === 'reading').length,
      planned: ub.filter((x: UserBook) => x.status === 'planned').length,
      completed: ub.filter((x: UserBook) => x.status === 'completed').length,
      paused: ub.filter((x: UserBook) => x.status === 'paused').length,
      dropped: ub.filter((x: UserBook) => x.status === 'abandoned').length,
    };
  }, [userBooks]);

  const allGenres = useMemo(
    () => Array.from(new Set(books.flatMap((b: EnrichedBook) => b.genres || []))).sort(),
    [books]
  );

  useEffect(() => {
    loadLibrary();
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#97A6BA' }}>Загрузка библиотеки...</div>;
  }

  if (error) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#EF5350' }}>Ошибка: {error}</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      <LibraryHeader stats={stats} />
      <LibraryControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilters={statusFilters}
        onStatusToggle={toggleStatusFilter}
        genreFilters={genreFilters}
        onGenreToggle={toggleGenreFilter}
        allGenres={allGenres}
        onClearFilters={clearFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {filteredBooks.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#5B86A1',
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: '16px',
          }}
        >
          {userBooks.length === 0
            ? t.library?.empty || 'Библиотека пуста. Добавьте первую книгу.'
            : t.library?.emptyFiltered || 'Нет книг по выбранным фильтрам'}
        </div>
      ) : viewMode === 'grid' ? (
        <LibraryGrid books={filteredBooks} onBookClick={selectBook} />
      ) : (
        <LibraryList books={filteredBooks} onBookClick={selectBook} />
      )}

      <BookDrawer
        bookId={selectedBookId}
        isOpen={!!selectedBookId}
        onClose={() => selectBook(null)}
        onStatusChange={updateBookStatus}
        onProgressChange={updateProgress}
        onRemove={(bookId: string) => {
          removeFromLibrary(bookId);
          selectBook(null);
        }}
      />
    </div>
  );
}