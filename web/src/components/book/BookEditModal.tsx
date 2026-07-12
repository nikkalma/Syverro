import { useState } from 'react';
import type { EnrichedBook } from '@/types/globalBook';
import type {
  PersonalBookStatus,
  ReadingFormat,
} from '@/types/personalBook';

interface BookEditModalProps {
  book: EnrichedBook;
  onSave: (data: Partial<EnrichedBook>) => void;
  onClose: () => void;
}

export default function BookEditModal({
  book,
  onSave,
  onClose,
}: BookEditModalProps) {
  const personal = book.personal;

  const [form, setForm] = useState({
    title: book.title,
    author: book.author,
    genres: book.genres.join(', '),

    status: personal?.status ?? 'planned' as PersonalBookStatus,
    readingFormat: personal?.readingFormat ?? 'paper' as ReadingFormat,
    notes: personal?.notes ?? '',
    review: personal?.review ?? '',
  });


  const handleSubmit = () => {
    onSave({
      title: form.title,
      author: form.author,
      genres: form.genres
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),

      personal: personal
        ? {
            ...personal,
            status: form.status,
            readingFormat: form.readingFormat,
            notes: form.notes,
            review: form.review,
            updatedAt: Date.now(),
          }
        : null,
    });

    onClose();
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#121C24] border border-[#2A4B60] rounded-2xl p-6 w-full max-w-xl">

        <h2 className="text-xl text-[#E6EDF3] mb-4">
          Редактирование книги
        </h2>


        <input
          value={form.title}
          onChange={(e) =>
            setForm({
              ...form,
              title: e.target.value,
            })
          }
          className="w-full mb-3 px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3]"
          placeholder="Название"
        />


        <input
          value={form.author}
          onChange={(e) =>
            setForm({
              ...form,
              author: e.target.value,
            })
          }
          className="w-full mb-3 px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3]"
          placeholder="Автор"
        />


        <input
          value={form.genres}
          onChange={(e) =>
            setForm({
              ...form,
              genres: e.target.value,
            })
          }
          className="w-full mb-3 px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3]"
          placeholder="Жанры через запятую"
        />


        <textarea
          value={form.notes}
          onChange={(e) =>
            setForm({
              ...form,
              notes: e.target.value,
            })
          }
          className="w-full mb-3 px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3]"
          placeholder="Личные заметки"
        />


        <textarea
          value={form.review}
          onChange={(e) =>
            setForm({
              ...form,
              review: e.target.value,
            })
          }
          className="w-full mb-3 px-4 py-2 bg-[#0A1118] border border-[#2A4B60] rounded-lg text-[#E6EDF3]"
          placeholder="Личный отзыв"
        />


        <div className="flex justify-end gap-3 mt-4">

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2A4B60] rounded-lg text-[#E6EDF3]"
          >
            Отмена
          </button>


          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#5B86A1] rounded-lg text-[#0A1118]"
          >
            Сохранить
          </button>

        </div>

      </div>
    </div>
  );
}