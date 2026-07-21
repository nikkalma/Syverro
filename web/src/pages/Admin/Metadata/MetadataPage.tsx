import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminBook } from '../../../types/admin';
import { useAdminStore } from '../../../store/adminStore';
import { METADATA_STATUS_LABELS, METADATA_STATUS_COLORS, ENRICHMENT_FIELD_LABELS } from '../../../types/admin';
import { RefreshCw, BookOpen, ArrowRight, Filter, Search } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.syverro.com';

type TabFilter = 'all' | 'incomplete' | 'review_ready' | 'complete';

export default function MetadataPage() {
  const { page, limit, setPage, setLoading, isLoading } = useAdminStore();
  const navigate = useNavigate();

  const [books, setBooks] = useState<AdminBook[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const token = localStorage.getItem('token');

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (activeTab !== 'all') params.set('status', activeTab);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`${API_URL}/admin/metadata/books?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Ошибка загрузки');
      const data = await response.json();
      setBooks(data.data || []);
      setTotal(data.total || 0);
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
    { key: 'all', label: 'Все' },
    { key: 'incomplete', label: 'Неполные' },
    { key: 'review_ready', label: 'На проверке' },
    { key: 'complete', label: 'Заполнены' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '400', color: '#E6EDF3', margin: 0 }}>
          📋 Метаданные книг
          <span style={{ fontSize: '14px', color: '#97A6BA', marginLeft: '12px' }}>
            {total} записей
          </span>
        </h1>
        <button
          onClick={fetchBooks}
          disabled={isLoading}
          style={{
            padding: '8px 16px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
            color: '#97A6BA', fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Inter, sans-serif',
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
          Обновить
        </button>
      </div>

      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab.key ? '#5B86A1' : 'transparent',
              border: 'none', borderRadius: '8px 8px 0 0',
              color: activeTab === tab.key ? '#0A1118' : '#97A6BA',
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
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#5B86A1' }} />
          <input
            type="text"
            placeholder="Поиск по названию или автору..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 16px 10px 36px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', color: '#E6EDF3', fontSize: '14px',
              fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
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
            <p>Нет книг, требующих обогащения</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Обложка', 'Название', 'Автор', 'Тип', 'Метаданные', 'Не хватает', 'Действие'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {books.map((book) => {
                const mc = METADATA_STATUS_COLORS[book.metadata_status] || '#97A6BA';
                const missingCount = book.missing_fields?.length || 0;
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
                    <td style={{ padding: '12px 16px', color: '#E6EDF3', fontSize: '14px', fontWeight: '500', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {book.title}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#97A6BA', fontSize: '13px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {book.author}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '500',
                        background: book.publication_type === 'unofficial' ? 'rgba(168,85,247,0.12)' : 'rgba(91,134,161,0.12)',
                        color: book.publication_type === 'unofficial' ? '#A855F7' : '#5B86A1',
                        border: `1px solid ${book.publication_type === 'unofficial' ? 'rgba(168,85,247,0.3)' : 'rgba(91,134,161,0.3)'}`,
                      }}>
                        {book.publication_type === 'unofficial' ? '✏️ Неоф.' : '📚 Оф.'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                        background: `${mc}18`, color: mc, border: `1px solid ${mc}30`,
                      }}>
                        {METADATA_STATUS_LABELS[book.metadata_status as keyof typeof METADATA_STATUS_LABELS] || book.metadata_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: missingCount > 0 ? '#FFA726' : '#4CAF50' }}>
                      {missingCount > 0 ? (
                        <span title={book.missing_fields?.join(', ')}>
                          {missingCount} полей
                        </span>
                      ) : (
                        <span>Все заполнены</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => navigate(`/admin/books/${book.id}/enrichment`)}
                        style={{
                          padding: '6px 14px', background: 'rgba(91,134,161,0.15)',
                          border: '1px solid rgba(91,134,161,0.3)', borderRadius: '6px',
                          color: '#5B86A1', fontSize: '12px', cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                      >
                        Обогатить <ArrowRight size={12} />
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

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
