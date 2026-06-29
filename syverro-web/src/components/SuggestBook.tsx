// src/components/SuggestBook.tsx

import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { BookPlus, Send, CheckCircle, AlertCircle, FileText, Library } from 'lucide-react';

type SuggestionType = 'book' | 'fanfiction';

export function SuggestBook() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [type, setType] = useState<SuggestionType>('book');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !author.trim()) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    try {
      const suggestions = JSON.parse(localStorage.getItem('syverro_book_suggestions') || '[]');
      suggestions.push({
        id: `suggestion_${Date.now()}`,
        title: title.trim(),
        author: author.trim(),
        type: type,
        userId: user?.id || 'anonymous',
        userEmail: user?.email || 'anonymous',
        status: type === 'book' ? 'pending' : 'internal', // ← важное отличие!
        createdAt: new Date().toISOString(),
        reviewedAt: null,
        moderatorComment: null,
      });
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
          {type === 'book' ? 'После модерации появится в каталоге' : 'Сохранится в архиве'}
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Название книги"
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
            Книга
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
            Неофициальная литература (фанфикшн, рукописи, черновики)
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
            : 'Спасибо! Материал сохранён в архиве.'}
        </div>
      )}

      {status === 'error' && (
        <div style={{ marginTop: '12px', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          Заполните все поля.
        </div>
      )}
    </div>
  );
}