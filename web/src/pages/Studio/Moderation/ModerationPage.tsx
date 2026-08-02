import { useEffect, useState } from 'react';
import { AdminBook, MODERATION_PIPELINE, MODERATION_STATUS_LABELS, MODERATION_STATUS_COLORS } from '../../../types/admin';
import { useAdminStore } from '../../../store/adminStore';
import { RefreshCw, CheckCircle, XCircle, Eye, Clock, BookOpen, Shield, X, Package, Send, PenLine } from 'lucide-react';
import { PUBLICATION_TYPE_COLORS, METADATA_STATUS_LABELS, METADATA_STATUS_COLORS } from '../../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import type { LocaleData } from '../../../locales';
import { apiClient } from '../../../shared/api/client';

type TabFilter = 'pending' | 'approved' | 'draft' | 'published' | 'archived' | 'all';

const getStatusLabels = (t: LocaleData) => ({
  draft: t.admin.moderation.draft,
  pending: t.admin.moderation.pending,
  approved: t.admin.moderation.approved,
  published: t.admin.moderation.published,
  archived: t.admin.moderation.archived,
});

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  draft: { bg: 'var(--chip)', color: 'var(--text-secondary)', border: 'var(--text-secondary)' },
  pending: { bg: 'var(--chip)', color: 'var(--warning)', border: 'var(--warning)' },
  approved: { bg: 'var(--chip)', color: 'var(--success)', border: 'var(--success)' },
  published: { bg: 'var(--primary-soft)', color: 'var(--primary)', border: 'var(--primary)' },
  archived: { bg: 'var(--chip)', color: 'var(--error)', border: 'var(--error)' },
};

