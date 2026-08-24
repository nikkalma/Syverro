// src/pages/Admin/Books/BooksTable.tsx

import { Clock, BookOpen, EyeOff, Pencil, Trash2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminBook, MODERATION_STATUS_COLORS } from '../../../types/admin';
import { useAdminStore } from '../../../store/adminStore';
import { getLocaleData, getBrowserLocale } from '../../../locales';

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
  const { setPage } = useAdminStore();
  const totalPages = Math.ceil(total / limit);
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);

  const statusLabel = (status: string) => {
    switch (status) {
      case 'draft': return t.admin.moderation.draft;
      case 'pending': return t.admin.moderation.pending;
      case 'approved': return t.admin.moderation.approved;
      case 'published': return t.admin.moderation.published;
      case 'archived': return t.admin.moderation.archived;
      default: return status;
    }
  };

  // ===== СКЕЛЕТОН =====
  if (loading) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="studio-table">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[t.admin.books.cover, t.admin.books.name, t.admin.books.author, t.admin.books.genres, t.admin.books.status, t.admin.books.date, t.admin.books.actions].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '500' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                {[...Array(7)].map((_, j) => (
                  <td key={j}>
                    <div style={{ height: '20px', background: 'var(--chip)', borderRadius: '4px', width: j === 0 ? '40px' : j === 6 ? '60%' : '80%' }} />
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
        color: 'var(--error)',
        background: 'var(--glass-bg)',
        borderRadius: '12px',
        border: '1px solid var(--error)',
      }}>
        <div style={{ display: 'inline-flex', color: 'var(--error)', marginBottom: '12px' }}><AlertCircle size={32} /></div>
        <p>{error}</p>
        <button
          onClick={onRefresh}
          style={{
            marginTop: '12px',
            padding: '8px 20px',
            background: 'var(--primary)',
            border: 'none',
            borderRadius: '8px',
            color: '#FFFFFF',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {t.admin.common.retry}
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
        color: 'var(--text-secondary)',
        background: 'var(--glass-bg)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'inline-flex', color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.5 }}><BookOpen size={48} /></div>
        <p>{t.admin.books.noBooks}</p>
      </div>
    );
  }

  // ===== ТАБЛИЦА =====
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="studio-table">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '500' }}>{t.admin.books.cover}</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '500' }}>{t.admin.books.name}</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '500' }}>{t.admin.books.author}</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '500' }}>{t.admin.books.genres}</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '500' }}>{t.admin.books.status}</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '500' }}>{t.admin.books.date}</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '500' }}>{t.admin.books.actions}</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id}>
              <td>
                <div style={{
                  width: '40px',
                  height: '56px',
                  borderRadius: '4px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: 'var(--primary)',
                  overflow: 'hidden',
                }}>
                  {book.cover ? (
                    <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    '📖'
                  )}
                </div>
              </td>
              <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                <button
                  onClick={() => onEdit(book)}
                  title={t.admin.books.name}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                >
                  {book.title}
                </button>
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {book.author}
              </td>
              <td>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {book.genres?.slice(0, 3).map((genre) => (
                    <span
                      key={genre}
                      style={{
                        padding: '2px 8px',
                        background: 'var(--primary-soft)',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: 'var(--primary)',
                        border: '1px solid var(--primary)',
                      }}
                    >
                      {genre}
                    </span>
                  ))}
                  {book.genres && book.genres.length > 3 && (
                    <span style={{ color: 'var(--primary)', fontSize: '11px' }}>+{book.genres.length - 3}</span>
                  )}
                </div>
              </td>
              <td>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: MODERATION_STATUS_COLORS[book.moderation_status as keyof typeof MODERATION_STATUS_COLORS] || '#97A6BA',
                  background: `${MODERATION_STATUS_COLORS[book.moderation_status as keyof typeof MODERATION_STATUS_COLORS] || '#97A6BA'}18`,
                  border: `1px solid ${MODERATION_STATUS_COLORS[book.moderation_status as keyof typeof MODERATION_STATUS_COLORS] || '#97A6BA'}30`,
                }}>
                  {statusLabel(book.moderation_status)}
                </span>
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--primary)', fontSize: '12px' }}>
                {new Date(book.created_at).toLocaleDateString('ru-RU')}
              </td>
              <td>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {canManage && (
                    <>
                      {book.moderation_status === 'approved' ? <button
                        onClick={() => onTogglePublish(book.id, book.is_published)}
                        style={{
                          padding: '4px 10px',
                          background: 'var(--chip)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: book.is_published ? '#FFA726' : 'var(--success)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {book.is_published
                          ? <><EyeOff size={12} /> {t.admin.workspace.hidden}</>
                          : <><BookOpen size={12} /> {t.admin.books.publish}</>}
                      </button> : (
                        <span style={{ padding: '4px 10px', color: 'var(--text-muted)', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {book.moderation_status === 'pending' ? t.admin.books.awaiting : t.admin.moderation.rejected}
                        </span>
                      )}
                      <button
                        onClick={() => onEdit(book)}
                        title={t.admin.common.edit}
                        style={{
                          padding: '4px 10px',
                          background: 'var(--chip)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: 'var(--primary)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(book)}
                        title={t.admin.common.delete}
                        style={{
                          padding: '4px 10px',
                          background: 'var(--chip)',
                          border: '1px solid var(--error)',
                          borderRadius: '6px',
                          color: 'var(--error)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={14} />
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
          borderTop: '1px solid var(--border)',
          marginTop: '8px',
        }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {t.admin.common.showing} {books.length} {t.admin.common.of} {total}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              style={{
                padding: '6px 14px',
                background: 'var(--chip)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: page <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ padding: '6px 14px', color: 'var(--text-primary)', fontSize: '13px' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              style={{
                padding: '6px 14px',
                background: 'var(--chip)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
