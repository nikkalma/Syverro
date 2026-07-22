// src/pages/Admin/Genres/GenresTable.tsx

import { AdminGenre } from '../../../types/admin';
import { useAdminStore } from '../../../store/adminStore';
import { getLocaleData, getBrowserLocale } from '../../../locales';

const GENRE_TYPE_COLORS: Record<string, string> = {
  literary: '#5B86A1',
  non_fiction: '#4CAF50',
  spiritual: '#A855F7',
  cultural: '#FFA726',
  practical: '#97A6BA',
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

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '—';
    const parent = allGenres.find((g) => g.id === parentId);
    return parent?.name || '—';
  };

  // ===== СКЕЛЕТОН =====
  if (loading) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {[t.admin.genres.name, t.admin.genres.type, t.admin.genres.parent, t.admin.genres.slug, t.admin.genres.description, t.admin.genres.books, t.admin.genres.date, t.admin.genres.actions].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {[...Array(8)].map((_, j) => (
                  <td key={j} style={{ padding: '12px 16px' }}>
                    <div style={{ height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: j === 7 ? '60%' : '80%' }} />
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
        color: '#97A6BA',
        background: 'rgba(18, 28, 36, 0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏷️</div>
        <p>{t.admin.genres.noGenres}</p>
      </div>
    );
  }

  // ===== ТАБЛИЦА =====
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>{t.admin.genres.name}</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>{t.admin.genres.type}</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>{t.admin.genres.parent}</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>{t.admin.genres.slug}</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>{t.admin.genres.description}</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>{t.admin.genres.books}</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>{t.admin.genres.date}</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>{t.admin.genres.actions}</th>
          </tr>
        </thead>
        <tbody>
          {genres.map((genre) => (
            <tr
              key={genre.id}
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={{ padding: '12px 16px', color: '#E6EDF3', fontSize: '14px', fontWeight: '500' }}>
                {genre.name}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: GENRE_TYPE_COLORS[genre.type] || '#97A6BA',
                  background: `${GENRE_TYPE_COLORS[genre.type] || '#97A6BA'}20`,
                  border: `1px solid ${GENRE_TYPE_COLORS[genre.type] || '#97A6BA'}30`,
                }}>
                  {t.admin.genreTypes[genre.type as keyof typeof t.admin.genreTypes] || genre.type}
                </span>
              </td>
              <td style={{ padding: '12px 16px', color: '#97A6BA', fontSize: '13px' }}>
                {getParentName(genre.parent_id)}
              </td>
              <td style={{ padding: '12px 16px', color: '#97A6BA', fontSize: '13px' }}>
                {genre.slug || '—'}
              </td>
              <td style={{ padding: '12px 16px', color: '#97A6BA', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {genre.description || '—'}
              </td>
              <td style={{ padding: '12px 16px', color: '#5B86A1', fontSize: '13px' }}>
                {genre.book_count || 0}
              </td>
              <td style={{ padding: '12px 16px', color: '#5B86A1', fontSize: '12px' }}>
                {new Date(genre.created_at).toLocaleDateString('ru-RU')}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {canManage && (
                    <>
                      <button
                        onClick={() => onEdit(genre)}
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
                        onClick={() => onDelete(genre)}
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
            {t.admin.common.showing} {genres.length} {t.admin.common.of} {total}
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

