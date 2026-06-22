// src/components/book/BookNotes.tsx
import { useState } from 'react';
import type { Book } from '../../types/book';

interface BookNotesProps {
  book: Book;
  onUpdateNotes: (notes: string) => void;
}

export default function BookNotes({ book, onUpdateNotes }: BookNotesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(book.notes || '');

  const handleSave = () => {
    onUpdateNotes(notes);
    setIsEditing(false);
  };

  if (!isEditing && !book.notes) {
    return (
      <div className="bg-[#121C24] border border-[#2A4B60] rounded-2xl p-6 mb-6">
        <button
          onClick={() => setIsEditing(true)}
          className="w-full py-4 text-[#5B86A1] hover:text-[#E6EDF3] transition border border-dashed border-[#2A4B60] rounded-xl text-sm"
        >
          📝 Добавить заметки
        </button>
      </div>
    );
  }

  if (!isEditing && book.notes) {
    return (
      <div className="bg-[#121C24] border border-[#2A4B60] rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-[#E6EDF3] font-light mb-3">📝 Заметки</h3>
            <p className="text-[#97A6BA] text-sm whitespace-pre-wrap leading-relaxed">
              {book.notes}
            </p>
          </div>
          <button
            onClick={() => {
              setNotes(book.notes || '');
              setIsEditing(true);
            }}
            className="text-sm text-[#5B86A1] hover:text-[#E6EDF3] transition ml-4"
          >
            ✏️
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121C24] border border-[#2A4B60] rounded-2xl p-6 mb-6">
      <h3 className="text-[#E6EDF3] font-light mb-3">📝 Заметки</h3>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Ваши заметки о книге..."
        className="w-full px-4 py-3 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] placeholder-[#5B86A1] focus:outline-none focus:border-[#5B86A1] resize-none h-32"
      />
      <div className="flex gap-3 mt-3">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-[#5B86A1] hover:bg-[#4A7590] rounded-lg text-[#0A1118] font-medium transition"
        >
          💾 Сохранить
        </button>
        <button
          onClick={() => {
            setNotes(book.notes || '');
            setIsEditing(false);
          }}
          className="px-4 py-2 bg-[#2A4B60] hover:bg-[#3A5570] rounded-lg text-[#E6EDF3] transition"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}