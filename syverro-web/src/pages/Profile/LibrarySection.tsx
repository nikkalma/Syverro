// src/pages/Profile/LibrarySection.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnrichedBook } from '../../types/book';
import { userBookService } from '../../services/userBookService';
import { statusLabels, statusOrder, UserBookStatus } from '../../types/userBook';

const CURRENT_USER_ID = 'user_1';

interface LibrarySectionProps {
  books: EnrichedBook[];
}

function BookCard({ book, userBook, onClick }: { 
  book: EnrichedBook; 
  userBook: any; 
  onClick: () => void 
}) {
  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: '160px',
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
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
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
        {userBook.status === 'reading' && book.totalPages > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                width: `${(userBook.currentPage / book.totalPages) * 100}%`,
                height: '100%',
                background: '#5B86A1',
              }}
            />
          </div>
        )}
      </div>

      <div style={{ padding: '12px' }}>
        <div
          style={{
            fontSize: '13px',
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
            fontSize: '12px',
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
            marginTop: '4px',
            padding: '2px 10px',
            background: 'rgba(91, 134, 161, 0.15)',
            borderRadius: '12px',
            fontSize: '10px',
            color: '#5B86A1',
            display: 'inline-block',
          }}
        >
          {statusLabels[userBook.status as UserBookStatus]}
        </div>
        {userBook.status === 'reading' && book.totalPages > 0 && (
          <div
            style={{
              fontSize: '11px',
              color: '#5B86A1',
              marginTop: '4px',
            }}
          >
            {userBook.currentPage} / {book.totalPages} стр.
          </div>
        )}
      </div>
    </div>
  );
}

function ShowAllButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: '160px',
        minHeight: '240px',
        background: 'rgba(10, 17, 24, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '12px',
        border: '1px dashed rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        padding: '20px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        e.currentTarget.style.background = 'rgba(18, 28, 36, 0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.background = 'rgba(10, 17, 24, 0.4)';
      }}
    >
      <span style={{ fontSize: '32px', color: '#5B86A1' }}>→</span>
      <span
        style={{
          color: '#97A6BA',
          fontSize: '13px',
          marginTop: '8px',
          textAlign: 'center',
        }}
      >
        Показать все {count} книг
      </span>
    </div>
  );
}

export default function LibrarySection({ books }: LibrarySectionProps) {
  const navigate = useNavigate();
  const [activeStatus, setActiveStatus] = useState<UserBookStatus | 'all'>('all');

  // Получаем книги из userBookService
  const userBooks = userBookService.getByUser(CURRENT_USER_ID);
  const userBookMap = new Map(userBooks.map((ub) => [ub.bookId, ub]));

  // Фильтруем книги, которые есть в личной библиотеке
  const libraryBooks = books.filter((b) => userBookMap.has(b.id));

  // Фильтруем по активному статусу
  const filteredBooks = activeStatus === 'all'
    ? libraryBooks
    : libraryBooks.filter((b) => userBookMap.get(b.id)?.status === activeStatus);

  const statusCounts = userBooks.reduce((acc, ub) => {
    acc[ub.status] = (acc[ub.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div
      style={{
        background: 'rgba(18, 28, 36, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
      }}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: '400',
          color: '#E6EDF3',
          marginBottom: '20px',
        }}
      >
        📚 Личная библиотека
      </h2>

      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          paddingBottom: '4px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveStatus('all')}
          style={{
            padding: '10px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeStatus === 'all' ? '2px solid #5B86A1' : '2px solid transparent',
            color: activeStatus === 'all' ? '#E6EDF3' : '#97A6BA',
            fontSize: '14px',
            fontWeight: activeStatus === 'all' ? '500' : '400',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s',
          }}
        >
          Все
          <span
            style={{
              marginLeft: '8px',
              padding: '2px 8px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '12px',
              fontSize: '11px',
              color: '#97A6BA',
            }}
          >
            {libraryBooks.length}
          </span>
        </button>

        {statusOrder.map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeStatus === status ? '2px solid #5B86A1' : '2px solid transparent',
              color: activeStatus === status ? '#E6EDF3' : '#97A6BA',
              fontSize: '14px',
              fontWeight: activeStatus === status ? '500' : '400',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s',
            }}
          >
            {statusLabels[status]}
            <span
              style={{
                marginLeft: '8px',
                padding: '2px 8px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '12px',
                fontSize: '11px',
                color: '#97A6BA',
              }}
            >
              {statusCounts[status] || 0}
            </span>
          </button>
        ))}
      </div>

      {filteredBooks.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#5B86A1',
            fontSize: '14px',
          }}
        >
          {activeStatus === 'all'
            ? 'В вашей библиотеке пока нет книг'
            : `Нет книг в статусе «${statusLabels[activeStatus as UserBookStatus]}»`}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            padding: '4px 4px 12px 4px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#2A4B60 transparent',
          }}
        >
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              userBook={userBookMap.get(book.id)}
              onClick={() => navigate(`/book/${book.id}`)}
            />
          ))}
          {filteredBooks.length > 8 && (
            <ShowAllButton
              count={filteredBooks.length}
              onClick={() => navigate('/my-library')}
            />
          )}
        </div>
      )}
    </div>
  );
}