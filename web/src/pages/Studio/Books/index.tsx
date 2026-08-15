// src/pages/Admin/Books/index.tsx

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../../store/adminStore';
import { AdminBook, AdminBookCreate } from '../../../types/admin';
import BooksTable from './BooksTable';
import BooksFilters from './BooksFilters';
import BookModal from './BookModal';
import { canManageBooks } from '../../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import { apiClient } from '../../../shared/api/client';
import { studioPath } from '../../../shared/utils/studioRoutes';

export default function AdminBooks() {
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);
  const navigate = useNavigate();
  const { searchQuery, filters, page, limit, setLoading, isLoading, error, setError, clearError } = useAdminStore();
  
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedBook, setSelectedBook] = useState<AdminBook | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<AdminBook | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser?.role || 'user';
  const canManage = canManageBooks(userRole);

  // ===== ЗАГРУЗКА КНИГ =====
  const fetchBooks = async () => {
    setLoading(true);
    clearError();

    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
        ...(searchQuery && { search: searchQuery }),
        ...filters,
      };

      const response = await apiClient.get('/admin/books', { params });
      setBooks(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || t.admin.books.errorLoad);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [page, limit, searchQuery, filters]);

  // ===== СОЗДАНИЕ КНИГИ =====
  const handleCreate = async (data: AdminBookCreate) => {
    try {
      await apiClient.post('/admin/books', data);
      setIsModalOpen(false);
      await fetchBooks();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || t.admin.books.errorCreate);
    }
  };

  // ===== ПУБЛИКАЦИЯ / СМЕНА СТАТУСА =====
  const handleTogglePublish = async (id: string) => {
    try {
      const book = books.find((b) => b.id === id);
      if (!book) return;

      let nextStatus = 'draft';
      if (book.moderation_status === 'draft') nextStatus = 'pending';
      else if (book.moderation_status === 'pending') nextStatus = 'pending';
      else if (book.moderation_status === 'approved') nextStatus = 'published';
      else if (book.moderation_status === 'published') nextStatus = 'archived';
      else nextStatus = 'draft';

      await apiClient.put(`/admin/books/${id}/publish`, { moderation_status: nextStatus });
      await fetchBooks();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || t.admin.books.errorStatus);
    }
  };

  // ===== УДАЛЕНИЕ =====
  const handleDelete = async () => {
    if (!bookToDelete) return;

    try {
      await apiClient.delete(`/admin/books/${bookToDelete.id}`);
      setIsDeleteModalOpen(false);
      setBookToDelete(null);
      await fetchBooks();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || t.admin.books.errorDelete);
    }
  };

  // ===== ОТКРЫТИЕ МОДАЛКИ =====
  const handleOpenCreate = () => {
    setSelectedBook(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (book: AdminBook) => {
    navigate(studioPath(`books/${book.id}/workspace`));
  };

  const handleOpenDelete = (book: AdminBook) => {
    setBookToDelete(book);
    setIsDeleteModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '400', color: 'var(--text-primary)', margin: 0 }}>
          {t.admin.books.title}
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
            + {t.admin.books.addBook}
          </button>
        )}
      </div>

      <BooksFilters onFilterChange={fetchBooks} />

      <BooksTable
        books={books}
        loading={isLoading}
        error={error}
        total={total}
        page={page}
        limit={limit}
        canManage={canManage}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        onTogglePublish={handleTogglePublish}
        onRefresh={fetchBooks}
      />

      {/* ===== МОДАЛКА СОЗДАНИЯ / РЕДАКТИРОВАНИЯ ===== */}
      <BookModal
        isOpen={isModalOpen}
        mode={modalMode}
        book={selectedBook}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBook(null);
        }}
        onSave={(data) => {
          if (modalMode === 'create') {
            handleCreate(data as AdminBookCreate);
          }
        }}
      />

      {/* ===== МОДАЛКА УДАЛЕНИЯ ===== */}
      {isDeleteModalOpen && bookToDelete && (
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
              <div style={{ display: 'inline-flex', color: 'var(--error)', marginBottom: '16px' }}><AlertTriangle size={48} /></div>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', marginBottom: '8px' }}>{t.admin.books.deleteConfirm}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {t.admin.books.deleteConfirmText} <strong style={{ color: 'var(--text-primary)' }}>{bookToDelete.title}</strong>?
                <br />
                <span style={{ color: 'var(--error)', fontSize: '13px' }}>{t.admin.books.irreversible}</span>
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
