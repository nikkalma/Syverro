// src/pages/Admin/Genres/GenresTable.tsx

import { Pencil, Trash2, AlertCircle, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminGenre } from '../../../types/admin';
import { useAdminStore } from '../../../store/adminStore';
import { getLocaleData, getBrowserLocale } from '../../../locales';

const GENRE_TYPE_COLORS: Record<string, string> = {
  literary: 'var(--primary)',
  non_fiction: 'var(--success)',
  spiritual: '#A855F7',
  cultural: '#FFA726',
  practical: 'var(--text-secondary)',
};

const GENRE_TYPE_BACKGROUNDS: Record<string, string> = {
  literary: 'var(--primary-soft)',
  non_fiction: 'var(--chip)',
  spiritual: '#A855F720',
  cultural: '#FFA72620',
  practical: 'var(--chip)',
};

interface GenresTableProps {
  genres: AdminGenre[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  canManage: boolean;
  allGenres: AdminGenre[];
  onEdit: (genre: AdminGenre) => void;
  onDelete: (genre: AdminGenre) => void;
  onRefresh: () => void;
}

export default function GenresTable({
  genres,
  loading,
  error,
  total,
  page,
  limit,
  canManage,
  allGenres,
  onEdit,
  onDelete,
  onRefresh,
}: GenresTableProps) {
  const { setPage } = useAdminStore();
  const t = getLocaleData(getBrowserLocale());
  const totalPages = Math.ceil(total / limit);

  const getParentName = (parentId: string | null | undefined) => {
    if (!parentId) return '—';
    const parent = allGenres.find((g) => g.id === parentId);
    return parent?.name || '—';
  };

  // ===== СКЕЛЕТОН =====
  if (loading) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="studio-table">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[t.admin.genres.name, t.admin.genres.type, t.admin.genres.parent, t.admin.genres.slug, t.admin.genres.description, t.admin.genres.books, t.admin.genres.date, t.admin.genres.actions].map((h) => (
                <th key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                {[...Array(8)].map((_, j) => (
                  <td key={j}>
                    <div style={{ height: '20px', background: 'var(--chip)', borderRadius: '4px', width: j === 7 ? '60%' : '80%' }} />
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
  if (genres.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        background: 'var(--glass-bg)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'inline-flex', color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.5 }}><Tag size={48} /></div>
        <p>{t.admin.genres.noGenres}</p>
      </div>
    );
  }

  // ===== ТАБЛИЦА =====
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="studio-table">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th>{t.admin.genres.name}</th>
            <th>{t.admin.genres.type}</th>
            <th>{t.admin.genres.parent}</th>
            <th>{t.admin.genres.slug}</th>
            <th>{t.admin.genres.description}</th>
            <th>{t.admin.genres.books}</th>
            <th>{t.admin.genres.date}</th>
            <th>{t.admin.genres.actions}</th>
          </tr>
        </thead>
        <tbody>
          {genres.map((genre) => (
            <tr
              key={genre.id}
              style={{
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                <button
                  onClick={() => onEdit(genre)}
                  title={t.admin.common.edit}
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
                  {genre.name}
                </button>
              </td>
              <td>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: GENRE_TYPE_COLORS[genre.type] || 'var(--text-secondary)',
                  background: GENRE_TYPE_BACKGROUNDS[genre.type] || 'var(--chip)',
                  border: `1px solid ${GENRE_TYPE_COLORS[genre.type] || 'var(--text-secondary)'}`,
                }}>
                  {t.admin.genreTypes[genre.type as keyof typeof t.admin.genreTypes] || genre.type}
                </span>
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {getParentName(genre.parent_id)}
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {genre.slug || '—'}
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {genre.description || '—'}
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--primary)', fontSize: '13px' }}>
                {genre.book_count || 0}
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--primary)', fontSize: '12px' }}>
                {new Date(genre.created_at).toLocaleDateString('ru-RU')}
              </td>
              <td>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {canManage && (
                    <>
                      <button
                        onClick={() => onEdit(genre)}
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
                        onClick={() => onDelete(genre)}
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
            {t.admin.common.showing} {genres.length} {t.admin.common.of} {total}
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

