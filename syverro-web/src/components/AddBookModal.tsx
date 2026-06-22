// src/components/AddBookModal.tsx
import { useState } from 'react';
import type { BookStatus } from '../types/book';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (book: { title: string; author: string; status: BookStatus }) => void;
  isLoading?: boolean;
}

export default function AddBookModal({ isOpen, onClose, onSave, isLoading }: AddBookModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<BookStatus>('want_to_read');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    onSave({ title: title.trim(), author: author.trim(), status });
    setTitle('');
    setAuthor('');
    setStatus('want_to_read');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121C24] border border-[#2A4B60] rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-light text-[#E6EDF3] mb-6">Добавить книгу</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#97A6BA] block mb-1.5">Название книги *</label>
              <input
                type="text"
                placeholder="Введите название"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0A1118] border border-[#2A4B60] rounded-xl text-[#E6EDF3] placeholder-[#5B86A1] focus:outline-none focus:border-[#5B86A1] transition"
                required
              />
            </div>
            <div>
              <label className="text-sm text-[#97A6BA] block mb-1.5">Автор *</label>
              <input
                type="text"
                placeholder="Введите имя автора"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0A1118] border border-[#2A4B60] rounded-xl text-[#E6EDF3] placeholder-[#5B86A1] focus:outline-none focus:border-[#5B86A1] transition"
                required
              />
            </div>
            <div>
              <label className="text-sm text-[#97A6BA] block mb-1.5">Статус</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BookStatus)}
                className="w-full px-4 py-2.5 bg-[#0A1118] border border-[#2A4B60] rounded-xl text-[#E6EDF3] focus:outline-none focus:border-[#5B86A1] transition appearance-none cursor-pointer"
              >
                <option value="want_to_read">📌 Хочу прочитать</option>
                <option value="reading">📖 Читаю</option>
                <option value="completed">✅ Прочитано</option>
                <option value="postponed">⏸️ Отложено</option>
                <option value="abandoned">❌ Брошено</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-[#5B86A1] hover:bg-[#4A7590] rounded-xl text-[#0A1118] font-medium transition disabled:opacity-50"
            >
              {isLoading ? 'Сохранение...' : 'Добавить'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-[#2A4B60] hover:bg-[#3A5570] rounded-xl text-[#E6EDF3] transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}