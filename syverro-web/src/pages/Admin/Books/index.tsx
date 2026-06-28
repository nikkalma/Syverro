// src/pages/Admin/Books/index.tsx

import { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { AdminBook, AdminBookFilters, AdminBookCreate, AdminBookUpdate } from '../../../types/admin';
import BooksTable from './BooksTable';
import BooksFilters from './BooksFilters';
import BookModal from './BookModal';
import { canManageBooks } from '../../../types/admin';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminBooks() {
  const { searchQuery, filters, page, limit, setLoading, isLoading, error, setError, clearError } = useAdminStore();
  
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedBook, setSelectedBook] = useState<AdminBook | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<AdminBook | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser?.role || 'user';
  const canManage = canManageBooks(userRole);

  // ===== ЗАГРУЗКА КНИГ =====
  const fetchBooks = async () => {
    setLoading(true);
    clearError();

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(searchQuery && { search: searchQuery }),
        ...filters,
      });

      const response = await fetch(`${API_URL}/admin/books?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Ошибка загрузки книг');
      }

      const data = await response.json();
      setBooks(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
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
      const response = await fetch(`${API_URL}/admin/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Ошибка создания книги');

      setIsModalOpen(false);
      await fetchBooks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ===== ОБНОВЛЕНИЕ КНИГИ =====
  const handleUpdate = async (id: string, data: AdminBookUpdate) => {
    try {
      const response = await fetch(`${API_URL}/admin/books/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Ошибка обновления книги');

      setIsModalOpen(false);
      await fetchBooks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ===== ПУБЛИКАЦИЯ / СКРЫТИЕ =====
  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    try {
      const response = await fetch(`${API_URL}/admin/books/${id}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_published: !isPublished }),
      });

      if (!response.ok) throw new Error('Ошибка изменения статуса');

      await fetchBooks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ===== УДАЛЕНИЕ =====
  const handleDelete = async () => {
    if (!bookToDelete) return;

    try {
      const response = await fetch(`${API_URL}/admin/books/${bookToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Ошибка удаления книги');

      setIsDeleteModalOpen(false);
      setBookToDelete(null);
      await fetchBooks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ===== ОТКРЫТИЕ МОДАЛКИ =====
  const handleOpenCreate = () => {
    setSelectedBook(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (book: AdminBook) => {
    setSelectedBook(book);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenDelete = (book: AdminBook) => {
    setBookToDelete(book);
    setIsDeleteModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '400', color: '#E6EDF3', margin: 0 }}>
          📚 Книги
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
            + Добавить книгу
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
          } else if (selectedBook) {
            handleUpdate(selectedBook.id, data);
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
              <h2 style={{ color: '#E6EDF3', fontSize: '20px', marginBottom: '8px' }}>Удалить книгу?</h2>
              <p style={{ color: '#97A6BA', fontSize: '14px' }}>
                Вы уверены, что хотите удалить книгу <strong style={{ color: '#E6EDF3' }}>{bookToDelete.title}</strong>?
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