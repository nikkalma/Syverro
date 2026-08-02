// src/pages/Admin/Authors/AuthorsTable.tsx

import { Pencil, Trash2, AlertCircle, PenLine, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminAuthor, getAuthorDisplayName } from '../../../types/admin';
import { useAdminStore } from '../../../store/adminStore';
import { authorUrl } from '../../../shared/utils/authorUrl';
import { getLocaleData, getBrowserLocale } from '../../../locales';

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
  const t = getLocaleData(getBrowserLocale());

  // ===== СКЕЛЕТОН =====
  if (loading) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="studio-table">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[t.admin.authors.photo, t.admin.authors.name, t.admin.authors.country, t.admin.authors.books, t.admin.authors.date, t.admin.authors.actions].map((h) => (
                <th key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                {[...Array(6)].map((_, j) => (
                  <td key={j}>
                    <div style={{ height: '20px', background: 'var(--chip)', borderRadius: '4px', width: j === 0 ? '40px' : j === 5 ? '60%' : '80%' }} />
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
  if (authors.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        background: 'var(--glass-bg)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'inline-flex', color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.5 }}><PenLine size={48} /></div>
        <p>{t.admin.authors.noAuthors}</p>
      </div>
    );
  }

  // ===== ТАБЛИЦА =====
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="studio-table">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th>{t.admin.authors.photo}</th>
            <th>{t.admin.authors.name}</th>
            <th>{t.admin.authors.country}</th>
            <th>{t.admin.authors.books}</th>
            <th>{t.admin.authors.date}</th>
            <th>{t.admin.authors.actions}</th>
          </tr>
        </thead>
        <tbody>
          {authors.map((author) => (
            <tr
              key={author.id}
              style={{
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <td>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: 'var(--primary)',
                  overflow: 'hidden',
                }}>
                  {author.photo ? (
                    <img src={author.photo} alt={getAuthorDisplayName(author)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    getAuthorDisplayName(author).charAt(0).toUpperCase() || '👤'
                  )}
                </div>
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>
                <a href={authorUrl(author)} target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--primary)', textDecoration: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}>
                  {getAuthorDisplayName(author)}
                </a>
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {author.country || '—'}
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--primary)', fontSize: '13px' }}>
                {author.book_count || 0}
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--primary)', fontSize: '12px' }}>
                {new Date(author.created_at).toLocaleDateString('ru-RU')}
              </td>
              <td>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <a href={authorUrl(author)} target="_blank" rel="noopener noreferrer"
                    style={{
                      padding: '4px 10px',
                      background: 'var(--primary-soft)',
                      border: '1px solid var(--primary)',
                      borderRadius: '6px',
                      color: 'var(--primary)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      textDecoration: 'none',
                    }}>
                    {t.admin.common.view}
                  </a>
                  {canManage && (
                    <>
                      <button
                        onClick={() => onEdit(author)}
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
                        onClick={() => onDelete(author)}
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
            {t.admin.common.showing} {authors.length} {t.admin.common.of} {total}
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
