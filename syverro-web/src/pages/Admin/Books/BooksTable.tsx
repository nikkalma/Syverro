// src/pages/Admin/Books/BooksTable.tsx

import { AdminBook } from '../../../types/admin';
import { useAdminStore } from '../../../store/adminStore';

interface BooksTableProps {
  books: AdminBook[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  canManage: boolean;
  onEdit: (book: AdminBook) => void;
  onDelete: (book: AdminBook) => void;
  onTogglePublish: (id: string, isPublished: boolean) => void;
  onRefresh: () => void;
}

export default function BooksTable({
  books,
  loading,
  error,
  total,
  page,
  limit,
  canManage,
  onEdit,
  onDelete,
  onTogglePublish,
  onRefresh,
}: BooksTableProps) {
  const { setPage, setLimit } = useAdminStore();
  const totalPages = Math.ceil(total / limit);

  // ===== СКЕЛЕТОН =====
  if (loading) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Обложка', 'Название', 'Автор', 'Жанры', 'Статус', 'Дата', 'Действия'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {[...Array(7)].map((_, j) => (
                  <td key={j} style={{ padding: '12px 16px' }}>
                    <div style={{ height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: j === 0 ? '40px' : j === 6 ? '60%' : '80%' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ===== ОШИБКА =====
  if (error) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#EF5350',
        background: 'rgba(18, 28, 36, 0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(239,83,80,0.2)',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
        <p>{error}</p>
        <button
          onClick={onRefresh}
          style={{
            marginTop: '12px',
            padding: '8px 20px',
            background: '#5B86A1',
            border: 'none',
            borderRadius: '8px',
            color: '#0A1118',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Повторить
        </button>
      </div>
    );
  }

  // ===== ПУСТО =====
  if (books.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#97A6BA',
        background: 'rgba(18, 28, 36, 0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
        <p>Книги не найдены</p>
      </div>
    );
  }

  // ===== ТАБЛИЦА =====
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Обложка</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Название</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Автор</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Жанры</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Статус</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Дата</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr
              key={book.id}
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={{ padding: '12px 16px' }}>
                <div style={{
                  width: '40px',
                  height: '56px',
                  borderRadius: '4px',
                  background: '#0A1118',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: '#5B86A1',
                  overflow: 'hidden',
                }}>
                  {book.cover ? (
                    <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    '📖'
                  )}
                </div>
              </td>
              <td style={{ padding: '12px 16px', color: '#E6EDF3', fontSize: '14px', fontWeight: '500' }}>
                {book.title}
              </td>
              <td style={{ padding: '12px 16px', color: '#97A6BA', fontSize: '13px' }}>
                {book.author}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {book.genres?.slice(0, 3).map((genre) => (
                    <span
                      key={genre}
                      style={{
                        padding: '2px 8px',
                        background: 'rgba(91, 134, 161, 0.1)',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#5B86A1',
                        border: '1px solid rgba(91, 134, 161, 0.1)',
                      }}
                    >
                      {genre}
                    </span>
                  ))}
                  {book.genres && book.genres.length > 3 && (
                    <span style={{ color: '#5B86A1', fontSize: '11px' }}>+{book.genres.length - 3}</span>
                  )}
                </div>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: book.is_published ? '#4CAF50' : '#97A6BA',
                  background: book.is_published ? 'rgba(76,175,80,0.1)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${book.is_published ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  {book.is_published ? '📗 Опубликована' : '📕 Черновик'}
                </span>
              </td>
              <td style={{ padding: '12px 16px', color: '#5B86A1', fontSize: '12px' }}>
                {new Date(book.created_at).toLocaleDateString('ru-RU')}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {canManage && (
                    <>
                      <button
                        onClick={() => onTogglePublish(book.id, book.is_published)}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          color: book.is_published ? '#FFA726' : '#4CAF50',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {book.is_published ? '🔒 Скрыть' : '📢 Опубликовать'}
                      </button>
                      <button
                        onClick={() => onEdit(book)}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          color: '#5B86A1',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDelete(book)}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(239,83,80,0.1)',
                          border: '1px solid rgba(239,83,80,0.2)',
                          borderRadius: '6px',
                          color: '#EF5350',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== ПАГИНАЦИЯ ===== */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 0',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          marginTop: '8px',
        }}>
          <div style={{ color: '#97A6BA', fontSize: '13px' }}>
            Показано {books.length} из {total}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              style={{
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                color: page <= 1 ? '#2A4B60' : '#97A6BA',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
              }}
            >
              ←
            </button>
            <span style={{ padding: '6px 14px', color: '#E6EDF3', fontSize: '13px' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              style={{
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                color: page >= totalPages ? '#2A4B60' : '#97A6BA',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
              }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}