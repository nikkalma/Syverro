import type { GlobalBook } from '@/types/globalBook';
import type { PersonalBook } from '@/types/personalBook';

import { useLibraryStore } from '@/store/libraryStore';


interface LibrarySectionProps {
  books: GlobalBook[];
}


export default function LibrarySection({
  books,
}: LibrarySectionProps) {

  const {
    personalBooks,
  } = useLibraryStore();


  const userBookMap = new Map<string, PersonalBook>(
    personalBooks.map((book) => [
      book.bookId,
      book,
    ])
  );


  const readingBooks = books.filter(
    (book) =>
      userBookMap.get(book.id)?.status === 'reading'
  );


  const completedBooks = books.filter(
    (book) =>
      userBookMap.get(book.id)?.status === 'completed'
  );


  const favoriteBooks = books.filter(
    (book) =>
      userBookMap.get(book.id)?.favorite
  );


  return (
    <section className="bg-[#121C24] border border-[#2A4B60] rounded-2xl p-6">

      <h2 className="text-xl text-[#E6EDF3] mb-6">
        Моя библиотека
      </h2>


      <div className="grid grid-cols-3 gap-4">

        <div>
          <div className="text-2xl text-[#E6EDF3]">
            {readingBooks.length}
          </div>

          <div className="text-sm text-[#97A6BA]">
            Читаю
          </div>
        </div>


        <div>
          <div className="text-2xl text-[#E6EDF3]">
            {completedBooks.length}
          </div>

          <div className="text-sm text-[#97A6BA]">
            Прочитано
          </div>
        </div>


        <div>
          <div className="text-2xl text-[#E6EDF3]">
            {favoriteBooks.length}
          </div>

          <div className="text-sm text-[#97A6BA]">
            Избранное
          </div>
        </div>

      </div>

    </section>
  );
}