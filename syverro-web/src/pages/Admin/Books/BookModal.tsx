// src/pages/Admin/Books/BookModal.tsx

import { useState, useEffect } from 'react';
import { AdminBook } from '../../../types/admin';

interface BookModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  book: AdminBook | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function BookModal({ isOpen, mode, book, onClose, onSave }: BookModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    cover: '',
    genres: [] as string[],
    total_pages: '',
    description: '',
    is_published: false,
  });
  const [genreInput, setGenreInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        cover: book.cover || '',
        genres: book.genres || [],
        total_pages: book.total_pages?.toString() || '',
        description: book.description || '',
        is_published: book.is_published || false,
      });
    } else {
      setFormData({
        title: '',
        author: '',
        cover: '',
        genres: [],
        total_pages: '',
        description: '',
        is_published: false,
      });
    }
    setGenreInput('');
    setError(null);
  }, [mode, book, isOpen]);

  if (!isOpen) return null;

  const handleAddGenre = () => {
    const trimmed = genreInput.trim();
    if (trimmed && !formData.genres.includes(trimmed)) {
      setFormData({ ...formData, genres: [...formData.genres, trimmed] });
      setGenreInput('');
    }
  };

  const handleRemoveGenre = (genre: string) => {
    setFormData({
      ...formData,
      genres: formData.genres.filter((g) => g !== genre),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        cover: formData.cover.trim() || null,
        genres: formData.genres,
        total_pages: formData.total_pages ? parseInt(formData.total_pages) : null,
        description: formData.description.trim() || null,
        is_published: formData.is_published,
      };

      if (!submitData.title) {
        throw new Error('Название обязательно');
      }
      if (!submitData.author) {
        throw new Error('Автор обязателен');
      }

      onSave(submitData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#121C24',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#E6EDF3', fontSize: '22px', fontWeight: '400', margin: 0 }}>
            {mode === 'create' ? '➕ Новая книга' : '✏️ Редактировать книгу'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#97A6BA',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ===== НАЗВАНИЕ ===== */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Название *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Введите название книги"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#E6EDF3',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
              }}
            />
          </div>

          {/* ===== АВТОР ===== */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Автор *
            </label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="Введите имя автора"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#E6EDF3',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
              }}
            />
          </div>

          {/* ===== ОБЛОЖКА ===== */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Обложка (URL)
            </label>
            <input
              type="url"
              value={formData.cover}
              onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
              placeholder="https://example.com/cover.jpg"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#E6EDF3',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
              }}
            />
          </div>

          {/* ===== СТРАНИЦЫ ===== */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Количество страниц
            </label>
            <input
              type="number"
              value={formData.total_pages}
              onChange={(e) => setFormData({ ...formData, total_pages: e.target.value })}
              placeholder="0"
              min="0"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#E6EDF3',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
              }}
            />
          </div>

          {/* ===== ОПИСАНИЕ ===== */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Краткое описание книги..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#E6EDF3',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* ===== ЖАНРЫ ===== */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Жанры
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={genreInput}
                onChange={(e) => setGenreInput(e.target.value)}
                placeholder="Например: Фантастика"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddGenre();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: '#E6EDF3',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleAddGenre}
                style={{
                  padding: '10px 16px',
                  background: 'rgba(91, 134, 161, 0.15)',
                  border: '1px solid rgba(91, 134, 161, 0.2)',
                  borderRadius: '8px',
                  color: '#5B86A1',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                +
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {formData.genres.map((genre) => (
                <span
                  key={genre}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: 'rgba(91, 134, 161, 0.1)',
                    borderRadius: '12px',
                    fontSize: '13px',
                    color: '#5B86A1',
                    border: '1px solid rgba(91, 134, 161, 0.1)',
                  }}
                >
                  {genre}
                  <button
                    type="button"
                    onClick={() => handleRemoveGenre(genre)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#5B86A1',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '0 2px',
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* ===== СТАТУС ПУБЛИКАЦИИ ===== */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#97A6BA', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#5B86A1',
                  cursor: 'pointer',
                }}
              />
              Опубликовать книгу
            </label>
          </div>

          {/* ===== ОШИБКИ ===== */}
          {error && (
            <div style={{ color: '#EF5350', fontSize: '13px', marginBottom: '16px' }}>
              ❌ {error}
            </div>
          )}

          {/* ===== КНОПКИ ===== */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                background: '#5B86A1',
                border: 'none',
                borderRadius: '8px',
                color: '#0A1118',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {loading ? 'Сохранение...' : mode === 'create' ? '➕ Создать' : '💾 Сохранить'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#97A6BA',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}