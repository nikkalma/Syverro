// src/pages/Admin/Moderation/Suggestions.tsx

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, BookOpen, RefreshCw, FileText, Library, Archive, Trash2 } from 'lucide-react';

type SuggestionType = 'book' | 'fanfiction';

interface Suggestion {
  id: string;
  title: string;
  author: string;
  type: SuggestionType;
  userId: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected' | 'internal';
  createdAt: string;
  reviewedAt: string | null;
  moderatorComment: string | null;
}

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'moderation' | 'archive'>('moderation');

  const loadSuggestions = () => {
    setLoading(true);
    try {
      const data = JSON.parse(localStorage.getItem('syverro_book_suggestions') || '[]');
      setSuggestions(data);
    } catch (e) {
      console.error('Ошибка загрузки предложений:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleModerate = (id: string, status: 'approved' | 'rejected', comment?: string) => {
    const updated = suggestions.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          status,
          reviewedAt: new Date().toISOString(),
          moderatorComment: comment || null,
        };
      }
      return s;
    });
    setSuggestions(updated);
    localStorage.setItem('syverro_book_suggestions', JSON.stringify(updated));
  };

  const handleDelete = (id: string) => {
    if (!confirm('Удалить предложение навсегда?')) return;
    const updated = suggestions.filter((s) => s.id !== id);
    setSuggestions(updated);
    localStorage.setItem('syverro_book_suggestions', JSON.stringify(updated));
  };

  const pendingBooks = suggestions.filter((s) => s.type === 'book' && s.status === 'pending');
  const internalItems = suggestions.filter((s) => s.type === 'fanfiction' || s.status === 'internal');
  const approvedBooks = suggestions.filter((s) => s.type === 'book' && s.status === 'approved');
  const rejectedBooks = suggestions.filter((s) => s.type === 'book' && s.status === 'rejected');

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
        <RefreshCw size={24} className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '400', color: 'var(--text-primary)', margin: 0 }}>
          📝 Модерация
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '12px' }}>
            {pendingBooks.length} на модерации · {internalItems.length} в архиве
          </span>
        </h1>
        <button
          onClick={loadSuggestions}
          className="glass-btn"
          style={{ padding: '8px 16px' }}
        >
          <RefreshCw size={16} />
          Обновить
        </button>
      </div>

      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-soft)', paddingBottom: '4px' }}>
        <button
          onClick={() => setActiveTab('moderation')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'moderation' ? 'var(--primary)' : 'transparent',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            color: activeTab === 'moderation' ? '#FFFFFF' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s',
          }}
        >
          <Library size={16} />
          На модерацию ({pendingBooks.length})
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'archive' ? 'var(--primary)' : 'transparent',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            color: activeTab === 'archive' ? '#FFFFFF' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s',
          }}
        >
          <Archive size={16} />
          Архив ({internalItems.length})
        </button>
      </div>

      {/* ===== ВКЛАДКА: МОДЕРАЦИЯ ===== */}
      {activeTab === 'moderation' && (
        <>
          {pendingBooks.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Нет книг на модерации</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingBooks.map((s) => (
                <div key={s.id} className="glass-card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {s.author}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} /> {s.userEmail}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {new Date(s.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleModerate(s.id, 'approved')}
                        className="glass-btn glass-btn-success"
                        style={{ padding: '6px 14px', fontSize: '13px' }}
                      >
                        <CheckCircle size={16} /> Одобрить
                      </button>
                      <button
                        onClick={() => handleModerate(s.id, 'rejected')}
                        className="glass-btn glass-btn-danger"
                        style={{ padding: '6px 14px', fontSize: '13px' }}
                      >
                        <XCircle size={16} /> Отклонить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(approvedBooks.length > 0 || rejectedBooks.length > 0) && (
            <details style={{ marginTop: '8px' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px' }}>
                📜 История модерации ({approvedBooks.length + rejectedBooks.length})
              </summary>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[...approvedBooks, ...rejectedBooks]
                  .sort((a, b) => new Date(b.reviewedAt || b.createdAt).getTime() - new Date(a.reviewedAt || a.createdAt).getTime())
                  .map((s) => (
                    <div
                      key={s.id}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--surface-alt)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-soft)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{s.title}</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '8px' }}>— {s.author}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '12px' }}>
                          {s.userEmail}
                        </span>
                      </div>
                      <span
                        style={{
                          padding: '2px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: s.status === 'approved' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(239, 83, 80, 0.15)',
                          color: s.status === 'approved' ? 'var(--success)' : 'var(--error)',
                          border: `1px solid ${s.status === 'approved' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(239, 83, 80, 0.2)'}`,
                        }}
                      >
                        {s.status === 'approved' ? '✅ Одобрено' : '❌ Отклонено'}
                      </span>
                    </div>
                  ))}
              </div>
            </details>
          )}
        </>
      )}

      {/* ===== ВКЛАДКА: АРХИВ ===== */}
      {activeTab === 'archive' && (
        <>
          {internalItems.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <FileText size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Нет неофициальных материалов</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {internalItems.map((s) => (
                <div key={s.id} className="glass-card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="var(--primary)" />
                        <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
                          {s.title}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {s.author}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} /> {s.userEmail}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {new Date(s.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span
                        style={{
                          padding: '4px 14px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: 'rgba(91, 134, 161, 0.15)',
                          color: 'var(--primary)',
                          border: '1px solid rgba(91, 134, 161, 0.2)',
                        }}
                      >
                        {s.status === 'internal' ? '📂 В архиве' : s.status}
                      </span>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="glass-btn"
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          color: 'var(--error)',
                          borderColor: 'rgba(239, 83, 80, 0.2)',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
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