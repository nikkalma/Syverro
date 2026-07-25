import { useEffect, useState } from 'react';
import { AdminBook, MODERATION_PIPELINE, MODERATION_STATUS_LABELS, MODERATION_STATUS_COLORS, getNextModerationStatus } from '../../../types/admin';
import { useAdminStore } from '../../../store/adminStore';
import { RefreshCw, CheckCircle, XCircle, Eye, Clock, User, BookOpen } from 'lucide-react';
import { PUBLICATION_TYPE_LABELS, PUBLICATION_TYPE_COLORS, METADATA_STATUS_LABELS, METADATA_STATUS_COLORS } from '../../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import type { LocaleData } from '../../../locales';
import { apiClient } from '../../../shared/api/client';

type TabFilter = 'pending' | 'approved' | 'draft' | 'published' | 'archived' | 'all';

const getStatusLabels = (t: LocaleData) => ({
  draft: t.admin.moderation.draft || 'Черновик',
  pending: t.admin.moderation.pending,
  approved: t.admin.moderation.approved,
  published: t.admin.moderation.published || 'Опубликована',
  archived: t.admin.moderation.archived || 'Архивирована',
});

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  draft: { bg: 'rgba(151,166,186,0.12)', color: '#97A6BA', border: 'rgba(151,166,186,0.2)' },
  pending: { bg: 'rgba(255,167,38,0.12)', color: '#FFA726', border: 'rgba(255,167,38,0.2)' },
  approved: { bg: 'rgba(76,175,80,0.12)', color: '#4CAF50', border: 'rgba(76,175,80,0.2)' },
  published: { bg: 'rgba(91,134,161,0.12)', color: '#5B86A1', border: 'rgba(91,134,161,0.2)' },
  archived: { bg: 'rgba(239,83,80,0.12)', color: '#EF5350', border: 'rgba(239,83,80,0.2)' },
};

