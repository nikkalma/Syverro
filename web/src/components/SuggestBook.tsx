// src/components/SuggestBook.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { BookPlus, Send, CheckCircle, AlertCircle, FileText, Library, LogIn, UserPlus, X } from 'lucide-react';

type SuggestionType = 'book' | 'fanfiction';

export function SuggestBook() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [type, setType] = useState<SuggestionType>('book');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !author.trim()) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    submitSuggestion();
  };

  const submitSuggestion = () => {
    try {
      const suggestions = JSON.parse(localStorage.getItem('syverro_book_suggestions') || '[]');
      const now = new Date().toISOString();
      
      const newSuggestion = {
        id: `suggestion_${Date.now()}`,
        title: title.trim(),
        author: author.trim(),
        type: type,
        userId: user?.id || 'anonymous',
        userEmail: user?.email || 'anonymous',
        createdAt: now,
        reviewedAt: null,
        moderatorComment: null,
      };

      if (type === 'book') {
        suggestions.push({
          ...newSuggestion,
          status: 'pending',
        });
      } else {
        suggestions.push({
          ...newSuggestion,
          status: 'internal',
        });

        const userId = user?.id || 'anonymous';
        const personalBooks = JSON.parse(localStorage.getItem(`syverro_personal_books_${userId}`) || '[]');
        personalBooks.push({
          id: `internal_${Date.now()}`,
          title: title.trim(),
          author: author.trim(),
          type: 'fanfiction',
          source: 'suggestion',
          addedAt: now,
          status: 'planned',
        });
        localStorage.setItem(`syverro_personal_books_${userId}`, JSON.stringify(personalBooks));
      }

      localStorage.setItem('syverro_book_suggestions', JSON.stringify(suggestions));

      setStatus('success');
      setTitle('');
      setAuthor('');
      setType('book');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div
      className="glass-card"
      style={{
        marginBottom: '40px',
        padding: '24px 32px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <BookPlus size={24} color="var(--primary)" />
        <h3 style={{ fontSize: '18px', fontWeight: '400', color: 'var(--text-primary)', margin: 0 }}>
          Предложить книгу
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {type === 'book' ? 'После модерации появится в каталоге' : 'Сразу появится в вашей библиотеке'}
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Название"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="syverro-input"
            style={{ flex: '1 1 200px', minWidth: '160px' }}
          />
          <input
            type="text"
            placeholder="Автор"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="syverro-input"
            style={{ flex: '1 1 180px', minWidth: '140px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: type === 'book' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '14px',
            }}
          >
            <input
              type="radio"
              name="suggestionType"
              value="book"
              checked={type === 'book'}
              onChange={() => setType('book')}
            />
            <Library size={16} />
            Книга (на модерацию)
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: type === 'fanfiction' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '14px',
            }}
          >
            <input
              type="radio"
              name="suggestionType"
              value="fanfiction"
              checked={type === 'fanfiction'}
              onChange={() => setType('fanfiction')}
            />
            <FileText size={16} />
            Неофициальная литература (сразу в вашу библиотеку)
          </label>
        </div>

        <button
          type="submit"
          className="glass-btn glass-btn-primary"
          style={{ alignSelf: 'flex-start' }}
        >
          <Send size={16} />
          Отправить
        </button>
      </form>

      {status === 'success' && (
        <div style={{ marginTop: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} />
          {type === 'book'
            ? 'Спасибо! Книга отправлена на модерацию.'
            : 'Материал добавлен в вашу библиотеку.'}
        </div>
      )}

      {status === 'error' && (
        <div style={{ marginTop: '12px', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          Заполните все поля.
        </div>
      )}

      {/* AUTH GATE DIALOG */}
      {showAuthDialog && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '20px',
          }}
          onClick={() => setShowAuthDialog(false)}
        >
          <div
            style={{
              background: '#121C24', borderRadius: '16px', padding: '32px',
              maxWidth: '400px', width: '100%', border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔐</div>
            <h3 style={{ color: '#E6EDF3', fontSize: '18px', fontWeight: '500', margin: '0 0 8px 0' }}>
              Требуется авторизация
            </h3>
            <p style={{ color: '#97A6BA', fontSize: '14px', margin: '0 0 24px 0', lineHeight: '1.5' }}>
              Чтобы предложить книгу, войдите в аккаунт или зарегистрируйтесь.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => { setShowAuthDialog(false); navigate('/login'); }}
                style={{
                  padding: '12px', background: '#5B86A1', border: 'none', borderRadius: '8px',
                  color: '#0A1118', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                <LogIn size={16} /> Войти
              </button>
              <button
                onClick={() => { setShowAuthDialog(false); navigate('/register'); }}
                style={{
                  padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px', color: '#E6EDF3', fontSize: '14px', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                <UserPlus size={16} /> Зарегистрироваться
              </button>
              <button
                onClick={() => setShowAuthDialog(false)}
                style={{
                  padding: '8px', background: 'none', border: 'none',
                  color: '#97A6BA', fontSize: '13px', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
