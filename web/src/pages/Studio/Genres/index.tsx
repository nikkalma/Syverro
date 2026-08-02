// src/pages/Admin/Genres/index.tsx

import { useEffect, useState, useCallback } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { AdminGenre, AdminGenreCreate } from '../../../types/admin';
import GenresTree from './GenresTree';
import GenresFilters from './GenresFilters';
import GenreModal from './GenreModal';
import { canManageGenres } from '../../../types/admin';
import { apiClient } from '../../../shared/api/client';
import { getLocaleData, getBrowserLocale } from '../../../locales';

interface GenreTreeNode {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  parent_id: string | null;
  book_count: number;
  children: GenreTreeNode[];
  created_at?: string;
}

export default function AdminGenres() {
  const t = getLocaleData(getBrowserLocale());
  const { searchQuery, isLoading, setLoading, error, setError, clearError } = useAdminStore();
  
  const [tree, setTree] = useState<GenreTreeNode[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<AdminGenre | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [genreToDelete, setGenreToDelete] = useState<AdminGenre | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser?.role || 'user';
  const canManage = canManageGenres(userRole);

  const countAll = (nodes: GenreTreeNode[]): number => {
    let c = 0;
    for (const n of nodes) {
      c++;
      if (n.children?.length) c += countAll(n.children);
    }
    return c;
  };

  const fetchTree = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      const res = await apiClient.get('/admin/genres/tree');
      setTree(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || t.admin.genres.errorLoad);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, clearError]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const handleCreate = async (data: AdminGenreCreate) => {
    try {
      await apiClient.post('/admin/genres', data);
      setIsModalOpen(false);
      setDefaultParentId(null);
      await fetchTree();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || t.admin.genres.errorCreate);
    }
  };

  const handleUpdate = async (id: string, data: AdminGenreCreate) => {
    try {
      await apiClient.put(`/admin/genres/${id}`, data);
      setIsModalOpen(false);
      setDefaultParentId(null);
      await fetchTree();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || t.admin.genres.errorUpdate);
    }
  };

  const handleDelete = async () => {
    if (!genreToDelete) return;
    try {
      await apiClient.delete(`/admin/genres/${genreToDelete.id}`);
      setIsDeleteModalOpen(false);
      setGenreToDelete(null);
      await fetchTree();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || t.admin.genres.errorDelete);
    }
  };

  const handleOpenCreate = (parentId?: string | null) => {
    setSelectedGenre(null);
    setDefaultParentId(parentId || null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (genre: AdminGenre) => {
    setSelectedGenre(genre);
    setDefaultParentId(null);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenDelete = (genre: AdminGenre) => {
    setGenreToDelete(genre);
    setIsDeleteModalOpen(true);
  };

  // Build the modal genre with defaultParentId for create mode
  const modalGenre = modalMode === 'create' && defaultParentId
    ? { ...selectedGenre, parent_id: defaultParentId } as AdminGenre
    : selectedGenre;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '400', color: 'var(--text-primary)', margin: 0 }}>
          {t.admin.genres.title}
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '12px' }}>
            {countAll(tree)} {t.admin.common.genresCount}
          </span>
        </h1>
        {canManage && (
          <button
            onClick={() => handleOpenCreate()}
            style={{
              padding: '10px 20px',
              background: 'var(--primary)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--primary)')}
          >
            {t.admin.genres.addRoot}
          </button>
        )}
      </div>

      <GenresFilters onFilterChange={() => {}} />

      <GenresTree
        tree={tree}
        loading={isLoading}
        error={error}
        searchQuery={searchQuery}
        canManage={canManage}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        onAddChild={(parentId) => handleOpenCreate(parentId)}
        onRefresh={fetchTree}
      />

      <GenreModal
        isOpen={isModalOpen}
        mode={modalMode}
        genre={modalGenre}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGenre(null);
          setDefaultParentId(null);
        }}
        onSave={(data) => {
          if (modalMode === 'create') {
            handleCreate(data);
          } else if (selectedGenre) {
            handleUpdate(selectedGenre.id, data);
          }
        }}
      />

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
              background: 'var(--surface)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              border: '1px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px' }}>⚠</div>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', marginBottom: '8px' }}>{t.admin.genres.deleteConfirm}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {t.admin.genres.deleteConfirmText.split('{name}')[0]}
                <strong style={{ color: 'var(--text-primary)' }}>{genreToDelete.name}</strong>
                {t.admin.genres.deleteConfirmText.split('{name}')[1]}
                {genreToDelete.book_count > 0 && (
                  <span style={{ display: 'block', color: '#D4A76A', fontSize: '13px', marginTop: '4px' }}>
                    {t.admin.genres.linkedBooksCount.replace('{count}', String(genreToDelete.book_count))}
                  </span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--error)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {t.admin.common.delete}
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--chip)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {t.admin.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
