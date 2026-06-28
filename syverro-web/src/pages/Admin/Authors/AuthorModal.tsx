// src/pages/Admin/Authors/AuthorModal.tsx

import { useState, useEffect } from 'react';
import { AdminAuthor } from '../../../types/admin';

interface AuthorModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  author: AdminAuthor | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function AuthorModal({ isOpen, mode, author, onClose, onSave }: AuthorModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    photo: '',
    bio: '',
    country: '',
    birth_year: '',
    death_year: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && author) {
      setFormData({
        name: author.name || '',
        photo: author.photo || '',
        bio: author.bio || '',
        country: author.country || '',
        birth_year: author.birth_year?.toString() || '',
        death_year: author.death_year?.toString() || '',
      });
    } else {
      setFormData({
        name: '',
        photo: '',
        bio: '',
        country: '',
        birth_year: '',
        death_year: '',
      });
    }
    setError(null);
  }, [mode, author, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        name: formData.name.trim(),
        photo: formData.photo.trim() || null,
        bio: formData.bio.trim() || null,
        country: formData.country.trim() || null,
        birth_year: formData.birth_year ? parseInt(formData.birth_year) : null,
        death_year: formData.death_year ? parseInt(formData.death_year) : null,
      };

      if (!submitData.name) {
        throw new Error('Имя автора обязательно');
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
            {mode === 'create' ? '➕ Новый автор' : '✏️ Редактировать автора'}
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
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Имя автора *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Фото (URL)
            </label>
            <input
              type="url"
              value={formData.photo}
              onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
              placeholder="https://example.com/photo.jpg"
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

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Страна
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Например: Россия"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                Год рождения
              </label>
              <input
                type="number"
                value={formData.birth_year}
                onChange={(e) => setFormData({ ...formData, birth_year: e.target.value })}
                placeholder="1900"
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
            <div>
              <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                Год смерти
              </label>
              <input
                type="number"
                value={formData.death_year}
                onChange={(e) => setFormData({ ...formData, death_year: e.target.value })}
                placeholder="2000"
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
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Биография
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Краткая биография автора..."
              rows={4}
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

          {error && (
            <div style={{ color: '#EF5350', fontSize: '13px', marginBottom: '16px' }}>
              ❌ {error}
            </div>
          )}

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