import { useState } from 'react';
import type { Book } from '../entities/book/book.types';

interface BookCardProps {
  book: Book;
  onPress?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  showFavorite?: boolean;
}

export default function BookCard({ book, onPress, onToggleFavorite, showFavorite = true }: BookCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusBadge = () => {
    const statusMap: Record<string, string> = {
      reading: '📖 Читаю',
      finished: '✅ Прочитано',
      planned: '📅 В планах',
      postponed: '⏸ Отложено',
      abandoned: '❌ Брошено',
      rereading: '🔄 Перечитываю',
    };
    return statusMap[book.status] || '';
  };

  return (
    <div
      className="cursor-pointer transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPress?.(book.id)}
      style={{ transform: isHovered ? 'translateY(-4px)' : 'none' }}
    >
      <div className="relative">
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-auto rounded-lg object-cover"
            style={{ aspectRatio: '2/3' }}
          />
        ) : (
          <div className="bg-[#121C24] rounded-lg flex items-center justify-center border border-[#2A4B60]" style={{ aspectRatio: '2/3' }}>
            <div className="text-center px-2">
              <div className="text-[#E6EDF3] font-medium text-center line-clamp-4" style={{ fontSize: '14px', lineHeight: '18px' }}>
                {book.title || 'ТЕСТ'}
              </div>
            </div>
          </div>
        )}
        
        {showFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(book.id);
            }}
            className="absolute top-2 right-2 bg-black/50 rounded-full w-6 h-6 flex items-center justify-center text-sm hover:scale-110 transition"
          >
            {book.favorite ? '❤️' : '♡'}
          </button>
        )}
      </div>
      
      <div className="mt-2 px-1">
        <div className="text-[#E6EDF3] text-sm font-medium truncate">{book.title}</div>
        <div className="text-[#5B86A1] text-xs truncate">{book.author}</div>
        
        {book.status && (
          <div className="text-[10px] text-[#97A6BA] mt-1 truncate">
            {getStatusBadge()}
          </div>
        )}
        
        {book.rating && (
          <div className="text-xs text-yellow-500 mt-1">
            {'⭐'.repeat(book.rating)}
          </div>
        )}
      </div>
    </div>
  );
}