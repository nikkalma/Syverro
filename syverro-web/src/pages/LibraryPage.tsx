// src/pages/LibraryPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../hooks/useLibrary';
import { useLibraryFilters } from '../hooks/useLibraryFilters';
import BookGrid from '../widgets/BookGrid';
import LibrarySidebar from '../components/LibrarySidebar';

export default function LibraryPage() {
  const navigate = useNavigate();
  const { books, loading } = useLibrary();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  return (
    <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
      <aside style={{
        width: '260px',
        borderRight: '1px solid var(--border-soft)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 80px)',
        position: 'sticky',
        top: '80px',
        background: 'var(--bg)',
        zIndex: 5,
        overflowY: 'auto',
      }}>
        <LibrarySidebar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedMoods={selectedMoods}
          setSelectedMoods={setSelectedMoods}
          selectedVibes={selectedVibes}
          setSelectedVibes={setSelectedVibes}
          selectedThemes={selectedThemes}
          setSelectedThemes={setSelectedThemes}
          selectedGenres={selectedGenres}
          setSelectedGenres={setSelectedGenres}
          selectedCountries={selectedCountries}
          setSelectedCountries={setSelectedCountries}
          selectedCenturies={selectedCenturies}
          setSelectedCenturies={setSelectedCenturies}
          moodOptions={moodOptions}
          vibeOptions={vibeOptions}
          themeOptions={themeOptions}
          allGenres={allGenres}
          allCountries={allCountries}
          allCenturies={allCenturies}
          toggleFilter={toggleFilter}
          handleFindForMe={handleFindForMe}
          filteredBooks={filteredBooks}
          onRandomClick={() => {
            if (books.length === 0) return;
            const randomIndex = Math.floor(Math.random() * books.length);
            const randomBook = books[randomIndex];
            navigate(`/book/${randomBook.id}`);
          }}
        />
      </aside>

      <div style={{
        flex: 1,
        padding: '24px 20px',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 80px)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}>
          <button
            onClick={() => setIsSidebarOpen(true)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
            className="sidebar-toggle"
          >
            ☰
          </button>
          <div style={{ flex: 1 }} />
        </div>

        <BookGrid books={filteredBooks} onBookClick={(id) => navigate(`/book/${id}`)} />
      </div>

      {isSidebarOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 100,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setIsSidebarOpen(false)}
          />
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: '300px',
            background: 'var(--bg)',
            zIndex: 101,
            borderRight: '1px solid var(--border-soft)',
            boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
            overflowY: 'auto',
            animation: 'slideIn 0.3s ease',
          }}>
            <button
              onClick={() => setIsSidebarOpen(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '24px',
                cursor: 'pointer',
                zIndex: 102,
              }}
            >
              ✕
            </button>
            <LibrarySidebar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedMoods={selectedMoods}
              setSelectedMoods={setSelectedMoods}
              selectedVibes={selectedVibes}
              setSelectedVibes={setSelectedVibes}
              selectedThemes={selectedThemes}
              setSelectedThemes={setSelectedThemes}
              selectedGenres={selectedGenres}
              setSelectedGenres={setSelectedGenres}
              selectedCountries={selectedCountries}
              setSelectedCountries={setSelectedCountries}
              selectedCenturies={selectedCenturies}
              setSelectedCenturies={setSelectedCenturies}
              moodOptions={moodOptions}
              vibeOptions={vibeOptions}
              themeOptions={themeOptions}
              allGenres={allGenres}
              allCountries={allCountries}
              allCenturies={allCenturies}
              toggleFilter={toggleFilter}
              handleFindForMe={handleFindForMe}
              filteredBooks={filteredBooks}
              onRandomClick={() => {
                if (books.length === 0) return;
                const randomIndex = Math.floor(Math.random() * books.length);
                const randomBook = books[randomIndex];
                navigate(`/book/${randomBook.id}`);
              }}
            />
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .sidebar-toggle {
            display: block !important;
          }
          aside {
            display: none !important;
          }
        }
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
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}