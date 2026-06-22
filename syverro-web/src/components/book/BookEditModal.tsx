// src/components/book/BookEditModal.tsx
import { useState } from 'react';
import type { Book, BookStatus, ReadingFormat } from '../../types/book';

interface BookEditModalProps {
  isOpen: boolean;
  book: Book;
  onClose: () => void;
  onSave: (book: Book) => void;
}

const statusOptions: { value: BookStatus; label: string }[] = [
  { value: 'planned', label: 'В планах' },
  { value: 'reading', label: 'Читаю' },
  { value: 'finished', label: 'Прочитано' },
  { value: 'postponed', label: 'Отложено' },
  { value: 'abandoned', label: 'Брошено' },
  { value: 'rereading', label: 'Перечитываю' },
];

const formatOptions: { value: ReadingFormat; label: string }[] = [
  { value: 'reading', label: '📖 Текст' },
  { value: 'listening', label: '🎧 Аудио' },
];

export default function BookEditModal({ isOpen, book, onClose, onSave }: BookEditModalProps) {
  const [form, setForm] = useState({
    title: book.title,
    author: book.author,
    status: book.status,
    rating: book.rating || 0,
    genres: book.genres.join(', '),
    totalPages: book.totalPages || 0,
    authorCountry: book.authorCountry || '',
    series: book.series || '',
    seriesPosition: book.seriesPosition || '',
    originalYear: book.originalYear || '',
    readingFormat: book.readingFormat,
    review: book.review || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Book = {
      ...book,
      title: form.title,
      author: form.author,
      status: form.status,
      rating: form.rating || null,
      genres: form.genres.split(',').map(g => g.trim()).filter(Boolean),
      totalPages: form.totalPages || 0,
      authorCountry: form.authorCountry || null,
      series: form.series || null,
      seriesPosition: form.seriesPosition ? parseInt(form.seriesPosition) : null,
      originalYear: form.originalYear ? parseInt(form.originalYear) : null,
      readingFormat: form.readingFormat,
      review: form.review || '',
    };
    onSave(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121C24] border border-[#2A4B60] rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-light text-[#E6EDF3] mb-6">✏️ Редактировать книгу</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#97A6BA] block mb-1">Название *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] focus:outline-none focus:border-[#5B86A1]"
                required
              />
            </div>
            <div>
              <label className="text-sm text-[#97A6BA] block mb-1">Автор *</label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="w-full px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] focus:outline-none focus:border-[#5B86A1]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#97A6BA] block mb-1">Статус</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as BookStatus })}
                className="w-full px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] focus:outline-none focus:border-[#5B86A1]"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-[#97A6BA] block mb-1">Оценка (1-5)</label>
              <select
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] focus:outline-none focus:border-[#5B86A1]"
              >
                <option value={0}>Нет оценки</option>
                {[1, 2, 3, 4, 5].map((r) => (
                  <option key={r} value={r}>{r} ★</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-[#97A6BA] block mb-1">Жанры (через запятую)</label>
            <input
              type="text"
              value={form.genres}
              onChange={(e) => setForm({ ...form, genres: e.target.value })}
              placeholder="Фантастика, Детектив, Роман..."
              className="w-full px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] placeholder-[#5B86A1] focus:outline-none focus:border-[#5B86A1]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#97A6BA] block mb-1">Всего страниц</label>
              <input
                type="number"
                value={form.totalPages || ''}
                onChange={(e) => setForm({ ...form, totalPages: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] focus:outline-none focus:border-[#5B86A1]"
              />
            </div>
            <div>
              <label className="text-sm text-[#97A6BA] block mb-1">Формат чтения</label>
              <select
                value={form.readingFormat}
                onChange={(e) => setForm({ ...form, readingFormat: e.target.value as ReadingFormat })}
                className="w-full px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] focus:outline-none focus:border-[#5B86A1]"
              >
                {formatOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-[#97A6BA] block mb-1">Страна автора</label>
              <input
                type="text"
                value={form.authorCountry}
                onChange={(e) => setForm({ ...form, authorCountry: e.target.value })}
                className="w-full px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] focus:outline-none focus:border-[#5B86A1]"
              />
            </div>
            <div>
              <label className="text-sm text-[#97A6BA] block mb-1">Серия</label>
              <input
                type="text"
                value={form.series}
                onChange={(e) => setForm({ ...form, series: e.target.value })}
                className="w-full px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] focus:outline-none focus:border-[#5B86A1]"
              />
            </div>
            <div>
              <label className="text-sm text-[#97A6BA] block mb-1">Номер в серии</label>
              <input
                type="number"
                value={form.seriesPosition}
                onChange={(e) => setForm({ ...form, seriesPosition: e.target.value })}
                className="w-full px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] focus:outline-none focus:border-[#5B86A1]"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-[#97A6BA] block mb-1">Год оригинала</label>
            <input
              type="number"
              value={form.originalYear}
              onChange={(e) => setForm({ ...form, originalYear: e.target.value })}
              className="w-full px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] focus:outline-none focus:border-[#5B86A1]"
            />
          </div>

          <div>
            <label className="text-sm text-[#97A6BA] block mb-1">Рецензия</label>
            <textarea
              value={form.review}
              onChange={(e) => setForm({ ...form, review: e.target.value })}
              className="w-full px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3] placeholder-[#5B86A1] focus:outline-none focus:border-[#5B86A1] resize-none h-24"
              placeholder="Ваши впечатления о книге..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#2A4B60]">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#5B86A1] hover:bg-[#4A7590] rounded-lg text-[#0A1118] font-medium transition"
            >
              💾 Сохранить
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#2A4B60] hover:bg-[#3A5570] rounded-lg text-[#E6EDF3] transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}