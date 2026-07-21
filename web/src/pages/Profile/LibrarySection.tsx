import type { GlobalBook } from '@/types/globalBook';
import type { PersonalBook, PersonalBookStatus } from '@/types/personalBook';
import { personalBookStatusLabels, personalBookStatusColors } from '@/types/personalBook';

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

  const total = books.length;

  const counts: Record<PersonalBookStatus, number> = {
    reading: 0,
    rereading: 0,
    completed: 0,
    planned: 0,
    postponed: 0,
    abandoned: 0,
  };

  for (const book of books) {
    const ub = userBookMap.get(book.id);
    if (ub && ub.status in counts) {
      counts[ub.status]++;
    }
  }

  const favoriteCount = books.filter(
    (book) => userBookMap.get(book.id)?.favorite
  ).length;

  const statItems = [
    { label: 'Всего', value: total, color: '#E6EDF3', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
    { label: personalBookStatusLabels.reading, value: counts.reading, ...personalBookStatusColors.reading },
    { label: personalBookStatusLabels.planned, value: counts.planned, ...personalBookStatusColors.planned },
    { label: personalBookStatusLabels.completed, value: counts.completed, ...personalBookStatusColors.completed },
    { label: personalBookStatusLabels.rereading, value: counts.rereading, ...personalBookStatusColors.rereading },
    { label: personalBookStatusLabels.postponed, value: counts.postponed, ...personalBookStatusColors.postponed },
    { label: personalBookStatusLabels.abandoned, value: counts.abandoned, ...personalBookStatusColors.abandoned },
    { label: 'Избранное', value: favoriteCount, color: '#D4A76A', bg: 'rgba(212, 167, 106, 0.1)', border: 'rgba(212, 167, 106, 0.2)' },
  ].filter((item) => item.value > 0);


  return (
    <section style={{
      background: '#121C24',
      border: '1px solid #2A4B60',
      borderRadius: '16px',
      padding: '24px',
    }}>

      <h2 style={{ fontSize: '20px', color: '#E6EDF3', marginBottom: '24px' }}>
        Моя библиотека
      </h2>


      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '16px' }}>
        {statItems.map((item) => (
          <div key={item.label} style={{
            background: item.bg,
            border: `1px solid ${item.border}`,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', fontWeight: '400', color: item.color, marginBottom: '4px' }}>
              {item.value}
            </div>
            <div style={{ fontSize: '12px', color: '#97A6BA' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}