function PipelineVisualization({ currentStatus }: { currentStatus: string }) {
  const allStages = [...MODERATION_PIPELINE, 'archived' as const];
  const currentIdx = allStages.indexOf(currentStatus as any);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      padding: '12px 16px', background: 'rgba(18,28,36,0.4)',
      borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)',
      flexWrap: 'wrap',
    }}>
      {allStages.map((stage, idx) => {
        const isPast = currentIdx >= idx;
        const isCurrent = currentStatus === stage;
        const stageColor = MODERATION_STATUS_COLORS[stage] || '#97A6BA';
        return (
          <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px', borderRadius: '6px',
              background: isCurrent ? `${stageColor}20` : 'transparent',
              border: isCurrent ? `1px solid ${stageColor}40` : '1px solid transparent',
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: isPast ? stageColor : '#2A4B60',
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: '11px', fontWeight: isCurrent ? '600' : '400',
                color: isPast ? stageColor : '#4A6B80',
              }}>
                {MODERATION_STATUS_LABELS[stage] || stage}
              </span>
            </div>
            {idx < allStages.length - 1 && (
              <span style={{
                fontSize: '10px', color: currentIdx > idx ? stageColor : '#2A4B60',
              }}>▸</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ModerationPage() {
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);
  const { page, limit, setPage, setLoading, isLoading } = useAdminStore();

  const [books, setBooks] = useState<AdminBook[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<TabFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<AdminBook | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (activeTab !== 'all') params.status = activeTab;
      if (searchQuery) params.search = searchQuery;

      const response = await apiClient.get('/admin/moderation/books', { params });
      setBooks(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [activeTab, searchQuery]);
  useEffect(() => { fetchBooks(); }, [page, limit, activeTab, searchQuery]);

  const handleAction = async (bookId: string, action: string) => {
    setActionLoading(true);
    try {
      const body = action === 'reject' ? { reason: rejectReason || null } : {};
      await apiClient.post(`/admin/moderation/books/${bookId}/${action}`, body);
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

  const openDetail = async (bookId: string) => {
    try {
      const response = await apiClient.get(`/admin/moderation/books/${bookId}`);
      setSelectedBook(response.data);
      setRejectReason('');
      setIsDetailOpen(true);
    } catch (err: any) {
      console.error(err);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const tabs: { key: TabFilter; label: string; icon: React.ReactNode }[] = [
    { key: 'draft', label: getStatusLabels(t).draft, icon: <Clock size={14} /> },
    { key: 'pending', label: getStatusLabels(t).pending, icon: <Clock size={14} /> },
    { key: 'approved', label: getStatusLabels(t).approved, icon: <CheckCircle size={14} /> },
    { key: 'published', label: getStatusLabels(t).published, icon: <CheckCircle size={14} /> },
    { key: 'archived', label: getStatusLabels(t).archived, icon: <XCircle size={14} /> },
    { key: 'all', label: t.admin.common.all, icon: <RefreshCw size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '400', color: '#E6EDF3', margin: 0 }}>
          🛡️ {t.admin.moderation.title}
          <span style={{ fontSize: '14px', color: '#97A6BA', marginLeft: '12px' }}>
            {total} {t.admin.common.records}
          </span>
        </h1>
        <button onClick={fetchBooks} disabled={isLoading} style={{
          padding: '8px 16px', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
          color: '#97A6BA', fontSize: '13px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Inter, sans-serif',
        }}>
          <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
          {t.admin.common.refresh}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '8px 16px', background: activeTab === tab.key ? '#5B86A1' : 'transparent',
            border: 'none', borderRadius: '8px 8px 0 0',
            color: activeTab === tab.key ? '#0A1118' : '#97A6BA', cursor: 'pointer',
            fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: 'Inter, sans-serif', fontWeight: activeTab === tab.key ? '500' : '400',
          }}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input type="text" placeholder={t.admin.metadata.searchPlaceholder}
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1, padding: '10px 16px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
            color: '#E6EDF3', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none',
          }} />
      </div>

      <div style={{ overflowX: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#97A6BA' }}>
            <RefreshCw size={24} className="spinner" />
          </div>
        ) : books.length === 0 ? (
          <div style={{
            padding: '60px 20px', textAlign: 'center', color: '#97A6BA',
            background: 'rgba(18, 28, 36, 0.6)', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>{t.admin.moderation.noBooksForModeration}</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Обложка', 'Название', 'Автор', 'Тип', 'Статус', 'Пайплайн', 'Дата', 'Действия'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {books.map((book) => {
                const sc = STATUS_COLORS[book.moderation_status] || STATUS_COLORS.pending;
                return (
                  <tr key={book.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ width: '40px', height: '56px', borderRadius: '4px', background: '#0A1118', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#5B86A1', overflow: 'hidden' }}>
                        {book.cover ? <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📖'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#E6EDF3', fontSize: '14px', fontWeight: '500' }}>{book.title}</td>
                    <td style={{ padding: '12px 16px', color: '#97A6BA', fontSize: '13px' }}>{book.author}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '500',
                        background: `${PUBLICATION_TYPE_COLORS[book.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || '#5B86A1'}18`,
                        color: PUBLICATION_TYPE_COLORS[book.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || '#5B86A1',
                        border: `1px solid ${PUBLICATION_TYPE_COLORS[book.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || '#5B86A1'}30`,
                      }}>
                        {book.publication_type === 'unofficial' ? `✏️ ${t.admin.moderation.unofficial}` : `📚 ${t.admin.moderation.official}`}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                        background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                      }}>
                        {MODERATION_STATUS_LABELS[book.moderation_status as keyof typeof MODERATION_STATUS_LABELS] || book.moderation_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: '300px' }}>
                      <PipelineVisualization currentStatus={book.moderation_status} />
                    </td>
                    <td style={{ padding: '12px 16px', color: '#5B86A1', fontSize: '12px' }}>
                      {new Date(book.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => openDetail(book.id)} style={{
                        padding: '4px 10px', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
                        color: '#5B86A1', fontSize: '11px', cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                        <Eye size={12} /> {t.admin.moderation.view}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '8px' }}>
            <div style={{ color: '#97A6BA', fontSize: '13px' }}>
              {t.admin.common.showing} {books.length} {t.admin.common.of} {total}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} style={{
                padding: '6px 14px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
                color: page <= 1 ? '#2A4B60' : '#97A6BA', cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: '13px',
              }}>←</button>
              <span style={{ padding: '6px 14px', color: '#E6EDF3', fontSize: '13px' }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} style={{
                padding: '6px 14px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
                color: page >= totalPages ? '#2A4B60' : '#97A6BA', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: '13px',
              }}>→</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {isDetailOpen && selectedBook && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px',
        }} onClick={() => setIsDetailOpen(false)}>
          <div style={{
            background: '#121C24', borderRadius: '16px', padding: '32px',
            maxWidth: '600px', width: '100%', border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: '80vh', overflowY: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '16px' }}>
              <PipelineVisualization currentStatus={selectedBook.moderation_status} />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              {selectedBook.cover && (
                <img src={selectedBook.cover} alt={selectedBook.title}
                  style={{ width: '80px', height: '112px', borderRadius: '8px', objectFit: 'cover' }} />
              )}
              <div style={{ flex: 1 }}>
                <h2 style={{ color: '#E6EDF3', fontSize: '20px', margin: '0 0 4px 0', fontWeight: '500' }}>
                  {selectedBook.title}
                </h2>
                <div style={{ color: '#97A6BA', fontSize: '14px', marginBottom: '8px' }}>
                  {selectedBook.author}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                    background: STATUS_COLORS[selectedBook.moderation_status]?.bg || STATUS_COLORS.pending.bg,
                    color: STATUS_COLORS[selectedBook.moderation_status]?.color || STATUS_COLORS.pending.color,
                    border: `1px solid ${STATUS_COLORS[selectedBook.moderation_status]?.border || STATUS_COLORS.pending.border}`,
                  }}>
                    {MODERATION_STATUS_LABELS[selectedBook.moderation_status as keyof typeof MODERATION_STATUS_LABELS] || selectedBook.moderation_status}
                  </span>
                  <span style={{
                    padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '500',
                    background: `${PUBLICATION_TYPE_COLORS[selectedBook.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || '#5B86A1'}18`,
                    color: PUBLICATION_TYPE_COLORS[selectedBook.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || '#5B86A1',
                    border: `1px solid ${PUBLICATION_TYPE_COLORS[selectedBook.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || '#5B86A1'}30`,
                  }}>
                    {selectedBook.publication_type === 'unofficial' ? `✏️ ${t.admin.moderation.unofficial}` : `📚 ${t.admin.moderation.official}`}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ color: '#97A6BA', fontSize: '11px', marginBottom: '4px' }}>{t.admin.books.genres}</div>
                <div style={{ color: '#E6EDF3', fontSize: '13px' }}>{selectedBook.genres?.join(', ') || '—'}</div>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ color: '#97A6BA', fontSize: '11px', marginBottom: '4px' }}>Страниц</div>
                <div style={{ color: '#E6EDF3', fontSize: '13px' }}>{selectedBook.total_pages || '—'}</div>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ color: '#97A6BA', fontSize: '11px', marginBottom: '4px' }}>{t.admin.metadata.title}</div>
                <div style={{
                  color: METADATA_STATUS_COLORS[selectedBook.metadata_status as keyof typeof METADATA_STATUS_COLORS] || '#FFA726', fontSize: '13px',
                }}>
                  {METADATA_STATUS_LABELS[selectedBook.metadata_status as keyof typeof METADATA_STATUS_LABELS] || selectedBook.metadata_status}
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ color: '#97A6BA', fontSize: '11px', marginBottom: '4px' }}>{t.admin.moderation.submittedBy}</div>
                <div style={{ color: '#5B86A1', fontSize: '13px' }}>{selectedBook.created_by_email || '—'}</div>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ color: '#97A6BA', fontSize: '11px', marginBottom: '4px' }}>Дата создания</div>
                <div style={{ color: '#E6EDF3', fontSize: '13px' }}>{new Date(selectedBook.created_at).toLocaleDateString('ru-RU')}</div>
              </div>
            </div>

            {selectedBook.description && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#97A6BA', fontSize: '12px', marginBottom: '6px' }}>{t.admin.enrichment.description}</div>
                <div style={{
                  padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                  color: '#E6EDF3', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap',
                }}>{selectedBook.description}</div>
              </div>
            )}

            {selectedBook.moderation_reason && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#EF5350', fontSize: '12px', marginBottom: '6px' }}>{t.admin.moderation.rejectionReason}</div>
                <div style={{
                  padding: '12px 16px', background: 'rgba(239,83,80,0.08)', borderRadius: '8px',
                  color: '#EF5350', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap',
                  border: '1px solid rgba(239,83,80,0.15)',
                }}>{selectedBook.moderation_reason}</div>
              </div>
            )}

            {selectedBook.moderation_status === 'pending' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#97A6BA', fontSize: '12px', marginBottom: '6px', display: 'block' }}>
                  {t.admin.moderation.rejectionReasonOptional}
                </label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t.admin.moderation.rejectionPlaceholder}
                  style={{
                    width: '100%', minHeight: '80px', padding: '10px 14px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px', color: '#E6EDF3', fontSize: '14px', fontFamily: 'Inter, sans-serif',
                    resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                  }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsDetailOpen(false)} style={{
                padding: '10px 20px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                color: '#97A6BA', fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}>{t.admin.common.close}</button>

              {selectedBook.moderation_status === 'draft' && (
                <button onClick={() => handleAction(selectedBook.id, 'submit')} disabled={actionLoading} style={{
                  padding: '10px 20px', background: '#5B86A1', border: 'none', borderRadius: '8px',
                  color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', opacity: actionLoading ? 0.6 : 1,
                }}>📨 На модерацию</button>
              )}

              {selectedBook.moderation_status === 'pending' && (
                <>
                  <button onClick={() => handleAction(selectedBook.id, 'reject')} disabled={actionLoading} style={{
                    padding: '10px 20px', background: '#EF5350', border: 'none', borderRadius: '8px',
                    color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', opacity: actionLoading ? 0.6 : 1,
                  }}>✕ {t.admin.moderation.reject}</button>
                  <button onClick={() => handleAction(selectedBook.id, 'approve')} disabled={actionLoading} style={{
                    padding: '10px 20px', background: '#4CAF50', border: 'none', borderRadius: '8px',
                    color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', opacity: actionLoading ? 0.6 : 1,
                  }}>✓ {t.admin.moderation.approve}</button>
                </>
              )}

              {selectedBook.moderation_status === 'approved' && (
                <button onClick={() => handleAction(selectedBook.id, 'publish')} disabled={actionLoading} style={{
                  padding: '10px 20px', background: '#4CAF50', border: 'none', borderRadius: '8px',
                  color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', opacity: actionLoading ? 0.6 : 1,
                }}>📗 Опубликовать</button>
              )}

              {selectedBook.moderation_status === 'published' && (
                <button onClick={() => handleAction(selectedBook.id, 'archive')} disabled={actionLoading} style={{
                  padding: '10px 20px', background: '#FFA726', border: 'none', borderRadius: '8px',
                  color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', opacity: actionLoading ? 0.6 : 1,
                }}>📦 Архивировать</button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
