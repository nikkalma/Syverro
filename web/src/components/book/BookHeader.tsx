import type { EnrichedBook } from '@/types/globalBook';

interface BookHeaderProps {
  book: EnrichedBook;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

const personalBookStatusLabels: Record<string, string> = {
  planned: 'В планах',
  reading: 'Читаю',
  completed: 'Прочитано',
  postponed: 'Отложено',
  abandoned: 'Брошено',
  rereading: 'Перечитываю',
};

export default function BookHeader({
  book,
  onEdit,
  onDelete,
  onToggleFavorite,
}: BookHeaderProps) {
  const personal = book.personal;

  return (
    <div className="bg-[#121C24] border border-[#2A4B60] rounded-2xl p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-shrink-0">
          <div className="w-48 h-72 bg-[#0A1118] rounded-lg flex items-center justify-center border border-[#2A4B60] relative overflow-hidden">
            {book.cover ? (
              <img
                src={book.cover}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-[#5B86A1] p-4">
                <div className="text-6xl mb-2">📖</div>
                <div className="text-sm line-clamp-3">
                  {book.title}
                </div>
              </div>
            )}

            {personal && (
              <div className="absolute top-3 right-3">
                <span className="text-xs px-3 py-1 rounded-full border bg-gray-500/20 text-gray-400 border-gray-500/30">
                  {personalBookStatusLabels[personal.status]}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-light text-[#E6EDF3]">
                {book.title}
              </h1>

              <p className="text-xl text-[#97A6BA]">
                {book.author}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onToggleFavorite}
                className={`px-3 py-2 text-xl rounded-lg ${
                  personal?.favorite
                    ? 'text-yellow-400'
                    : 'text-[#97A6BA]'
                }`}
              >
                {personal?.favorite ? '⭐' : '☆'}
              </button>

              <button
                onClick={onEdit}
                className="px-4 py-2 bg-[#2A4B60] rounded-lg text-[#E6EDF3]"
              >
                ✏️ Редактировать
              </button>

              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-500/20 rounded-lg text-red-400"
              >
                🗑️
              </button>
            </div>
          </div>

          {book.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {book.genres.map((genre) => (
                <span
                  key={genre}
                  className="text-xs px-3 py-1 bg-[#0A1118] border border-[#2A4B60] rounded-full text-[#5B86A1]"
                >
                  #{genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}