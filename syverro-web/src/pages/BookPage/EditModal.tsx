// src/pages/BookPage/EditModal.tsx
import { useState } from 'react';
import { EnrichedBook } from '../../types/book';

interface EditModalProps {
  isOpen: boolean;
  book: EnrichedBook;
  onClose: () => void;
  onSave: (data: Partial<EnrichedBook>) => void;
}

export function EditModal({ isOpen, book, onClose, onSave }: EditModalProps) {
  const [data, setData] = useState<Partial<EnrichedBook>>({
    title: book.title,
    author: book.author,
    description: book.description || '',
    genres: book.genres || [],
    subgenres: book.subgenres || [],
    vibe: book.vibe || [],
    themes: book.themes || [],
    motifs: book.motifs || [],
    cover: book.cover || '',
    totalPages: book.totalPages || 0,
    authorCountry: book.authorCountry || '',
    originalYear: book.originalYear || 0,
    originalLanguage: book.originalLanguage || '',
  });

  if (!isOpen) return null;

  const handleChange = (key: keyof typeof data, value: any) => {
    setData({ ...data, [key]: value });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
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
          background: 'rgba(18, 28, 36, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '32px',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: '#E6EDF3', fontSize: '24px', marginBottom: '20px' }}>
          ✏️ Редактировать книгу
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ color: '#97A6BA', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Название
            </label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
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
          <div>
            <label style={{ color: '#97A6BA', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Автор
            </label>
            <input
              type="text"
              value={data.author || ''}
              onChange={(e) => handleChange('author', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
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
        </div>

        <div style={{ marginTop: '12px' }}>
          <label style={{ color: '#97A6BA', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            Описание
          </label>
          <textarea
            value={data.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: '#E6EDF3',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
          <div>
            <label style={{ color: '#97A6BA', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Жанры (через запятую)
            </label>
            <input
              type="text"
              value={data.genres?.join(', ') || ''}
              onChange={(e) => handleChange('genres', e.target.value.split(',').map((s) => s.trim()))}
              style={{
                width: '100%',
                padding: '8px 12px',
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
          <div>
            <label style={{ color: '#97A6BA', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Поджанры (через запятую)
            </label>
            <input
              type="text"
              value={data.subgenres?.join(', ') || ''}
              onChange={(e) => handleChange('subgenres', e.target.value.split(',').map((s) => s.trim()))}
              style={{
                width: '100%',
                padding: '8px 12px',
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
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
          <div>
            <label style={{ color: '#97A6BA', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Вайб (через запятую)
            </label>
            <input
              type="text"
              value={data.vibe?.join(', ') || ''}
              onChange={(e) => handleChange('vibe', e.target.value.split(',').map((s) => s.trim()))}
              style={{
                width: '100%',
                padding: '8px 12px',
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
          <div>
            <label style={{ color: '#97A6BA', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Темы (через запятую)
            </label>
            <input
              type="text"
              value={data.themes?.join(', ') || ''}
              onChange={(e) => handleChange('themes', e.target.value.split(',').map((s) => s.trim()))}
              style={{
                width: '100%',
                padding: '8px 12px',
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
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
          <div>
            <label style={{ color: '#97A6BA', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Мотивы (через запятую)
            </label>
            <input
              type="text"
              value={data.motifs?.join(', ') || ''}
              onChange={(e) => handleChange('motifs', e.target.value.split(',').map((s) => s.trim()))}
              style={{
                width: '100%',
                padding: '8px 12px',
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
          <div>
            <label style={{ color: '#97A6BA', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Обложка (URL)
            </label>
            <input
              type="text"
              value={data.cover || ''}
              onChange={(e) => handleChange('cover', e.target.value)}
              placeholder="https://example.com/cover.jpg"
              style={{
                width: '100%',
                padding: '8px 12px',
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
          <div>
            <label style={{ color: '#97A6BA', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Страниц
            </label>
            <input
              type="number"
              value={data.totalPages || ''}
              onChange={(e) => handleChange('totalPages', parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#E6EDF3',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                appearance: 'textfield',
                MozAppearance: 'textfield',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
          <div>
            <label style={{ color: '#97A6BA', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Страна автора
            </label>
            <input
              type="text"
              value={data.authorCountry || ''}
              onChange={(e) => handleChange('authorCountry', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
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
          <div>
            <label style={{ color: '#97A6BA', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Год оригинала
            </label>
            <input
              type="number"
              value={data.originalYear || ''}
              onChange={(e) => handleChange('originalYear', parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#E6EDF3',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                appearance: 'textfield',
                MozAppearance: 'textfield',
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <label style={{ color: '#97A6BA', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            Язык оригинала
          </label>
          <input
            type="text"
            value={data.originalLanguage || ''}
            onChange={(e) => handleChange('originalLanguage', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
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

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={() => onSave(data)}
            style={{
              flex: 1,
              padding: '12px',
              background: '#5B86A1',
              border: 'none',
              borderRadius: '8px',
              color: '#0A1118',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            💾 Сохранить
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.06)',
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
      </div>
    </div>
  );
}