import { useState } from 'react';
import { useLibrary } from '../features/library/hooks/useLibrary';
import BookGrid from '../widgets/BookGrid';
import AddBookModal from '../components/AddBookModal';
import type { BookStatus } from '../entities/book/book.types';

export default function LibraryPage() {
  const { books, loading, error, isAdding, addBook } = useLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleAddBook = async (bookData: { title: string; author: string; status: BookStatus }) => {
    const result = await addBook(bookData);
    if (result.success) {
      setIsModalOpen(false);
      setToast({ message: 'Книга добавлена!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } else {
      setToast({ message: result.error || 'Ошибка добавления', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const filteredBooks = books.filter((book) => {
    if (statusFilter !== 'all' && book.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        book.title?.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-[#5B86A1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">Ошибка: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-light text-[#E6EDF3]">Библиотека</h1>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="🔍 Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 bg-[#121C24] border border-[#2A4B60] rounded-full text-[#E6EDF3] placeholder-[#5B86A1] focus:outline-none focus:border-[#5B86A1]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookStatus | 'all')}
            className="px-4 py-2 bg-[#121C24] border border-[#2A4B60] rounded-full text-[#E6EDF3] focus:outline-none"
          >
            <option value="all">Все статусы</option>
            <option value="reading">Читаю</option>
            <option value="finished">Прочитано</option>
            <option value="planned">В планах</option>
            <option value="postponed">Отложено</option>
            <option value="abandoned">Брошено</option>
          </select>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#2A4B60] hover:bg-[#3A5570] rounded-full text-[#E6EDF3] transition"
          >
            + Добавить
          </button>
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="text-center py-20 text-[#97A6BA]">
          {searchQuery || statusFilter !== 'all' ? 'Ничего не найдено' : 'В библиотеке пока нет книг'}
        </div>
      ) : (
        <BookGrid books={filteredBooks} />
      )}

      <AddBookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddBook}
        isLoading={isAdding}
      />

      {toast && (
        <div
          className="fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50"
          style={{ background: toast.type === 'success' ? '#5B86A1' : '#D32F2F' }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}