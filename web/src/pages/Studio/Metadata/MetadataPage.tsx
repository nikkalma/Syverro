import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminBook } from '../../../types/admin';
import { useAdminStore } from '../../../store/adminStore';
import { METADATA_STATUS_LABELS, METADATA_STATUS_COLORS } from '../../../types/admin';
import { RefreshCw, BookOpen, ArrowRight, Search, ScanSearch, ChevronLeft, ChevronRight } from 'lucide-react';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import { apiClient } from '../../../shared/api/client';

type TabFilter = 'all' | 'incomplete' | 'review_ready' | 'complete';

export default function MetadataPage() {
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);
  const { page, limit, setPage, setLoading, isLoading } = useAdminStore();
  const navigate = useNavigate();

  const [books, setBooks] = useState<AdminBook[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (activeTab !== 'all') params.status = activeTab;
      if (searchQuery) params.search = searchQuery;

      const response = await apiClient.get('/admin/metadata/books', { params });
      setBooks(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [activeTab, searchQuery]);
  useEffect(() => { fetchBooks(); }, [page, limit, activeTab, searchQuery]);

  const totalPages = Math.ceil(total / limit);

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: t.admin.common.all },
    { key: 'incomplete', label: t.admin.metadata.incomplete },
    { key: 'review_ready', label: t.admin.metadata.reviewReady },
    { key: 'complete', label: t.admin.metadata.complete },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '400', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ display: 'inline-flex', color: 'var(--primary)' }}><ScanSearch size={20} /></span>
          {t.admin.metadata.title}
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '12px' }}>
            {total} {t.admin.common.records}
          </span>
        </h1>
        <button
          onClick={fetchBooks}
          disabled={isLoading}
          style={{
            padding: '8px 16px', background: 'var(--chip)',
            border: '1px solid var(--border)', borderRadius: '8px',
            color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Inter, sans-serif',
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
          {t.admin.common.refresh}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', paddingBottom: '4px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab.key ? 'var(--primary)' : 'transparent',
              border: 'none', borderRadius: '8px 8px 0 0',
              color: activeTab === tab.key ? '#FFFFFF' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '13px', fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s', fontWeight: activeTab === tab.key ? '500' : '400',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
          <input
            type="text"
            placeholder={t.admin.metadata.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 16px 10px 36px',
              background: 'var(--chip)', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px',
              fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
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
            <p>{t.admin.metadata.noBooksToEnrich}</p>
          </div>
        ) : (
          <table className="studio-table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[t.admin.books.cover, t.admin.books.name, t.admin.books.author, t.admin.genres.type, t.admin.metadata.title, t.admin.enrichment.missing, t.admin.books.actions].map((h) => (
                  <th key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {books.map((book) => {
                const mc = METADATA_STATUS_COLORS[book.metadata_status] || 'var(--text-secondary)';
                const missingCount = book.missing_fields?.length || 0;
                return (
                  <tr
                    key={book.id}
                    style={{ borderBottom: '1px solid var(--border-soft)', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td>
                      <div style={{
                        width: '40px', height: '56px', borderRadius: '4px', background: 'var(--bg)',
                        border: '1px solid var(--border)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                        color: 'var(--primary)', overflow: 'hidden',
                      }}>
                        {book.cover ? (
                          <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : '📖'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {book.title}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {book.author}
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '500',
                        background: book.publication_type === 'unofficial' ? 'rgba(168,85,247,0.12)' : 'var(--primary-soft)',
                        color: book.publication_type === 'unofficial' ? '#A855F7' : 'var(--primary)',
                        border: `1px solid ${book.publication_type === 'unofficial' ? 'rgba(168,85,247,0.3)' : 'var(--primary)'}`,
                      }}>
                        {book.publication_type === 'unofficial' ? t.admin.metadata.unofficialShort : t.admin.metadata.officialShort}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                        background: `${mc}18`, color: mc, border: `1px solid ${mc}30`,
                      }}>
                        {METADATA_STATUS_LABELS[book.metadata_status as keyof typeof METADATA_STATUS_LABELS] || book.metadata_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: missingCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
                      {missingCount > 0 ? (
                        <span title={book.missing_fields?.join(', ')}>
                          {missingCount} {t.admin.metadata.missingFields}
                        </span>
                      ) : (
                        <span>{t.admin.metadata.allComplete}</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/admin/books/${book.id}/enrichment`)}
                        style={{
                          padding: '6px 14px', background: 'var(--primary-soft)',
                          border: '1px solid var(--primary)', borderRadius: '6px',
                          color: 'var(--primary)', fontSize: '12px', cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                      >
                        {t.admin.metadata.enrich} <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 0', borderTop: '1px solid var(--border)', marginTop: '8px',
          }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              {t.admin.common.showing} {books.length} {t.admin.common.of} {total}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                style={{
                  padding: '6px 14px', background: 'var(--chip)',
                  border: '1px solid var(--border)', borderRadius: '6px',
                  color: page <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif', fontSize: '13px',
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
                  padding: '6px 14px', background: 'var(--chip)',
                  border: '1px solid var(--border)', borderRadius: '6px',
                  color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif', fontSize: '13px',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
