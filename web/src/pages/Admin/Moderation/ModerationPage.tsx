// src/pages/Admin/Moderation/ModerationPage.tsx

import { useEffect, useState } from 'react';
import { AdminBook } from '../../../types/admin';
import { useAdminStore } from '../../../store/adminStore';
import { RefreshCw, CheckCircle, XCircle, Eye, Clock, User, BookOpen, Filter } from 'lucide-react';
import { PUBLICATION_TYPE_LABELS, PUBLICATION_TYPE_COLORS, METADATA_STATUS_LABELS, METADATA_STATUS_COLORS } from '../../../types/admin';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.syverro.com';

type TabFilter = 'pending' | 'approved' | 'rejected' | 'all';

const STATUS_LABELS: Record<string, string> = {
  pending: 'На модерации',
  approved: 'Одобрено',
  rejected: 'Отклонено',
};

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  pending: { bg: 'rgba(255,167,38,0.12)', color: '#FFA726', border: 'rgba(255,167,38,0.2)' },
  approved: { bg: 'rgba(76,175,80,0.12)', color: '#4CAF50', border: 'rgba(76,175,80,0.2)' },
  rejected: { bg: 'rgba(239,83,80,0.12)', color: '#EF5350', border: 'rgba(239,83,80,0.2)' },
};

