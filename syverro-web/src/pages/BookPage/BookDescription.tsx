// src/pages/BookPage/BookDescription.tsx
import { EnrichedBook } from '../../types/book';

interface BookDescriptionProps {
  book: EnrichedBook;
}

export function BookDescription({ book }: BookDescriptionProps) {
  if (!book.description) return null;

  return (
    <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#E6EDF3', marginBottom: '12px' }}>
        📖 Описание
      </h3>
      <p style={{ color: '#97A6BA', lineHeight: '1.8', fontSize: '15px' }}>{book.description}</p>
    </div>
  );
}