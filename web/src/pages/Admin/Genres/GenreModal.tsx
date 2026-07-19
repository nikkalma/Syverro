// src/pages/Admin/Genres/GenreModal.tsx

import { useState, useEffect } from 'react';
import { apiClient } from '../../../shared/api/client';
import type { AdminGenre } from '../../../types/admin';

interface GenreModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  genre: AdminGenre | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function GenreModal({ isOpen, mode, genre, onClose, onSave }: GenreModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [allGenres, setAllGenres] = useState<AdminGenre[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && genre) {
      setName(genre.name || '');
      setDescription(genre.description || '');
      setParentId(genre.parent_id || null);
    } else {
      setName('');
      setDescription('');
      setParentId(null);
    }
    setError(null);
  }, [mode, genre, isOpen]);

  useEffect(() => {
    apiClient.get('/admin/genres', { params: { limit: 200 } })
      .then((res) => {
        const genres = (res.data?.data ?? []) as AdminGenre[];
        setAllGenres(genres.filter((g) => g.id !== genre?.id));
      })
      .catch(() => {});
  }, [genre?.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const trimmed = name.trim();
      if (!trimmed) {
        throw new Error('Название жанра обязательно');
      }
      onSave({
        name: trimmed,
        description: description.trim() || null,
        parent_id: parentId || null,
      });
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
          maxWidth: '400px',
          width: '100%',
          padding: '32px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#E6EDF3', fontSize: '22px', fontWeight: '400', margin: 0 }}>
            {mode === 'create' ? '➕ Новый жанр' : '✏️ Редактировать жанр'}
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
              Название жанра *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Фантастика"
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

          {/* ОПИСАНИЕ */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание жанра..."
              rows={2}
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

          {/* РОДИТЕЛЬСКИЙ ЖАНР */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Поджанр (родительский жанр)
            </label>
            <select
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value || null)}
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
            >
              <option value="">— Нет (корневой жанр) —</option>
              {allGenres.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{ color: '#EF5350', fontSize: '13px', marginBottom: '16px' }}>
              {error}
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
