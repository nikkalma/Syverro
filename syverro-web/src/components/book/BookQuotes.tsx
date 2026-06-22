// src/components/book/BookQuotes.tsx
import { useState } from 'react';
import type { Book } from '../../types/book';

interface BookQuotesProps {
  book: Book;
  onAddQuote: (text: string, page?: number, note?: string) => void;
  onDeleteQuote: (quoteId: string) => void;
}

export default function BookQuotes({ book, onAddQuote, onDeleteQuote }: BookQuotesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAddQuote(text.trim(), page ? parseInt(page) : undefined, note.trim() || undefined);
    setText('');
    setPage('');
    setNote('');
    setIsAdding(false);
  };

  return (
    <div className="bg-[#121C24] border border-[#2A4B60] rounded-2xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[#E6EDF3] font-light">💬 Цитаты ({book.quotes.length})</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="text-sm text-[#5B86A1] hover:text-[#E6EDF3] transition"
        >
          + Добавить цитату
        </button>
      </div>

      {isAdding && (
        <div className="bg-[#0A1118] rounded-lg p-4 mb-4 border border-[#2A4B60]">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Введите цитату..."
            className="w-full px-4 py-2 bg-[#0A1118] border border-[#1A2832] rounded-lg text-[#E6EDF3] placeholder-[#5B86A1] focus:outline-none focus:border-[#5B86A1] resize-none h-20"
          />
          <div className="flex gap-3 mt-2">
            <input
              type="number"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              placeholder="Страница"
              className="w-32 px-4 py-2 bg-[#0A1118] border border-[#1A2832] rounded-lg text-[#E6EDF3] placeholder-[#5B86A1] focus:outline-none focus:border-[#5B86A1]"
            />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Комментарий (опционально)"
              className="flex-1 px-4 py-2 bg-[#0A1118] border border-[#1A2832] rounded-lg text-[#E6EDF3] placeholder-[#5B86A1] focus:outline-none focus:border-[#5B86A1]"
            />
          </div>
          <div className="flex gap-3 mt-3">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#5B86A1] hover:bg-[#4A7590] rounded-lg text-[#0A1118] font-medium transition"
            >
              Сохранить
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setText('');
                setPage('');
                setNote('');
              }}
              className="px-4 py-2 bg-[#2A4B60] hover:bg-[#3A5570] rounded-lg text-[#E6EDF3] transition"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {book.quotes.length === 0 && !isAdding && (
          <p className="text-[#5B86A1] text-sm text-center py-4">
            Пока нет цитат. Добавьте первую!
          </p>
        )}
        {book.quotes.map((quote) => (
          <div
            key={quote.id}
            className="bg-[#0A1118] rounded-lg p-4 border border-[#1A2832] hover:border-[#2A4B60] transition"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-[#E6EDF3] text-sm italic leading-relaxed">
                  "{quote.text}"
                </p>
                <div className="flex gap-4 mt-2 text-xs">
                  {quote.page && (
                    <span className="text-[#5B86A1]">Стр. {quote.page}</span>
                  )}
                  {quote.note && (
                    <span className="text-[#97A6BA]">💭 {quote.note}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onDeleteQuote(quote.id)}
                className="text-red-400 hover:text-red-300 transition text-sm ml-4"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}