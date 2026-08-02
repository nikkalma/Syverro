import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../../store/adminStore';
import { AdminAuthor, AdminAuthorCreate, getAuthorDisplayName } from '../../../types/admin';
import AuthorsTable from './AuthorsTable';
import AuthorsFilters from './AuthorsFilters';
import AuthorModal from './AuthorModal';
import { canManageAuthors } from '../../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import { apiClient } from '../../../shared/api/client';

export default function AuthorList() {
  const navigate = useNavigate();
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);
  const { searchQuery, filters, page, limit, setLoading, isLoading, error, setError, clearError } = useAdminStore();

  const [authors, setAuthors] = useState<AdminAuthor[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedAuthor, setSelectedAuthor] = useState<AdminAuthor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [authorToDelete, setAuthorToDelete] = useState<AdminAuthor | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser?.role || 'user';
  const canManage = canManageAuthors(userRole);

  const fetchAuthors = async () => {
    setLoading(true);
    clearError();

    try {
      const res = await apiClient.get('/admin/authors', {
        params: {
          page,
          limit,
          ...(searchQuery && { search: searchQuery }),
          ...filters,
        },
      });
      setAuthors(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || t.admin.authors.errorLoad);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, [page, limit, searchQuery, filters]);

  const handleCreate = async (data: AdminAuthorCreate): Promise<void> => {
    try {
      await apiClient.post('/admin/authors', data);
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || t.admin.authors.errorCreate);
    }
    try { await fetchAuthors(); } catch { /* non-critical */ }
  };

  const handleUpdate = async (id: string, data: AdminAuthorCreate): Promise<void> => {
    try {
      await apiClient.put(`/admin/authors/${id}`, data);
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || t.admin.authors.errorUpdate);
    }
    try { await fetchAuthors(); } catch { /* non-critical */ }
  };

  const handleDelete = async () => {
    if (!authorToDelete) return;
    try {
      await apiClient.delete(`/admin/authors/${authorToDelete.id}`);
      setIsDeleteModalOpen(false);
      setAuthorToDelete(null);
      await fetchAuthors();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || t.admin.authors.errorDelete);
    }
  };

  const handleOpenCreate = () => {
    setSelectedAuthor(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (author: AdminAuthor) => {
    navigate(`/studio/authors/${author.id}/edit`);
  };

  const handleOpenDelete = (author: AdminAuthor) => {
    setAuthorToDelete(author);
    setIsDeleteModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '400', color: 'var(--text-primary)', margin: 0 }}>
          {t.admin.authors.title}
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '12px' }}>
            {total} {t.admin.common.records}
          </span>
        </h1>
        {canManage && (
          <button
            onClick={handleOpenCreate}
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
            + {t.admin.authors.addAuthor}
          </button>
        )}
      </div>

      <AuthorsFilters onFilterChange={fetchAuthors} />

      <AuthorsTable
        authors={authors}
        loading={isLoading}
        error={error}
        total={total}
        page={page}
        limit={limit}
        canManage={canManage}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        onRefresh={fetchAuthors}
      />

      <AuthorModal
        isOpen={isModalOpen}
        mode={modalMode}
        author={selectedAuthor}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAuthor(null);
        }}
        onSave={(data) => {
          if (modalMode === 'create') {
            return handleCreate(data);
          } else if (selectedAuthor) {
            return handleUpdate(selectedAuthor.id, data);
          }
          return Promise.resolve();
        }}
      />

      {isDeleteModalOpen && authorToDelete && (
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
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', color: 'var(--error)', marginBottom: '12px' }}><AlertTriangle size={40} /></div>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', marginBottom: '8px' }}>{t.admin.authors.deleteConfirm}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {t.admin.authors.deleteConfirmText} <strong style={{ color: 'var(--text-primary)' }}>{getAuthorDisplayName(authorToDelete)}</strong>?
                <br />
                <span style={{ color: 'var(--error)', fontSize: '13px' }}>{t.admin.authors.irreversible}</span>
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
