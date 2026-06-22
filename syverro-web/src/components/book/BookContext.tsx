// src/components/book/BookContext.tsx
import { useState } from 'react';
import type { Book } from '../../types/book';

interface BookContextProps {
  book: Book;
  onUpdateContext: (context: {
    mood?: string;
    readingContext?: string;
    reasonForReading?: string;
  }) => void;
}

const MOODS = [
  { value: 'joyful', emoji: '😊', label: 'Радостное' },
  { value: 'thoughtful', emoji: '🤔', label: 'Задумчивое' },
  { value: 'melancholic', emoji: '😌', label: 'Меланхоличное' },
  { value: 'inspired', emoji: '✨', label: 'Вдохновенное' },
  { value: 'calm', emoji: '😌', label: 'Спокойное' },
  { value: 'curious', emoji: '🔍', label: 'Любопытное' },
  { value: 'tired', emoji: '😴', label: 'Усталое' },
  { value: 'excited', emoji: '🤩', label: 'Взволнованное' },
];

export default function BookContext({ book, onUpdateContext }: BookContextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [mood, setMood] = useState(book.mood || '');
  const [context, setContext] = useState(book.readingContext || '');
  const [reason, setReason] = useState(book.reasonForReading || '');

  const hasContext = book.mood || book.readingContext || book.reasonForReading;

  const handleSave = () => {
    onUpdateContext({
      mood: mood || undefined,
      readingContext: context || undefined,
      reasonForReading: reason || undefined,
    });
    setIsEditing(false);
  };

  const handleReset = () => {
    setMood('');
    setContext('');
    setReason('');
    onUpdateContext({
      mood: undefined,
      readingContext: undefined,
      reasonForReading: undefined,
    });
    setIsEditing(false);
  };

  if (!isEditing && hasContext) {
    return (
      <div className="bg-[#121C24] border border-[#2A4B60] rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[#E6EDF3] font-light">📖 Контекст чтения</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-[#5B86A1] hover:text-[#E6EDF3] transition"
          >
            ✏️ Редактировать
          </button>
        </div>
        <div className="space-y-2 text-sm">
          {book.mood && (
            <div className="flex items-center gap-2">
              <span className="text-[#5B86A1]">Настроение:</span>
              <span className="text-[#E6EDF3]">
                {MOODS.find(m => m.value === book.mood)?.emoji} {MOODS.find(m => m.value === book.mood)?.label || book.mood}
              </span>
            </div>
          )}
          {book.readingContext && (
            <div>
              <span className="text-[#5B86A1]">Период жизни:</span>
              <span className="text-[#E6EDF3] ml-2">{book.readingContext}</span>
            </div>
          )}
          {book.reasonForReading && (
            <div>
              <span className="text-[#5B86A1]">Причина выбора:</span>
              <span className="text-[#E6EDF3] ml-2">{book.reasonForReading}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isEditing && !hasContext) {
    return (
      <div className="bg-[#121C24] border border-[#2A4B60] rounded-2xl p-6 mb-6">
        <button
          onClick={() => setIsEditing(true)}
          className="w-full py-4 text-[#5B86A1] hover:text-[#E6EDF3] transition border border-dashed border-[#2A4B60] rounded-xl text-sm"
        >
          ➕ Добавить контекст чтения (настроение, период, причина)
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#121C24] border border-[#2A4B60] rounded-2xl p-6 mb-6">
      <h3 className="text-[#E6EDF3] font-light mb-4">📖 Контекст чтения</h3>
      
      <div className="mb-4">
        <label className="text-sm text-[#97A6BA] block mb-2">Настроение</label>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                mood === m.value
                  ? 'bg-[#5B86A1] text-[#0A1118]'
                  : 'bg-[#0A1118] text-[#97A6BA] hover:text-[#E6EDF3]'
              }`}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm text-[#97A6BA] block mb-2">Период жизни / контекст</label>
        <input
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Например: переезд, отпуск, работа над проектом..."
          className="w-full px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] placeholder-[#5B86A1] focus:outline-none focus:border-[#5B86A1]"
        />
      </div>

      <div className="mb-4">
        <label className="text-sm text-[#97A6BA] block mb-2">Причина выбора</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Рекомендация друга, интерес к теме, случайность..."
          className="w-full px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] placeholder-[#5B86A1] focus:outline-none focus:border-[#5B86A1]"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-[#5B86A1] hover:bg-[#4A7590] rounded-lg text-[#0A1118] font-medium transition"
        >
          💾 Сохранить
        </button>
        <button
          onClick={handleReset}
          className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition"
        >
          🗑️ Очистить
        </button>
        <button
          onClick={() => {
            setMood(book.mood || '');
            setContext(book.readingContext || '');
            setReason(book.reasonForReading || '');
            setIsEditing(false);
          }}
          className="flex-1 px-4 py-2 bg-[#2A4B60] hover:bg-[#3A5570] rounded-lg text-[#E6EDF3] transition"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}