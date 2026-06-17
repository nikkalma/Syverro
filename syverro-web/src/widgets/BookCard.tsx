import { useState } from 'react';
import type { Book } from '../entities/book/book.types';

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusBadge = () => {
    const map: Record<string, string> = {
      reading: '📖 Читаю',
      finished: '✅ Прочитано',
      planned: '📅 В планах',
      postponed: '⏸ Отложено',
      abandoned: '❌ Брошено',
      rereading: '🔄 Перечитываю',
    };
    return map[book.status] || '';
  };

  return (
    <div
      className="bg-[#121C24] rounded-xl border border-[#2A4B60] overflow-hidden transition-all duration-200 hover:border-[#5B86A1] hover:shadow-lg hover:shadow-[#5B86A1]/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ transform: isHovered ? 'translateY(-4px)' : 'none' }}
    >
      <div className="aspect-[2/3] bg-[#0A1118] flex items-center justify-center p-4">
        {book.cover ? (
          <img src={book.cover} alt={book.title} className="w-full h-full object-cover rounded-lg" />
        ) : (
          <div className="text-center">
            <div className="text-6xl text-[#2A4B60]">📖</div>
            <div className="text-[#5B86A1] text-sm mt-2">{book.title || 'Без названия'}</div>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-[#E6EDF3] font-medium truncate">{book.title || 'Без названия'}</div>
        <div className="text-[#5B86A1] text-sm truncate">{book.author || 'Неизвестный автор'}</div>
        <div className="mt-2 text-xs text-[#97A6BA]">{getStatusBadge()}</div>
      </div>
    </div>
  );
}