
// src/pages/MyLibraryPage/BookDrawer.tsx

import type { EnrichedBook } from '@/types/globalBook';
import { useLibraryStore } from '@/store/libraryStore';


interface BookDrawerProps {
  book: EnrichedBook;
  onClose: () => void;
}


export default function BookDrawer({
  book,
  onClose,
}: BookDrawerProps) {
  const {
    personalBooks,
    updateBookStatus,
    updateProgress,
  } = useLibraryStore();

  const personalBook = personalBooks.find(
    (item) => item.bookId === book.id
  );

  if (!personalBook) {
    return null;
  }

  return (
    <div>
      <button onClick={onClose}>
        Закрыть
      </button>

      <h2>{book.title}</h2>

      <p>
        Статус: {personalBook.status}
      </p>

      <p>
        Страница: {personalBook.currentPage}
      </p>

      <button
        onClick={() =>
          updateBookStatus(
            book.id,
            'completed'
          )
        }
      >
        Отметить прочитанной
      </button>

      <button
        onClick={() =>
          updateProgress(
            book.id,
            personalBook.currentPage + 1
          )
        }
      >
        Следующая страница
      </button>
    </div>
  );
}
