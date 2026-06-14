// src/pages/LibraryPage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLibrary } from '../features/library/hooks/useLibrary';
import BookGrid from '../widgets/BookGrid';
import { bookApi } from '../entities/book/book.api';

export default function LibraryPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { books, loading, toggleFavorite } = useLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleBookPress = (bookId: string) => {
    navigate(`/book/${bookId}`);
  };

  const handleAddBookManually = async () => {
    // Временная заглушка для ручного добавления
    const title = prompt('Название книги');
    const author = prompt('Автор');
    if (title && author) {
      try {
        await bookApi.create({ 
          title, 
          author, 
          status: 'planned',
          rating: null,
          cover: null,
          section: null,
          genres: [],
          totalPages: 0,
          currentPage: 0,
          startDate: null,
          endDate: null,
          notes: '',
          languages: [],
          review: '',
          favorite: false,
          authorCountry: null,
          series: null,
          seriesPosition: null,
          originalYear: null,
          readingFormat: 'reading',
          lastRead: null,
        });
        window.location.reload();
      } catch (error) {
        alert('Ошибка добавления книги');
      }
    }
  };

  const filteredBooks = books.filter((book) => {
    if (statusFilter !== 'all' && book.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
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
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-[#121C24] border border-[#2A4B60] rounded-full text-[#E6EDF3] focus:outline-none"
          >
            <option value="all">Все статусы</option>
            <option value="reading">Читаю</option>
            <option value="finished">Прочитано</option>
            <option value="planned">В планах</option>
            <option value="rereading">Перечитываю</option>
          </select>

          <button
            onClick={handleAddBookManually}
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
        <BookGrid
          books={filteredBooks}
          onBookPress={handleBookPress}
          onToggleFavorite={toggleFavorite}
          showFavorite={true}
          columns={4}
        />
      )}
    </div>
  );
}