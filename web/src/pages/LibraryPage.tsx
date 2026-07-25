// src/pages/LibraryPage.tsx

import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../hooks/useLibrary';
import { useLibraryFilters } from '../hooks/useLibraryFilters';
import BookGrid from '../widgets/BookGrid';
import LibrarySidebar from '../components/LibrarySidebar';
import { bookPath } from '../shared/utils/routes';
import { Hero } from '../components/Hero';
import { SuggestBook } from '../components/SuggestBook';

export default function LibraryPage() {
  const navigate = useNavigate();
  const { books, loading } = useLibrary();

  const {
    searchQuery,
    setSearchQuery,
    selectedMoods,
    setSelectedMoods,
    selectedVibes,
    setSelectedVibes,
    selectedThemes,
    setSelectedThemes,
    selectedGenres,
    setSelectedGenres,
    selectedCountries,
    setSelectedCountries,
    selectedCenturies,
    setSelectedCenturies,
    moodOptions,
    vibeOptions,
    themeOptions,
    allGenres,
    allCountries,
    allCenturies,
    filteredBooks,
    toggleFilter,
    handleFindForMe,
  } = useLibraryFilters(books);

  if (loading) {
    return (
      <div style={{ color: 'var(--text-secondary)', padding: '40px', textAlign: 'center' }}>
        Загрузка...
      </div>
    );
  }

  const sharedSidebarProps = {
    searchQuery,
    setSearchQuery,
    selectedMoods,
    setSelectedMoods,
    selectedVibes,
    setSelectedVibes,
    selectedThemes,
    setSelectedThemes,
    selectedGenres,
    setSelectedGenres,
    selectedCountries,
    setSelectedCountries,
    selectedCenturies,
    setSelectedCenturies,
    moodOptions,
    vibeOptions,
    themeOptions,
    allGenres,
    allCountries,
    allCenturies,
    toggleFilter,
    handleFindForMe,
    filteredBooks,
    onRandomClick: () => {
      if (books.length === 0) return;
      const randomIndex = Math.floor(Math.random() * books.length);
      const randomBook = books[randomIndex];
      navigate(bookPath(randomBook));
    },
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', gap: '24px', flex: 1,
        padding: '24px 20px', overflowY: 'auto',
        maxHeight: 'calc(100vh - 80px)',
      }}>
        <div style={{ width: '260px', flexShrink: 0 }}>
          <LibrarySidebar {...sharedSidebarProps} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Hero />
          <SuggestBook />
          <BookGrid books={filteredBooks} onBookClick={(id) => navigate(bookPath({ id }))} />
        </div>
      </div>

      <style>{`
        @media (max-width: 1200px) {
          .book-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 900px) {
          .book-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          .book-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
