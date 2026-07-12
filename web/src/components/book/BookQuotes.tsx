// src/components/book/BookQuotes.tsx
import { useState } from 'react';
import type { EnrichedBook } from '@/types/globalBook';
import type { Quote } from '@/types/personalBook';

interface BookQuotesProps {
  book: EnrichedBook;
  onAddQuote: (text: string, page?: number, note?: string) => void;
  onDeleteQuote: (quoteId: string) => void;
}

export default function BookQuotes({
  book,
  onAddQuote,
  onDeleteQuote,
}: BookQuotesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [note, setNote] = useState('');

  const quotes: Quote[] = book.personal?.quotes ?? [];

  const handleSubmit = () => {
    if (!text.trim()) return;

    onAddQuote(
      text.trim(),
      page ? Number(page) : undefined,
      note.trim() || undefined
    );

    setText('');
    setPage('');
    setNote('');
    setIsAdding(false);
  };

  return (
    <div className="bg-[#121C24] border border-[#2A4B60] rounded-2xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[#E6EDF3] font-light">
          💬 Цитаты ({quotes.length})
        </h3>

        <button
          onClick={() => setIsAdding(true)}
          className="text-sm text-[#5B86A1] hover:text-[#E6EDF3]"
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
            className="w-full px-4 py-2 bg-[#0A1118] border border-[#1A2832] rounded-lg text-[#E6EDF3]"
          />

          <div className="flex gap-3 mt-3">
            <input
              type="number"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              placeholder="Страница"
              className="w-32 px-4 py-2 bg-[#0A1118] border border-[#1A2832] rounded-lg text-[#E6EDF3]"
            />

            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Комментарий"
              className="flex-1 px-4 py-2 bg-[#0A1118] border border-[#1A2832] rounded-lg text-[#E6EDF3]"
            />
          </div>

          <div className="flex gap-3 mt-3">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#5B86A1] rounded-lg text-[#0A1118]"
            >
              Сохранить
            </button>

            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-[#2A4B60] rounded-lg text-[#E6EDF3]"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {quotes.map((quote: Quote) => (
          <div
            key={quote.id}
            className="bg-[#0A1118] rounded-lg p-4 border border-[#1A2832]"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-[#E6EDF3] italic">
                  "{quote.text}"
                </p>

                {quote.page && (
                  <span className="text-xs text-[#5B86A1]">
                    Стр. {quote.page}
                  </span>
                )}
              </div>

              <button
                onClick={() => onDeleteQuote(quote.id)}
                className="text-red-400"
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