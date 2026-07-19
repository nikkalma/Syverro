// src/pages/BookPage/BookDescription.tsx
import { EnrichedBook } from '@/types/globalBook';

interface BookDescriptionProps {
  book: EnrichedBook;
}

export function BookDescription({ book }: BookDescriptionProps) {
  return (
    <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#E6EDF3', marginBottom: '12px' }}>
        📖 Описание
      </h3>
      <p style={{
        color: book.description ? '#97A6BA' : '#5B86A1',
        lineHeight: '1.8',
        fontSize: '15px',
        fontStyle: book.description ? 'normal' : 'italic',
      }}>
        {book.description || 'Описание пока отсутствует'}
      </p>
    </div>
  );
}
