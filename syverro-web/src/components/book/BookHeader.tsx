// src/components/book/BookHeader.tsx
import type { Book } from '../../types/book';

interface BookHeaderProps {
  book: Book;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

const statusLabels: Record<string, string> = {
  planned: 'В планах',
  reading: 'Читаю',
  finished: 'Прочитано',
  postponed: 'Отложено',
  abandoned: 'Брошено',
  rereading: 'Перечитываю',
};

export default function BookHeader({ book, onEdit, onDelete, onToggleFavorite }: BookHeaderProps) {
  return (
    <div className="bg-[#121C24] border border-[#2A4B60] rounded-2xl p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Обложка */}
        <div className="flex-shrink-0">
          <div className="w-48 h-72 bg-[#0A1118] rounded-lg flex items-center justify-center border border-[#2A4B60] relative overflow-hidden">
            {book.cover ? (
              <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-[#5B86A1] p-4">
                <div className="text-6xl mb-2">📖</div>
                <div className="text-sm line-clamp-3">{book.title}</div>
              </div>
            )}
            
            <div className="absolute top-3 right-3">
              <span className={`text-xs px-3 py-1 rounded-full border backdrop-blur-sm ${
                book.status === 'reading' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                book.status === 'finished' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                book.status === 'rereading' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                'bg-gray-500/20 text-gray-400 border-gray-500/30'
              }`}>
                {statusLabels[book.status] || book.status}
              </span>
            </div>
          </div>
        </div>

        {/* Информация */}
        <div className="flex-1">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-light text-[#E6EDF3]">{book.title}</h1>
              <p className="text-xl text-[#97A6BA]">{book.author}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onToggleFavorite}
                className={`px-3 py-2 text-xl rounded-lg transition ${
                  book.favorite ? 'text-yellow-400' : 'text-[#97A6BA] hover:text-[#E6EDF3]'
                }`}
                title={book.favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
              >
                {book.favorite ? '⭐' : '☆'}
              </button>
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-[#2A4B60] hover:bg-[#3A5570] rounded-lg text-[#E6EDF3] transition text-sm"
              >
                ✏️ Редактировать
              </button>
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition text-sm"
              >
                🗑️
              </button>
            </div>
          </div>

          {book.rating && (
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < book.rating! ? 'text-yellow-400' : 'text-[#2A4B60]'}>
                  ★
                </span>
              ))}
              <span className="text-sm text-[#97A6BA] ml-2">{book.rating}/5</span>
            </div>
          )}

          {book.genres && book.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {book.genres.map((genre) => (
                <span key={genre} className="text-xs px-3 py-1 bg-[#0A1118] border border-[#2A4B60] rounded-full text-[#5B86A1]">
                  #{genre}
                </span>
              ))}
            </div>
          )}

          {book.review && (
            <div className="mt-4 p-4 bg-[#0A1118] rounded-lg border border-[#1A2832]">
              <p className="text-[#97A6BA] text-sm italic leading-relaxed">
                "{book.review}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}