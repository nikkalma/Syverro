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
        background: 'rgba(10, 17, 24, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '2/3',
          background: 'linear-gradient(135deg, rgba(26, 40, 50, 0.8), rgba(15, 26, 34, 0.8))',
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
        
        {/* Прогресс */}
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
                background: '#5B86A1',
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
            color: '#E6EDF3',
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
            color: '#97A6BA',
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
            color: '#5B86A1',
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

  // Книги в библиотеке
  const libraryBooks = books.filter((b) => userBookMap.has(b.id));
  const totalBooks = libraryBooks.length;

  // Читаю сейчас (статус 'reading')
  const readingBooks = libraryBooks.filter(
    (b) => userBookMap.get(b.id)?.status === 'reading'
  );

  // Прочитано (статус 'completed')
  const completedBooks = libraryBooks.filter(
    (b) => userBookMap.get(b.id)?.status === 'completed'
  );

  // ============================================
  // РАСЧЁТ СТАТИСТИКИ ТОЛЬКО ПО АКТУАЛЬНЫМ КНИГАМ
  // ============================================
  const relevantBooks = libraryBooks.filter(
    (b) => {
      const status = userBookMap.get(b.id)?.status;
      return status === 'completed' || status === 'reading' || status === 'rereading';
    }
  );

  // Самый частый жанр
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

  // Самая частая страна автора
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

  // Прокрутка колесиком
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  return (
    <div
      style={{
        background: 'rgba(18, 28, 36, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '20px 24px',
        marginBottom: '32px',
      }}
    >
      {/* Заголовок */}
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
            color: '#E6EDF3',
          }}
        >
          📚 Читаю сейчас
        </h3>
        <span
          style={{
            fontSize: '12px',
            color: '#5B86A1',
          }}
        >
          {readingBooks.length} книг
        </span>
      </div>

      {/* Горизонтальный скролл книг */}
      {readingBooks.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '20px',
            color: '#5B86A1',
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
            scrollbarColor: '#2A4B60 transparent',
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

      {/* Статистика */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Всего книг — ссылка на библиотеку */}
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
          <div style={{ fontSize: '20px', fontWeight: '300', color: '#E6EDF3' }}>
            {totalBooks}
          </div>
          <div style={{ fontSize: '12px', color: '#97A6BA' }}>Всего книг</div>
        </div>

        {/* Прочитано */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: '300', color: '#4CAF50' }}>
            {completedBooks.length}
          </div>
          <div style={{ fontSize: '12px', color: '#97A6BA' }}>Прочитано</div>
        </div>

        {/* Главный жанр */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: '300', color: '#5B86A1' }}>
            {topGenre}
          </div>
          <div style={{ fontSize: '12px', color: '#97A6BA' }}>Главный жанр</div>
        </div>

        {/* Главная страна */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: '300', color: '#5B86A1' }}>
            {topCountry}
          </div>
          <div style={{ fontSize: '12px', color: '#97A6BA' }}>Главная страна</div>
        </div>
      </div>
    </div>
  );
}