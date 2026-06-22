// src/components/book/BookProgress.tsx
import type { Book } from '../../types/book';

interface BookProgressProps {
  book: Book;
  onUpdateProgress: (page: number) => void;
}

export default function BookProgress({ book, onUpdateProgress }: BookProgressProps) {
  const progress = book.totalPages
    ? Math.round((book.currentPage / book.totalPages) * 100)
    : 0;

  return (
    <div className="bg-[#121C24] border border-[#2A4B60] rounded-2xl p-6 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[#E6EDF3] font-light">📊 Прогресс чтения</h3>
        <span className="text-sm text-[#97A6BA]">
          {book.currentPage} / {book.totalPages || '?'} стр.
        </span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min={0}
          max={book.totalPages || 100}
          value={book.currentPage}
          onChange={(e) => onUpdateProgress(parseInt(e.target.value))}
          className="w-full h-2 bg-[#1A2832] rounded-lg appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none 
            [&::-webkit-slider-thumb]:w-4 
            [&::-webkit-slider-thumb]:h-4 
            [&::-webkit-slider-thumb]:rounded-full 
            [&::-webkit-slider-thumb]:bg-[#5B86A1]
            [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <div className="flex justify-between text-xs text-[#5B86A1] mt-1">
          <span>0%</span>
          <span>{progress}%</span>
          <span>100%</span>
        </div>
      </div>

      {book.lastRead && (
        <p className="text-xs text-[#5B86A1] mt-3">
          Последнее чтение: {new Date(book.lastRead).toLocaleDateString('ru-RU')}
        </p>
      )}
    </div>
  );
}