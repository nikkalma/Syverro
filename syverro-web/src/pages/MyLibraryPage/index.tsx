// src/pages/MyLibraryPage/index.tsx
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../../hooks/useLibrary';
import { userBookService } from '../../services/userBookService';
import { UserBookStatus } from '../../types/userBook';
import BookCard from '../../widgets/BookCard';
import { getABTestVariant } from '../../utils/abTest';

const CURRENT_USER_ID = 'user_1';

const statusTabs: { key: UserBookStatus; label: string }[] = [
  { key: 'reading', label: 'Читаю' },
  { key: 'shelf', label: 'На полке' },
  { key: 'completed', label: 'Завершено' },
  { key: 'paused', label: 'Отложено' },
  { key: 'abandoned', label: 'Брошено' },
];

const emptyStateMessages: Record<UserBookStatus, string> = {
  reading: 'Вы ещё не читаете ни одной книги.',
  shelf: 'Добавьте книги на полку.',
  completed: 'Здесь появятся завершённые книги.',
  paused: 'Здесь появятся отложенные книги.',
  abandoned: 'Здесь появятся брошенные книги.',
};

export default function MyLibraryPage() {
  const navigate = useNavigate();
  const { books, loading } = useLibrary();
  const [activeStatus, setActiveStatus] = useState<UserBookStatus>('shelf');
  const [randomBookId, setRandomBookId] = useState<string | null>(null);

  const userBooks = userBookService.getByUser(CURRENT_USER_ID);
  const userBookMap = new Map(userBooks.map((ub) => [ub.bookId, ub]));

  // A/B тест для кнопки в персональной библиотеке
  const personalRandomLabel = getABTestVariant(
    'personal_random_button',
    'Рука тянется к полке...',
    'Глаза ищут книгу...'
  );

  // Статистика
  const stats = useMemo(() => {
    const counts: Record<UserBookStatus, number> = {
      reading: 0,
      shelf: 0,
      completed: 0,
      paused: 0,
      abandoned: 0,
    };
    userBooks.forEach((ub) => {
      if (ub.status in counts) {
        counts[ub.status as UserBookStatus]++;
      }
    });
    return counts;
  }, [userBooks]);

  // Книги на полке
  const shelfBooks = useMemo(() => {
    return books.filter((book) => {
      const ub = userBookMap.get(book.id);
      return ub && ub.status === 'shelf';
    });
  }, [books, userBookMap]);

  // Фильтрованные книги
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const ub = userBookMap.get(book.id);
      if (!ub) return false;
      return ub.status === activeStatus;
    });
  }, [books, userBookMap, activeStatus]);

  const handleRandomPick = useCallback(() => {
    if (shelfBooks.length < 10) return;
    const randomIndex = Math.floor(Math.random() * shelfBooks.length);
    const randomBook = shelfBooks[randomIndex];
    setRandomBookId(randomBook.id);
  }, [shelfBooks]);

  const handleTabChange = (status: UserBookStatus) => {
    setActiveStatus(status);
    setRandomBookId(null);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#97A6BA' }}>
        Загрузка...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '300', color: '#E6EDF3', marginBottom: '16px' }}>
        Моя библиотека
      </h1>

      {/* Стеклянная панель */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 12px',
          marginBottom: '24px',
          background: 'rgba(18, 28, 36, 0.4)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {statusTabs.map((tab) => {
          const isActive = activeStatus === tab.key;
          const count = stats[tab.key];

          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
                background: isActive
                  ? 'rgba(255,255,255,0.08)'
                  : 'transparent',
                border: 'none',
                color: isActive ? '#E6EDF3' : '#97A6BA',
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: 'auto',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#E6EDF3';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#97A6BA';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  color: isActive ? '#5B86A1' : '#5B86A1',
                  opacity: isActive ? 1 : 0.5,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Разделитель */}
        <span
          style={{
            width: '1px',
            height: '24px',
            background: 'rgba(255,255,255,0.06)',
            margin: '0 4px',
          }}
        />

        {/* Случайный выбор */}
        {shelfBooks.length >= 10 && (
          <button
            onClick={handleRandomPick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              background: 'rgba(91, 134, 161, 0.15)',
              border: 'none',
              color: '#5B86A1',
              cursor: 'pointer',
              transition: 'all 0.2s',
              width: 'auto',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(91, 134, 161, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(91, 134, 161, 0.15)';
            }}
          >
            🎲 {personalRandomLabel}
          </button>
        )}

        {/* Сброс случайного выбора */}
        {randomBookId && (
          <button
            onClick={() => setRandomBookId(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#97A6BA',
              cursor: 'pointer',
              transition: 'all 0.2s',
              width: 'auto',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#E6EDF3';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#97A6BA';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
            }}
          >
            ✕ Сбросить
          </button>
        )}
      </div>

      {/* Случайно выбранная книга */}
      {randomBookId && (
        <div
          style={{
            marginBottom: '24px',
            padding: '16px',
            background: 'rgba(91, 134, 161, 0.08)',
            borderRadius: '16px',
            border: '1px solid rgba(91, 134, 161, 0.2)',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: '#5B86A1',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            🎲 Случайный выбор
          </div>
          <div style={{ maxWidth: '220px' }}>
            {(() => {
              const book = books.find((b) => b.id === randomBookId);
              if (!book) return null;
              const userBook = userBookMap.get(book.id);
              return (
                <BookCard
                  book={book}
                  userBook={userBook}
                  onClick={() => navigate(`/book/${book.id}`)}
                />
              );
            })()}
          </div>
        </div>
      )}

      {/* Список книг */}
      {filteredBooks.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#5B86A1',
            fontSize: '14px',
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: '16px',
          }}
        >
          {emptyStateMessages[activeStatus]}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredBooks.map((book) => {
            const userBook = userBookMap.get(book.id);
            if (!userBook) return null;

            const isRandom = book.id === randomBookId;

            return (
              <div
                key={book.id}
                style={{
                  outline: isRandom ? '2px solid #5B86A1' : 'none',
                  borderRadius: '16px',
                  transition: 'all 0.3s',
                }}
              >
                <BookCard
                  book={book}
                  userBook={userBook}
                  onClick={() => navigate(`/book/${book.id}`)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}