export default function ModerationPage() {
  const { page, limit, setPage, setLoading, isLoading } = useAdminStore();

  const [books, setBooks] = useState<AdminBook[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<TabFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<AdminBook | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem('token');

  // ===== ЗАГРУЗКА =====
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (activeTab !== 'all') params.set('status', activeTab);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`${API_URL}/admin/moderation/books?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Ошибка загрузки');

      const data = await response.json();
      setBooks(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchBooks();
  }, [page, limit, activeTab, searchQuery]);

  // ===== ОДОБРЕНИЕ =====
  const handleApprove = async (bookId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/moderation/books/${bookId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Ошибка одобрения');
      setIsDetailOpen(false);
      setSelectedBook(null);
      await fetchBooks();
    } catch (err: any) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== ОТКЛОНЕНИЕ =====
  const handleReject = async (bookId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/moderation/books/${bookId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason || null }),
      });
      if (!response.ok) throw new Error('Ошибка отклонения');
      setIsDetailOpen(false);
      setSelectedBook(null);
      setRejectReason('');
      await fetchBooks();
    } catch (err: any) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== ТОЛЬКО ЛИЧНОЕ =====
  const handlePersonalOnly = async (bookId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/moderation/books/${bookId}/personal-only`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Ошибка установки личного статуса');
      setIsDetailOpen(false);
      setSelectedBook(null);
      await fetchBooks();
    } catch (err: any) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== ОТКРЫТИЕ ДЕТАЛЕЙ =====
  const openDetail = async (bookId: string) => {
    try {
      const response = await fetch(`${API_URL}/admin/moderation/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Ошибка загрузки');
      const data = await response.json();
      setSelectedBook(data);
      setRejectReason('');
      setIsDetailOpen(true);
    } catch (err: any) {
      console.error(err);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const tabs: { key: TabFilter; label: string; icon: React.ReactNode }[] = [
    { key: 'pending', label: 'На модерации', icon: <Clock size={14} /> },
    { key: 'approved', label: 'Одобрено', icon: <CheckCircle size={14} /> },
    { key: 'rejected', label: 'Отклонено', icon: <XCircle size={14} /> },
    { key: 'all', label: 'Все', icon: <Filter size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '400', color: '#E6EDF3', margin: 0 }}>
          🛡️ Модерация книг
          <span style={{ fontSize: '14px', color: '#97A6BA', marginLeft: '12px' }}>
            {total} записей
          </span>
        </h1>
        <button
          onClick={fetchBooks}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            color: '#97A6BA',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
          Обновить
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab.key ? '#5B86A1' : 'transparent',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              color: activeTab === tab.key ? '#0A1118' : '#97A6BA',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s',
              fontWeight: activeTab === tab.key ? '500' : '400',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Поиск по названию или автору..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            color: '#E6EDF3',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#97A6BA' }}>
            <RefreshCw size={24} className="spinner" />
          </div>
        ) : books.length === 0 ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#97A6BA',
            background: 'rgba(18, 28, 36, 0.6)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>Нет книг для модерации</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Обложка', 'Название', 'Автор', 'Тип', 'Отправил', 'Статус', 'Дата', 'Действия'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {books.map((book) => {
                const sc = STATUS_COLORS[book.moderation_status] || STATUS_COLORS.pending;
                return (
                  <tr
                    key={book.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{
                        width: '40px', height: '56px', borderRadius: '4px', background: '#0A1118',
                        border: '1px solid rgba(255,255,255,0.06)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                        color: '#5B86A1', overflow: 'hidden',
                      }}>
                        {book.cover ? (
                          <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : '📖'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#E6EDF3', fontSize: '14px', fontWeight: '500' }}>
                      {book.title}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#97A6BA', fontSize: '13px' }}>
                      {book.author}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '500',
                        background: `${PUBLICATION_TYPE_COLORS[book.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || '#5B86A1'}18`,
                        color: PUBLICATION_TYPE_COLORS[book.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || '#5B86A1',
                        border: `1px solid ${PUBLICATION_TYPE_COLORS[book.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || '#5B86A1'}30`,
                      }}>
                        {book.publication_type === 'unofficial' ? '✏️ Неоф.' : '📚 Оф.'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#5B86A1', fontSize: '12px' }}>
                        <User size={12} />
                        {book.created_by_email || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                        background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                      }}>
                        {STATUS_LABELS[book.moderation_status] || book.moderation_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#5B86A1', fontSize: '12px' }}>
                      {new Date(book.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => openDetail(book.id)}
                        style={{
                          padding: '4px 10px', background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
                          color: '#5B86A1', fontSize: '11px', cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '4px',
                        }}
                      >
                        <Eye size={12} /> Просмотр
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '8px',
          }}>
            <div style={{ color: '#97A6BA', fontSize: '13px' }}>
              Показано {books.length} из {total}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                style={{
                  padding: '6px 14px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
                  color: page <= 1 ? '#2A4B60' : '#97A6BA', cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif', fontSize: '13px',
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
                  padding: '6px 14px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
                  color: page >= totalPages ? '#2A4B60' : '#97A6BA', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif', fontSize: '13px',
                }}
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {isDetailOpen && selectedBook && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '20px',
          }}
          onClick={() => setIsDetailOpen(false)}
        >
          <div
            style={{
              background: '#121C24', borderRadius: '16px', padding: '32px',
              maxWidth: '600px', width: '100%', border: '1px solid rgba(255,255,255,0.08)',
              maxHeight: '80vh', overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              {selectedBook.cover && (
                <img
                  src={selectedBook.cover}
                  alt={selectedBook.title}
                  style={{ width: '80px', height: '112px', borderRadius: '8px', objectFit: 'cover' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h2 style={{ color: '#E6EDF3', fontSize: '20px', margin: '0 0 4px 0', fontWeight: '500' }}>
                  {selectedBook.title}
                </h2>
                <div style={{ color: '#97A6BA', fontSize: '14px', marginBottom: '8px' }}>
                  {selectedBook.author}
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                  background: STATUS_COLORS[selectedBook.moderation_status]?.bg || STATUS_COLORS.pending.bg,
                  color: STATUS_COLORS[selectedBook.moderation_status]?.color || STATUS_COLORS.pending.color,
                  border: `1px solid ${STATUS_COLORS[selectedBook.moderation_status]?.border || STATUS_COLORS.pending.border}`,
                }}>
                  {STATUS_LABELS[selectedBook.moderation_status] || selectedBook.moderation_status}
                </span>
                <span style={{
                  marginLeft: '8px', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '500',
                  background: `${PUBLICATION_TYPE_COLORS[selectedBook.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || '#5B86A1'}18`,
                  color: PUBLICATION_TYPE_COLORS[selectedBook.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || '#5B86A1',
                  border: `1px solid ${PUBLICATION_TYPE_COLORS[selectedBook.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || '#5B86A1'}30`,
                }}>
                  {selectedBook.publication_type === 'unofficial' ? '✏️ Неофициальная' : '📚 Официальная'}
                </span>
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ color: '#97A6BA', fontSize: '11px', marginBottom: '4px' }}>Жанры</div>
                <div style={{ color: '#E6EDF3', fontSize: '13px' }}>
                  {selectedBook.genres?.join(', ') || '—'}
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ color: '#97A6BA', fontSize: '11px', marginBottom: '4px' }}>Страниц</div>
                <div style={{ color: '#E6EDF3', fontSize: '13px' }}>
                  {selectedBook.total_pages || '—'}
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ color: '#97A6BA', fontSize: '11px', marginBottom: '4px' }}>Метаданные</div>
                <div style={{
                  color: METADATA_STATUS_COLORS[selectedBook.metadata_status as keyof typeof METADATA_STATUS_COLORS] || '#FFA726',
                  fontSize: '13px',
                }}>
                  {METADATA_STATUS_LABELS[selectedBook.metadata_status as keyof typeof METADATA_STATUS_LABELS] || selectedBook.metadata_status}
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ color: '#97A6BA', fontSize: '11px', marginBottom: '4px' }}>Отправил</div>
                <div style={{ color: '#5B86A1', fontSize: '13px' }}>
                  {selectedBook.created_by_email || '—'}
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ color: '#97A6BA', fontSize: '11px', marginBottom: '4px' }}>Дата создания</div>
                <div style={{ color: '#E6EDF3', fontSize: '13px' }}>
                  {new Date(selectedBook.created_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedBook.description && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#97A6BA', fontSize: '12px', marginBottom: '6px' }}>Описание</div>
                <div style={{
                  padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                  color: '#E6EDF3', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap',
                }}>
                  {selectedBook.description}
                </div>
              </div>
            )}

            {/* Previous rejection reason */}
            {selectedBook.moderation_status === 'rejected' && selectedBook.moderation_reason && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#EF5350', fontSize: '12px', marginBottom: '6px' }}>Причина отклонения</div>
                <div style={{
                  padding: '12px 16px', background: 'rgba(239,83,80,0.08)', borderRadius: '8px',
                  color: '#EF5350', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap',
                  border: '1px solid rgba(239,83,80,0.15)',
                }}>
                  {selectedBook.moderation_reason}
                </div>
              </div>
            )}

            {/* Reject reason input (only for pending) */}
            {selectedBook.moderation_status === 'pending' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#97A6BA', fontSize: '12px', marginBottom: '6px', display: 'block' }}>
                  Причина отклонения (необязательно)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Укажите причину отклонения..."
                  style={{
                    width: '100%', minHeight: '80px', padding: '10px 14px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px', color: '#E6EDF3', fontSize: '14px', fontFamily: 'Inter, sans-serif',
                    resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsDetailOpen(false)}
                style={{
                  padding: '10px 20px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                  color: '#97A6BA', fontSize: '14px', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Закрыть
              </button>
              {selectedBook.moderation_status === 'pending' && (
                <>
                  <button
                    onClick={() => handleReject(selectedBook.id)}
                    disabled={actionLoading}
                    style={{
                      padding: '10px 20px', background: '#EF5350', border: 'none', borderRadius: '8px',
                      color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif', opacity: actionLoading ? 0.6 : 1,
                    }}
                  >
                    ✕ Отклонить
                  </button>
                  {selectedBook.publication_type === 'unofficial' && (
                    <button
                      onClick={() => handlePersonalOnly(selectedBook.id)}
                      disabled={actionLoading}
                      style={{
                        padding: '10px 20px', background: '#A855F7', border: 'none', borderRadius: '8px',
                        color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif', opacity: actionLoading ? 0.6 : 1,
                      }}
                    >
                      🔒 Только личное
                    </button>
                  )}
                  <button
                    onClick={() => handleApprove(selectedBook.id)}
                    disabled={actionLoading}
                    style={{
                      padding: '10px 20px', background: '#4CAF50', border: 'none', borderRadius: '8px',
                      color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif', opacity: actionLoading ? 0.6 : 1,
                    }}
                  >
                    ✓ Одобрить
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
