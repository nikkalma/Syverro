import { useState } from 'react';
import type { EnrichedBook, BookStatus } from '../entities/book/book.types';

interface BookCardProps {
  book: EnrichedBook;
  onAddToMyLibrary?: (bookId: string, status: BookStatus) => Promise<void>;
  onUpdateStatus?: (bookId: string, status: BookStatus) => Promise<void>;
  onToggleFavorite?: (bookId: string) => Promise<void>;
}

const statusLabels: Record<BookStatus, string> = {
  reading: 'Читаю',
  completed: 'Прочитано',
  want_to_read: 'Хочу прочитать',
  postponed: 'Отложено',
  abandoned: 'Брошено',
};

const statusColors: Record<BookStatus, string> = {
  reading: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-green-500/20 text-green-400',
  want_to_read: 'bg-purple-500/20 text-purple-400',
  postponed: 'bg-yellow-500/20 text-yellow-400',
  abandoned: 'bg-red-500/20 text-red-400',
};

export default function BookCard({
  book,
  onAddToMyLibrary,
  onUpdateStatus,
  onToggleFavorite,
}: BookCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Используем optional chaining для безопасного доступа
  const userData = book.userData;
  const hasUserData = userData !== null && userData !== undefined;

  const handleAddToLibrary = async (status: BookStatus) => {
    if (!onAddToMyLibrary) return;
    setIsAdding(true);
    try {
      await onAddToMyLibrary(book.id, status);
    } finally {
      setIsAdding(false);
      setShowStatusMenu(false);
    }
  };

  const handleUpdateStatus = async (status: BookStatus) => {
    if (!onUpdateStatus || !hasUserData) return;
    await onUpdateStatus(book.id, status);
    setShowStatusMenu(false);
  };

  const handleToggleFavorite = async () => {
    if (!onToggleFavorite || !hasUserData) return;
    await onToggleFavorite(book.id);
  };

  const allStatuses: BookStatus[] = ['reading', 'want_to_read', 'completed', 'postponed', 'abandoned'];

  return (
    <div className="group relative bg-[#121C24] border border-[#2A4B60] rounded-xl overflow-hidden hover:border-[#5B86A1] transition-all duration-300">
      {/* Обложка */}
      <div className="aspect-[2/3] bg-[#1A2832] flex items-center justify-center">
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-[#5B86A1] text-sm text-center p-4">
            <div className="text-4xl mb-2">📖</div>
            <div className="font-medium">{book.title}</div>
            <div className="text-xs">{book.author}</div>
          </div>
        )}
      </div>

      {/* Информация */}
      <div className="p-4">
        <h3 className="font-medium text-[#E6EDF3] truncate">{book.title}</h3>
        <p className="text-sm text-[#97A6BA] truncate">{book.author}</p>

        {/* Статус - используем userData напрямую с проверкой */}
        {hasUserData && userData.status && (
          <div className="mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[userData.status]}`}>
              {statusLabels[userData.status]}
            </span>
            {userData.current_page > 0 && (
              <span className="ml-2 text-xs text-[#97A6BA]">
                {userData.current_page}
                {book.total_pages ? ` / ${book.total_pages} стр.` : ''}
              </span>
            )}
          </div>
        )}

        {/* Кнопки действий */}
        <div className="mt-3 flex gap-2">
          {/* Кнопка "В библиотеку" — только если книги нет в личной библиотеке */}
          {!hasUserData && onAddToMyLibrary && (
            <div className="relative flex-1">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={isAdding}
                className="w-full px-3 py-1.5 text-xs bg-[#2A4B60] hover:bg-[#3A5570] text-[#E6EDF3] rounded-lg transition disabled:opacity-50"
              >
                {isAdding ? 'Добавление...' : '+ В библиотеку'}
              </button>

              {/* Выпадающее меню статусов */}
              {showStatusMenu && (
                <div className="absolute z-10 mt-1 w-48 bg-[#1A2832] border border-[#2A4B60] rounded-lg shadow-xl py-1">
                  {allStatuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleAddToLibrary(s)}
                      className="w-full px-4 py-2 text-left text-sm text-[#E6EDF3] hover:bg-[#2A4B60] transition"
                    >
                      {statusLabels[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Кнопка избранного — только если книга в личной библиотеке */}
          {hasUserData && onToggleFavorite && (
            <button
              onClick={handleToggleFavorite}
              className={`px-3 py-1.5 text-xs rounded-lg transition ${
                userData.is_favorite
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-[#2A4B60] text-[#97A6BA] hover:text-[#E6EDF3]'
              }`}
            >
              {userData.is_favorite ? '⭐' : '☆'}
            </button>
          )}

          {/* Кнопка смены статуса — только если книга в личной библиотеке */}
          {hasUserData && onUpdateStatus && (
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="px-3 py-1.5 text-xs bg-[#2A4B60] hover:bg-[#3A5570] text-[#E6EDF3] rounded-lg transition"
              >
                📝
              </button>

              {/* Выпадающее меню для смены статуса */}
              {showStatusMenu && (
                <div className="absolute z-10 mt-1 w-48 bg-[#1A2832] border border-[#2A4B60] rounded-lg shadow-xl py-1">
                  {allStatuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleUpdateStatus(s)}
                      className="w-full px-4 py-2 text-left text-sm text-[#E6EDF3] hover:bg-[#2A4B60] transition"
                    >
                      {statusLabels[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Жанры */}
        {book.genres && book.genres.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {book.genres.slice(0, 2).map((genre) => (
              <span key={genre} className="text-xs text-[#5B86A1]">
                #{genre}
              </span>
            ))}
            {book.genres.length > 2 && (
              <span className="text-xs text-[#5B86A1]">+{book.genres.length - 2}</span>
            )}
          </div>
        )}

        {/* Статус модерации */}
        {book.status === 'pending_moderation' && (
          <div className="mt-2 text-xs text-yellow-500/70">
            ⏳ Ожидает модерации
          </div>
        )}
      </div>
    </div>
  );
}