// src/pages/BookPage/index.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLibrary } from '../../hooks/useLibrary';
import { storageService } from '../../services/storageService';
import { userBookService } from '../../services/userBookService';
import { BookHeader } from './BookHeader';
import { BookMeta } from './BookMeta';
import { BookDescription } from './BookDescription';
import { EditModal } from './EditModal';
import { AddToLibraryModal } from './AddToLibraryModal';
import type { UserBookStatus } from '../../types/userBook';

const CURRENT_USER_ID = 'user_1';

export default function BookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { books, loadBooks } = useLibrary();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const book = books.find((b) => b.id === id);
  const isInLibrary = book ? !!userBookService.getByBook(CURRENT_USER_ID, book.id) : false;

  if (!book) {
    return (
      <div style={{ color: '#E6EDF3', padding: '40px', textAlign: 'center' }}>
        <h2>Книга не найдена</h2>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: '#2A4B60',
            border: 'none',
            borderRadius: '8px',
            color: '#E6EDF3',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Вернуться в библиотеку
        </button>
      </div>
    );
  }

  const handleEditSave = (data: Partial<typeof book>) => {
    const updated = { ...book, ...data };
    storageService.updateGlobalBook(updated);
    loadBooks();
    setIsEditModalOpen(false);
  };

  const handleAddToLibrary = (status: UserBookStatus) => {
    userBookService.add(CURRENT_USER_ID, book.id, status);
    setIsAddModalOpen(false);
    // Перезагружаем данные, чтобы обновить кнопку
    loadBooks();
  };

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'none',
          border: 'none',
          color: '#5B86A1',
          cursor: 'pointer',
          fontSize: '16px',
          marginBottom: '24px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        ← Назад в библиотеку
      </button>

      <BookHeader
        book={book}
        isInLibrary={isInLibrary}
        onAddClick={() => setIsAddModalOpen(true)}
        onEditClick={() => setIsEditModalOpen(true)}
      />

      <div style={{ marginTop: '24px' }}>
        <BookMeta book={book} />
        <BookDescription book={book} />
      </div>

      <EditModal
        isOpen={isEditModalOpen}
        book={book}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
      />

      <AddToLibraryModal
        isOpen={isAddModalOpen}
        bookTitle={book.title}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddToLibrary}
      />
    </div>
  );
}