// src/pages/Admin/Books/BookModal.tsx

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../shared/api/client';
import type { AdminBook, AdminAuthor, AdminGenre } from '../../../types/admin';
import { getAuthorDisplayName } from '../../../types/admin';
import { useAuthStore } from '../../../store/authStore';

interface BookModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  book: AdminBook | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  color: '#E6EDF3',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
};

export default function BookModal({ isOpen, mode, book, onClose, onSave }: BookModalProps) {
  const user = useAuthStore((s) => s.user);
  const isModerator = user?.role === 'moderator';

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    author_id: null as string | null,
    cover: '',
    genres: [] as string[],
    genre_ids: [] as string[],
    publication_format: '',
    description: '',
    publication_type: 'official' as 'official' | 'unofficial',
    is_published: false,
  });

  const [authorQuery, setAuthorQuery] = useState('');
  const [authorSuggestions, setAuthorSuggestions] = useState<AdminAuthor[]>([]);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const authorRef = useRef<HTMLDivElement>(null);

  const [availableGenres, setAvailableGenres] = useState<AdminGenre[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        author_id: book.author_id || null,
        cover: book.cover || '',
        genres: book.genres || [],
        genre_ids: book.genre_ids || [],
        publication_format: book.publication_format || '',
        description: book.description || '',
        publication_type: (book.publication_type as 'official' | 'unofficial') || 'official',
        is_published: book.is_published || false,
      });
      setAuthorQuery(book.author || '');
    } else {
      setFormData({
        title: '',
        author: '',
        author_id: null,
        cover: '',
        genres: [],
        genre_ids: [],
        publication_format: '',
        description: '',
        publication_type: 'official',
        is_published: false,
      });
      setAuthorQuery('');
    }
    setAuthorSuggestions([]);
    setShowAuthorDropdown(false);
    setError(null);
  }, [mode, book, isOpen]);

  useEffect(() => {
    apiClient.get('/admin/genres', { params: { limit: 200 } })
      .then((res) => setAvailableGenres(res.data?.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!authorQuery || authorQuery.length < 1) {
      setAuthorSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      apiClient.get('/admin/authors', { params: { search: authorQuery, limit: 10 } })
        .then((res) => setAuthorSuggestions(res.data?.data ?? []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [authorQuery]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (authorRef.current && !authorRef.current.contains(e.target as Node)) {
        setShowAuthorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!isOpen) return null;

  const handleSelectAuthor = (author: AdminAuthor) => {
    setFormData({ ...formData, author: author.name, author_id: author.id });
    setAuthorQuery(getAuthorDisplayName(author));
    setShowAuthorDropdown(false);
  };

  const handleAuthorInputChange = (value: string) => {
    setAuthorQuery(value);
    setFormData({ ...formData, author: value, author_id: null });
    setShowAuthorDropdown(true);
  };

  const handleToggleGenre = (genreId: string, genreName: string) => {
    const currentIds = formData.genre_ids;
    const currentNames = formData.genres;
    if (currentIds.includes(genreId)) {
      setFormData({
        ...formData,
        genre_ids: currentIds.filter((id) => id !== genreId),
        genres: currentNames.filter((name) => name !== genreName),
      });
    } else {
      setFormData({
        ...formData,
        genre_ids: [...currentIds, genreId],
        genres: [...currentNames, genreName],
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData: Record<string, any> = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        cover: formData.cover.trim() || null,
        genres: formData.genres,
        genre_ids: formData.genre_ids,
        publication_format: formData.publication_format || null,
        description: formData.description.trim() || null,
        publication_type: formData.publication_type,
        is_published: formData.is_published,
      };

      if (formData.author_id) {
        submitData.author_id = formData.author_id;
      }

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
          {/* НАЗВАНИЕ */}
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
              style={inputStyle}
            />
          </div>

          {/* АВТОР с автокомплитом */}
          <div style={{ marginBottom: '16px' }} ref={authorRef}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Автор * {formData.author_id && <span style={{ color: '#4CAF50', fontSize: '11px' }}>✓ из базы</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={authorQuery}
                onChange={(e) => handleAuthorInputChange(e.target.value)}
                onFocus={() => authorQuery.length >= 1 && setShowAuthorDropdown(true)}
                placeholder="Начните вводить имя автора..."
                required
                style={inputStyle}
              />
              {showAuthorDropdown && authorSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#1A2832',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  marginTop: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 10,
                }}>
                  {authorSuggestions.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => handleSelectAuthor(a)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        color: '#E6EDF3',
                        fontSize: '14px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {getAuthorDisplayName(a)}
                      {a.country && <span style={{ color: '#5B86A1', fontSize: '12px', marginLeft: '8px' }}>{a.country}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ТИП ПУБЛИКАЦИИ */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Тип публикации
            </label>
            <select
              value={formData.publication_type}
              onChange={(e) => setFormData({ ...formData, publication_type: e.target.value as 'official' | 'unofficial' })}
              disabled={isModerator && mode === 'edit'}
              style={{
                ...inputStyle,
                background: isModerator && mode === 'edit' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.3)',
                cursor: isModerator && mode === 'edit' ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="official">📚 Официальная (библиотека, классика, академические)</option>
              <option value="unofficial">✏️ Неофициальная (фанфик, рукопись, веб-новелла)</option>
            </select>
          </div>

          {/* ОБЛОЖКА */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Обложка (URL)
            </label>
            <input
              type="url"
              value={formData.cover}
              onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
              placeholder="https://example.com/cover.jpg"
              style={inputStyle}
            />
          </div>

          {/* ФОРМАТ ПУБЛИКАЦИИ */}
          {!(isModerator && mode === 'edit') && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                Формат публикации
              </label>
              <select
                value={formData.publication_format}
                onChange={(e) => setFormData({ ...formData, publication_format: e.target.value })}
                style={{
                  ...inputStyle,
                  background: 'rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                }}
              >
                <option value="">— Не указано —</option>
                <option value="novel">Роман</option>
                <option value="short_story">Рассказ</option>
                <option value="journal">Журнальная публикация</option>
                <option value="magazine">Газетная публикация</option>
                <option value="anthology">Антология</option>
                <option value="collection">Сборник</option>
                <option value="web">Веб-публикация</option>
                <option value="other">Другое</option>
              </select>
            </div>
          )}

          {/* ОПИСАНИЕ */}
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
                ...inputStyle,
                resize: 'vertical',
              }}
            />
          </div>

          {/* ЖАНРЫ — выбор из существующих */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Жанры
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {availableGenres.map((genre) => {
                const selected = formData.genre_ids.includes(genre.id);
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => handleToggleGenre(genre.id, genre.name)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      background: selected ? 'rgba(91, 134, 161, 0.25)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${selected ? 'rgba(91, 134, 161, 0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: selected ? '#5B86A1' : '#97A6BA',
                    }}
                  >
                    {selected ? '✓ ' : ''}{genre.name}
                  </button>
                );
              })}
            </div>
            {formData.genres.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {formData.genres.map((genre, idx) => (
                  <span
                    key={formData.genre_ids[idx] || genre}
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
                      onClick={() => handleToggleGenre(formData.genre_ids[idx], genre)}
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
            )}
          </div>

          {/* СТАТУС ПУБЛИКАЦИИ */}
          {!(isModerator && mode === 'edit') && (
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
          )}

          {/* ОШИБКИ */}
          {error && (
            <div style={{ color: '#EF5350', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* КНОПКИ */}
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