function PipelineVisualization({ currentStatus }: { currentStatus: string }) {
  const allStages = [...MODERATION_PIPELINE, 'archived' as const];
  const currentIdx = allStages.indexOf(currentStatus as any);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      padding: '12px 16px', background: 'var(--glass-bg)',
      borderRadius: '8px', border: '1px solid var(--border-soft)',
      flexWrap: 'wrap',
    }}>
      {allStages.map((stage, idx) => {
        const isPast = currentIdx >= idx;
        const isCurrent = currentStatus === stage;
        const stageColor = MODERATION_STATUS_COLORS[stage] || 'var(--text-secondary)';
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
                background: isPast ? stageColor : 'var(--text-muted)',
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
                fontSize: '10px', color: currentIdx > idx ? stageColor : 'var(--text-muted)',
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
        <h1 style={{ fontSize: '24px', fontWeight: '400', color: 'var(--text-primary)', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} /> {t.admin.moderation.title}
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '12px' }}>
            {total} {t.admin.common.records}
          </span>
        </h1>
        <button onClick={fetchBooks} disabled={isLoading} style={{
          padding: '8px 16px', background: 'var(--chip)',
          border: '1px solid var(--border)', borderRadius: '8px',
          color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Inter, sans-serif',
        }}>
          <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
          {t.admin.common.refresh}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', paddingBottom: '4px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '8px 16px', background: activeTab === tab.key ? 'var(--primary)' : 'transparent',
            border: 'none', borderRadius: '8px 8px 0 0',
            color: activeTab === tab.key ? '#FFFFFF' : 'var(--text-secondary)', cursor: 'pointer',
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
            flex: 1, padding: '10px 16px', background: 'var(--chip)',
            border: '1px solid var(--border)', borderRadius: '8px',
            color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none',
          }} />
      </div>

      <div style={{ overflowX: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spinner" />
          </div>
        ) : books.length === 0 ? (
          <div style={{
            padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)',
            background: 'var(--glass-bg)', borderRadius: '12px',
            border: '1px solid var(--border)',
          }}>
            <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>{t.admin.moderation.noBooksForModeration}</p>
          </div>
        ) : (
          <table className="studio-table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[t.admin.books.cover, t.admin.books.name, t.admin.books.author, t.admin.moderation.type, t.admin.books.status, t.admin.moderation.pipeline, t.admin.moderation.createdDate, t.admin.books.actions].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {books.map((book) => {
                const sc = STATUS_COLORS[book.moderation_status] || STATUS_COLORS.pending;
                return (
                  <tr key={book.id} style={{ borderBottom: '1px solid var(--border-soft)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td>
                      <div style={{ width: '40px', height: '56px', borderRadius: '4px', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'var(--primary)', overflow: 'hidden' }}>
                        {book.cover ? <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📖'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>{book.title}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>{book.author}</td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '500',
                        background: `${PUBLICATION_TYPE_COLORS[book.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || 'var(--primary)'}18`,
                        color: PUBLICATION_TYPE_COLORS[book.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || 'var(--primary)',
                        border: `1px solid ${PUBLICATION_TYPE_COLORS[book.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || 'var(--primary)'}30`,
                      }}>
                        {book.publication_type === 'unofficial'
                          ? <><PenLine size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{t.admin.moderation.unofficial}</>
                          : <><BookOpen size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{t.admin.moderation.official}</>}
                      </span>
                    </td>
                    <td>
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
                    <td style={{ padding: '12px 16px', color: 'var(--primary)', fontSize: '12px' }}>
                      {new Date(book.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td>
                      <button onClick={() => openDetail(book.id)} style={{
                        padding: '4px 10px', background: 'var(--chip)',
                        border: '1px solid var(--border)', borderRadius: '6px',
                        color: 'var(--primary)', fontSize: '11px', cursor: 'pointer',
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid var(--border)', marginTop: '8px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              {t.admin.common.showing} {books.length} {t.admin.common.of} {total}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} style={{
                padding: '6px 14px', background: 'var(--chip)',
                border: '1px solid var(--border)', borderRadius: '6px',
                color: page <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: '13px',
              }}>←</button>
              <span style={{ padding: '6px 14px', color: 'var(--text-primary)', fontSize: '13px' }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} style={{
                padding: '6px 14px', background: 'var(--chip)',
                border: '1px solid var(--border)', borderRadius: '6px',
                color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
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
            background: 'var(--surface)', borderRadius: '16px', padding: '32px',
            maxWidth: '600px', width: '100%', border: '1px solid var(--border)',
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
                <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', margin: '0 0 4px 0', fontWeight: '500' }}>
                  {selectedBook.title}
                </h2>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
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
                    background: `${PUBLICATION_TYPE_COLORS[selectedBook.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || 'var(--primary)'}18`,
                    color: PUBLICATION_TYPE_COLORS[selectedBook.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || 'var(--primary)',
                    border: `1px solid ${PUBLICATION_TYPE_COLORS[selectedBook.publication_type as keyof typeof PUBLICATION_TYPE_COLORS] || 'var(--primary)'}30`,
                  }}>
                    {selectedBook.publication_type === 'unofficial'
                      ? <><PenLine size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{t.admin.moderation.unofficial}</>
                      : <><BookOpen size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{t.admin.moderation.official}</>}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '10px 14px', background: 'var(--surface-hover)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>{t.admin.books.genres}</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{selectedBook.genres?.join(', ') || '—'}</div>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--surface-hover)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>{t.admin.enrichment.pages}</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{selectedBook.total_pages || '—'}</div>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--surface-hover)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>{t.admin.metadata.title}</div>
                <div style={{
                  color: METADATA_STATUS_COLORS[selectedBook.metadata_status as keyof typeof METADATA_STATUS_COLORS] || 'var(--warning)', fontSize: '13px',
                }}>
                  {METADATA_STATUS_LABELS[selectedBook.metadata_status as keyof typeof METADATA_STATUS_LABELS] || selectedBook.metadata_status}
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--surface-hover)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>{t.admin.moderation.submittedBy}</div>
                <div style={{ color: 'var(--primary)', fontSize: '13px' }}>{selectedBook.created_by_email || '—'}</div>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--surface-hover)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>{t.admin.moderation.createdDate}</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{new Date(selectedBook.created_at).toLocaleDateString('ru-RU')}</div>
              </div>
            </div>

            {selectedBook.description && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>{t.admin.enrichment.description}</div>
                <div style={{
                  padding: '12px 16px', background: 'var(--surface-hover)', borderRadius: '8px',
                  color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap',
                }}>{selectedBook.description}</div>
              </div>
            )}

            {selectedBook.moderation_reason && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: 'var(--error)', fontSize: '12px', marginBottom: '6px' }}>{t.admin.moderation.rejectionReason}</div>
                <div style={{
                  padding: '12px 16px', background: 'var(--chip)', borderRadius: '8px',
                  color: 'var(--error)', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap',
                  border: '1px solid var(--error)',
                }}>{selectedBook.moderation_reason}</div>
              </div>
            )}

            {selectedBook.moderation_status === 'pending' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px', display: 'block' }}>
                  {t.admin.moderation.rejectionReasonOptional}
                </label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t.admin.moderation.rejectionPlaceholder}
                  style={{
                    width: '100%', minHeight: '80px', padding: '10px 14px',
                    background: 'var(--chip)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'Inter, sans-serif',
                    resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                  }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsDetailOpen(false)} style={{
                padding: '10px 20px', background: 'var(--chip)',
                border: '1px solid var(--border)', borderRadius: '8px',
                color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}>{t.admin.common.close}</button>

              {selectedBook.moderation_status === 'draft' && (
                <button onClick={() => handleAction(selectedBook.id, 'submit')} disabled={actionLoading} style={{
                  padding: '10px 20px', background: 'var(--primary)', border: 'none', borderRadius: '8px',
                  color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', opacity: actionLoading ? 0.6 : 1,
                }}> <Send size={12} /> {t.admin.moderation.submit} </button>
              )}

              {selectedBook.moderation_status === 'pending' && (
                <>
                  <button onClick={() => handleAction(selectedBook.id, 'reject')} disabled={actionLoading} style={{
                    padding: '10px 20px', background: 'var(--error)', border: 'none', borderRadius: '8px',
                    color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', opacity: actionLoading ? 0.6 : 1,
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                  }}> <> <X size={12} /> {t.admin.moderation.reject} </></button>
                  <button onClick={() => handleAction(selectedBook.id, 'approve')} disabled={actionLoading} style={{
                    padding: '10px 20px', background: 'var(--success)', border: 'none', borderRadius: '8px',
                    color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', opacity: actionLoading ? 0.6 : 1,
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                  }}> <> <CheckCircle size={14} /> {t.admin.moderation.approve}</></button>
                </>
              )}

              {selectedBook.moderation_status === 'approved' && (
                <button onClick={() => handleAction(selectedBook.id, 'publish')} disabled={actionLoading} style={{
                  padding: '10px 20px', background: 'var(--success)', border: 'none', borderRadius: '8px',
                  color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', opacity: actionLoading ? 0.6 : 1,
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}> <> <BookOpen size={12} /> {t.admin.moderation.publish} </></button>
              )}

              {selectedBook.moderation_status === 'published' && (
                <button onClick={() => handleAction(selectedBook.id, 'archive')} disabled={actionLoading} style={{
                  padding: '10px 20px', background: 'var(--warning)', border: 'none', borderRadius: '8px',
                  color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', opacity: actionLoading ? 0.6 : 1,
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}> <> <Package size={12} /> {t.admin.moderation.archive} </></button>
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
