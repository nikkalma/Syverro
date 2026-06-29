// src/pages/Profile/LibrarySection.tsx
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnrichedBook } from '../../types/book';
import { userBookService } from '../../services/userBookService';

const CURRENT_USER_ID = 'user_1';

interface LibrarySectionProps {
  books: EnrichedBook[];
}

function BookCard({ book, userBook, onClick }: {
  book: EnrichedBook;
  userBook: any;
  onClick: () => void;
}) {
  const progress = book.totalPages > 0
    ? Math.round((userBook.currentPage / book.totalPages) * 100)
    : 0;

  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: '140px',
        background: 'var(--card)',
        borderRadius: '12px',
        border: '1px solid var(--border-soft)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-soft)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '2/3',
          background: 'linear-gradient(135deg, var(--surface-alt), var(--bg))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '48px', opacity: 0.3 }}>📖</span>
        )}
        
        {progress > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'var(--primary)',
                transition: 'width 0.3s',
              }}
            />
          </div>
        )}
      </div>

      <div style={{ padding: '8px 10px' }}>
        <div
          style={{
            fontSize: '12px',
            fontWeight: '500',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {book.title}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {book.author}
        </div>
        <div
          style={{
            fontSize: '10px',
            color: 'var(--primary)',
            marginTop: '2px',
          }}
        >
          {progress}%
        </div>
      </div>
    </div>
  );
}

export default function LibrarySection({ books }: LibrarySectionProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const userBooks = userBookService.getByUser(CURRENT_USER_ID);
  const userBookMap = new Map(userBooks.map((ub) => [ub.bookId, ub]));

  const libraryBooks = books.filter((b) => userBookMap.has(b.id));
  const totalBooks = libraryBooks.length;
  const readingBooks = libraryBooks.filter(
    (b) => userBookMap.get(b.id)?.status === 'reading'
  );
  const completedBooks = libraryBooks.filter(
    (b) => userBookMap.get(b.id)?.status === 'completed'
  );

  const relevantBooks = libraryBooks.filter(
    (b) => {
      const status = userBookMap.get(b.id)?.status;
      return status === 'completed' || status === 'reading' || status === 'rereading';
    }
  );

  const allGenres = relevantBooks.flatMap((b) => b.genres || []);
  const genreCounts: Record<string, number> = {};
  allGenres.forEach((g) => {
    genreCounts[g] = (genreCounts[g] || 0) + 1;
  });
  let topGenre = '—';
  let topGenreCount = 0;
  for (const [genre, count] of Object.entries(genreCounts)) {
    if (count > topGenreCount) {
      topGenreCount = count;
      topGenre = genre;
    }
  }

  const allCountries = relevantBooks
    .map((b) => b.authorCountry)
    .filter((c): c is string => c !== null && c !== undefined);
  const countryCounts: Record<string, number> = {};
  allCountries.forEach((c) => {
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  let topCountry = '—';
  let topCountryCount = 0;
  for (const [country, count] of Object.entries(countryCounts)) {
    if (count > topCountryCount) {
      topCountryCount = count;
      topCountry = country;
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid var(--glass-border)',
        padding: '20px 24px',
        marginBottom: '32px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '400',
            color: 'var(--text-primary)',
          }}
        >
          📚 Читаю сейчас
        </h3>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
        >
          {readingBooks.length} книг
        </span>
      </div>

      {readingBooks.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '20px',
            color: 'var(--text-muted)',
            fontSize: '13px',
          }}
        >
          Сейчас вы ничего не читаете. Начните новую книгу!
        </div>
      ) : (
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            padding: '4px 4px 12px 4px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--primary) transparent',
            cursor: 'grab',
            scrollBehavior: 'smooth',
          }}
        >
          {readingBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              userBook={userBookMap.get(book.id)}
              onClick={() => navigate(`/book/${book.id}`)}
            />
          ))}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-soft)',
        }}
      >
        <div
          onClick={() => navigate('/my-library')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <div style={{ fontSize: '20px', fontWeight: '300', color: 'var(--text-primary)' }}>
            {totalBooks}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Всего книг</div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: '300', color: 'var(--success)' }}>
            {completedBooks.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Прочитано</div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: '300', color: 'var(--primary)' }}>
            {topGenre}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Главный жанр</div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: '300', color: 'var(--primary)' }}>
            {topCountry}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Главная страна</div>
        </div>
      </div>
    </div>
  );
}