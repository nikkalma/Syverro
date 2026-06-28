// src/pages/Admin/Genres/index.tsx

import { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { AdminGenre, AdminGenreCreate } from '../../../types/admin';
import GenresTable from './GenresTable';
import GenresFilters from './GenresFilters';
import GenreModal from './GenreModal';
import { canManageGenres } from '../../../types/admin';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminGenres() {
  const { searchQuery, filters, page, limit, setLoading, isLoading, error, setError, clearError } = useAdminStore();
  
  const [genres, setGenres] = useState<AdminGenre[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState<AdminGenre | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [genreToDelete, setGenreToDelete] = useState<AdminGenre | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser?.role || 'user';
  const canManage = canManageGenres(userRole);

  // ===== ЗАГРУЗКА ЖАНРОВ =====
  const fetchGenres = async () => {
    setLoading(true);
    clearError();

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(searchQuery && { search: searchQuery }),
        ...filters,
      });

      const response = await fetch(`${API_URL}/admin/genres?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Ошибка загрузки жанров');
      }

      const data = await response.json();
      setGenres(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, [page, limit, searchQuery, filters]);

  // ===== СОЗДАНИЕ ЖАНРА =====
  const handleCreate = async (data: AdminGenreCreate) => {
    try {
      const response = await fetch(`${API_URL}/admin/genres`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Ошибка создания жанра');

      setIsModalOpen(false);
      await fetchGenres();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ===== ОБНОВЛЕНИЕ ЖАНРА =====
  const handleUpdate = async (id: string, data: AdminGenreCreate) => {
    try {
      const response = await fetch(`${API_URL}/admin/genres/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Ошибка обновления жанра');

      setIsModalOpen(false);
      await fetchGenres();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ===== УДАЛЕНИЕ =====
  const handleDelete = async () => {
    if (!genreToDelete) return;

    try {
      const response = await fetch(`${API_URL}/admin/genres/${genreToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Ошибка удаления жанра');

      setIsDeleteModalOpen(false);
      setGenreToDelete(null);
      await fetchGenres();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ===== ОТКРЫТИЕ МОДАЛКИ =====
  const handleOpenCreate = () => {
    setSelectedGenre(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (genre: AdminGenre) => {
    setSelectedGenre(genre);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenDelete = (genre: AdminGenre) => {
    setGenreToDelete(genre);
    setIsDeleteModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '400', color: '#E6EDF3', margin: 0 }}>
          🏷️ Жанры
          <span style={{ fontSize: '14px', color: '#97A6BA', marginLeft: '12px' }}>
            {total} записей
          </span>
        </h1>
        {canManage && (
          <button
            onClick={handleOpenCreate}
            style={{
              padding: '10px 20px',
              background: '#5B86A1',
              border: 'none',
              borderRadius: '8px',
              color: '#0A1118',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#4A7590')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#5B86A1')}
          >
            + Добавить жанр
          </button>
        )}
      </div>

      <GenresFilters onFilterChange={fetchGenres} />

      <GenresTable
        genres={genres}
        loading={isLoading}
        error={error}
        total={total}
        page={page}
        limit={limit}
        canManage={canManage}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        onRefresh={fetchGenres}
      />

      {/* ===== МОДАЛКА ===== */}
      <GenreModal
        isOpen={isModalOpen}
        mode={modalMode}
        genre={selectedGenre}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGenre(null);
        }}
        onSave={(data) => {
          if (modalMode === 'create') {
            handleCreate(data);
          } else if (selectedGenre) {
            handleUpdate(selectedGenre.id, data);
          }
        }}
      />

      {/* ===== МОДАЛКА УДАЛЕНИЯ ===== */}
      {isDeleteModalOpen && genreToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            style={{
              background: '#121C24',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px' }}>⚠️</div>
              <h2 style={{ color: '#E6EDF3', fontSize: '20px', marginBottom: '8px' }}>Удалить жанр?</h2>
              <p style={{ color: '#97A6BA', fontSize: '14px' }}>
                Вы уверены, что хотите удалить жанр <strong style={{ color: '#E6EDF3' }}>{genreToDelete.name}</strong>?
                <br />
                <span style={{ color: '#EF5350', fontSize: '13px' }}>Это действие нельзя отменить.</span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#EF5350',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                🗑️ Удалить
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '12px',
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
          </div>
        </div>
      )}
    </div>
  );
}