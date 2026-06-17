import { useState } from 'react';
import type { BookStatus } from '../entities/book/book.types';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (book: { title: string; author: string; status: BookStatus }) => void;
  isLoading?: boolean;
}

export default function AddBookModal({ isOpen, onClose, onSave, isLoading }: AddBookModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<BookStatus>('planned');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    onSave({ title: title.trim(), author: author.trim(), status });
    setTitle('');
    setAuthor('');
    setStatus('planned');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#121C24] rounded-2xl p-8 w-full max-w-md border border-[#2A4B60] shadow-2xl">
        <h2 className="text-2xl font-light text-[#E6EDF3] mb-6">Добавить книгу</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Название книги *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] placeholder-[#5B86A1] focus:outline-none focus:border-[#5B86A1]"
              required
            />
            <input
              type="text"
              placeholder="Автор *"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] placeholder-[#5B86A1] focus:outline-none focus:border-[#5B86A1]"
              required
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BookStatus)}
              className="w-full px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] focus:outline-none focus:border-[#5B86A1]"
            >
              <option value="planned">📅 В планах</option>
              <option value="reading">📖 Читаю</option>
              <option value="finished">✅ Прочитано</option>
              <option value="postponed">⏸ Отложено</option>
              <option value="abandoned">❌ Брошено</option>
            </select>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#5B86A1] hover:bg-[#4A7590] rounded-full text-[#0A1118] font-medium transition disabled:opacity-50"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#2A4B60] hover:bg-[#3A5570] rounded-full text-[#E6EDF3] transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}