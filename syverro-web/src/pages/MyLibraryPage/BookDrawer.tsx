// src/pages/MyLibraryPage/BookDrawer.tsx
import { useEffect, useState } from 'react';
import { EnrichedBook } from '../../types/book';
import { UserBook, UserBookStatus, statusLabels, statusOrder } from '../../types/userBook';
import { useLibraryStore } from '../../store/libraryStore';

interface BookDrawerProps {
  bookId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (bookId: string, status: UserBookStatus) => void;
  onProgressChange: (bookId: string, progress: number) => void;
  onRemove: (bookId: string) => void;
}

export default function BookDrawer({
  bookId,
  isOpen,
  onClose,
  onStatusChange,
  onProgressChange,
  onRemove,
}: BookDrawerProps) {
  const { books, userBooks } = useLibraryStore();
  const [book, setBook] = useState<EnrichedBook | null>(null);
  const [userBook, setUserBook] = useState<UserBook | null>(null);

  useEffect(() => {
    if (!bookId) return;
    const found = books.find((b: EnrichedBook) => b.id === bookId);
    setBook(found || null);
    if (found) {
      const ub = userBooks.find((u: UserBook) => u.bookId === bookId);
      setUserBook(ub || null);
    }
  }, [bookId, books, userBooks]);

  if (!isOpen || !book || !userBook) return null;

  const progress = book.totalPages > 0
    ? Math.round((userBook.currentPage / book.totalPages) * 100)
    : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '480px',
          maxWidth: '90vw',
          height: '100%',
          background: 'rgba(11, 18, 32, 0.98)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          padding: '32px 24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            alignSelf: 'flex-end',
            background: 'none',
            border: 'none',
            color: '#97A6BA',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ✕
        </button>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div
            style={{
              width: '120px',
              aspectRatio: '2/3',
              background: 'linear-gradient(135deg, rgba(26,40,50,0.8), rgba(15,26,34,0.8))',
              borderRadius: '8px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              opacity: 0.5,
            }}
          >
            📖
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '400', color: '#E6EDF3' }}>
              {book.title}
            </h2>
            <p style={{ fontSize: '16px', color: '#97A6BA' }}>{book.author}</p>
            {book.genres && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                {book.genres.slice(0, 3).map((g: string) => (
                  <span
                    key={g}
                    style={{
                      fontSize: '11px',
                      padding: '2px 10px',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: '12px',
                      color: '#5B86A1',
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '13px', color: '#97A6BA', display: 'block', marginBottom: '6px' }}>
            Статус
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {statusOrder.map((status: UserBookStatus) => (
              <button
                key={status}
                onClick={() => onStatusChange(book.id, status)}
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  borderRadius: '20px',
                  background: userBook.status === status
                    ? 'rgba(91, 134, 161, 0.25)'
                    : 'rgba(255,255,255,0.04)',
                  border: userBook.status === status
                    ? '1px solid rgba(91, 134, 161, 0.3)'
                    : '1px solid rgba(255,255,255,0.06)',
                  color: userBook.status === status ? '#E6EDF3' : '#97A6BA',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.2s',
                }}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>
        </div>

        {book.totalPages > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', color: '#97A6BA' }}>Прогресс</label>
              <span style={{ fontSize: '13px', color: '#5B86A1' }}>
                {userBook.currentPage} / {book.totalPages} стр.
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={book.totalPages}
              value={userBook.currentPage}
              onChange={(e) => onProgressChange(book.id, parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '4px',
                appearance: 'none',
                outline: 'none',
              }}
            />
            <div style={{ textAlign: 'center', fontSize: '14px', color: '#5B86A1', marginTop: '4px' }}>
              {progress}%
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            onClick={() => onStatusChange(book.id, 'reading')}
            style={{
              flex: 1,
              padding: '10px',
              background: 'rgba(91, 134, 161, 0.15)',
              border: '1px solid rgba(91, 134, 161, 0.2)',
              borderRadius: '8px',
              color: '#5B86A1',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            📖 Читать
          </button>
          <button
            onClick={() => onStatusChange(book.id, 'completed')}
            style={{
              flex: 1,
              padding: '10px',
              background: 'rgba(76, 175, 80, 0.15)',
              border: '1px solid rgba(76, 175, 80, 0.2)',
              borderRadius: '8px',
              color: '#4CAF50',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            ✅ Прочитано
          </button>
          <button
            onClick={() => onRemove(book.id)}
            style={{
              flex: 1,
              padding: '10px',
              background: 'rgba(239, 83, 80, 0.15)',
              border: '1px solid rgba(239, 83, 80, 0.2)',
              borderRadius: '8px',
              color: '#EF5350',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            ✕ Удалить
          </button>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}