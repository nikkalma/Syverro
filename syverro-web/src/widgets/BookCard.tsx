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
  reading: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  want_to_read: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  postponed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  abandoned: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function BookCard({
  book,
  onAddToMyLibrary,
  onUpdateStatus,
  onToggleFavorite,
}: BookCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const userData = book.userData;
  const hasUserData = userData !== null && userData !== undefined;

  const allStatuses: BookStatus[] = ['reading', 'want_to_read', 'completed', 'postponed', 'abandoned'];

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

  const progress = hasUserData && book.total_pages
    ? Math.round((userData.current_page / book.total_pages) * 100)
    : 0;

  return (
    <div className="group relative bg-[#121C24] border border-[#2A4B60] rounded-2xl overflow-hidden hover:border-[#5B86A1] hover:shadow-xl hover:shadow-[#5B86A1]/10 transition-all duration-300">
      {/* Обложка */}
      <div className="aspect-[2/3] bg-gradient-to-br from-[#1A2832] to-[#0F1A22] flex items-center justify-center relative overflow-hidden">
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-[#5B86A1] text-center p-4">
            <div className="text-6xl mb-3 opacity-50">📖</div>
            <div className="font-medium text-lg text-[#E6EDF3]">{book.title}</div>
            <div className="text-sm">{book.author}</div>
          </div>
        )}
        
        {/* Статус на обложке */}
        {hasUserData && userData.status && (
          <div className="absolute top-3 right-3">
            <span className={`text-xs px-3 py-1 rounded-full border ${statusColors[userData.status]} backdrop-blur-sm`}>
              {statusLabels[userData.status]}
            </span>
          </div>
        )}

        {/* Прогресс-бар на обложке */}
        {hasUserData && userData.current_page > 0 && book.total_pages && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0A1118]">
            <div
              className="h-full bg-[#5B86A1] transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Информация */}
      <div className="p-4">
        <h3 className="font-medium text-[#E6EDF3] truncate">{book.title}</h3>
        <p className="text-sm text-[#97A6BA] truncate">{book.author}</p>

        {/* Жанры */}
        {book.genres && book.genres.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {book.genres.slice(0, 2).map((genre) => (
              <span key={genre} className="text-xs text-[#5B86A1]">#{genre}</span>
            ))}
            {book.genres.length > 2 && (
              <span className="text-xs text-[#5B86A1]">+{book.genres.length - 2}</span>
            )}
          </div>
        )}

        {/* Прогресс текстом */}
        {hasUserData && userData.current_page > 0 && book.total_pages && (
          <div className="mt-2 text-xs text-[#97A6BA]">
            {userData.current_page} / {book.total_pages} стр. ({progress}%)
          </div>
        )}

        {/* Кнопки */}
        <div className="mt-3 flex gap-2">
          {!hasUserData && onAddToMyLibrary && (
            <div className="relative flex-1">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={isAdding}
                className="w-full px-3 py-2 text-xs font-medium bg-[#2A4B60] hover:bg-[#3A5570] text-[#E6EDF3] rounded-lg transition disabled:opacity-50"
              >
                {isAdding ? 'Добавление...' : '+ В библиотеку'}
              </button>
              {showStatusMenu && (
                <div className="absolute z-10 mt-1 w-full bg-[#1A2832] border border-[#2A4B60] rounded-lg shadow-xl py-1">
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

          {hasUserData && onToggleFavorite && (
            <button
              onClick={handleToggleFavorite}
              className={`px-3 py-2 text-sm rounded-lg transition ${
                userData.is_favorite
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-[#2A4B60] text-[#97A6BA] hover:text-[#E6EDF3]'
              }`}
            >
              {userData.is_favorite ? '⭐' : '☆'}
            </button>
          )}

          {hasUserData && onUpdateStatus && (
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="px-3 py-2 text-sm bg-[#2A4B60] hover:bg-[#3A5570] text-[#E6EDF3] rounded-lg transition"
              >
                📝
              </button>
              {showStatusMenu && (
                <div className="absolute z-10 mt-1 right-0 w-48 bg-[#1A2832] border border-[#2A4B60] rounded-lg shadow-xl py-1">
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
      </div>
    </div>
  );
}