// src/pages/Admin/Authors/AuthorsTable.tsx

import { AdminAuthor } from '../../../types/admin';
import { useAdminStore } from '../../../store/adminStore';

interface AuthorsTableProps {
  authors: AdminAuthor[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  canManage: boolean;
  onEdit: (author: AdminAuthor) => void;
  onDelete: (author: AdminAuthor) => void;
  onRefresh: () => void;
}

export default function AuthorsTable({
  authors,
  loading,
  error,
  total,
  page,
  limit,
  canManage,
  onEdit,
  onDelete,
  onRefresh,
}: AuthorsTableProps) {
  const { setPage } = useAdminStore();
  const totalPages = Math.ceil(total / limit);

  // ===== СКЕЛЕТОН =====
  if (loading) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Фото', 'Имя', 'Страна', 'Книг', 'Дата', 'Действия'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {[...Array(6)].map((_, j) => (
                  <td key={j} style={{ padding: '12px 16px' }}>
                    <div style={{ height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: j === 0 ? '40px' : j === 5 ? '60%' : '80%' }} />
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
  if (authors.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#97A6BA',
        background: 'rgba(18, 28, 36, 0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>✍️</div>
        <p>Авторы не найдены</p>
      </div>
    );
  }

  // ===== ТАБЛИЦА =====
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Фото</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Имя</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Страна</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Книг</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Дата</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {authors.map((author) => (
            <tr
              key={author.id}
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
                  height: '40px',
                  borderRadius: '50%',
                  background: '#0A1118',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: '#5B86A1',
                  overflow: 'hidden',
                }}>
                  {author.photo ? (
                    <img src={author.photo} alt={author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    author.name?.charAt(0).toUpperCase() || '👤'
                  )}
                </div>
              </td>
              <td style={{ padding: '12px 16px', color: '#E6EDF3', fontSize: '14px', fontWeight: '500' }}>
                {author.name}
              </td>
              <td style={{ padding: '12px 16px', color: '#97A6BA', fontSize: '13px' }}>
                {author.country || '—'}
              </td>
              <td style={{ padding: '12px 16px', color: '#5B86A1', fontSize: '13px' }}>
                {author.book_count || 0}
              </td>
              <td style={{ padding: '12px 16px', color: '#5B86A1', fontSize: '12px' }}>
                {new Date(author.created_at).toLocaleDateString('ru-RU')}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {canManage && (
                    <>
                      <button
                        onClick={() => onEdit(author)}
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
                        onClick={() => onDelete(author)}
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
            Показано {authors.length} из {total}
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