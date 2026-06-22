// src/components/library/ReaderPortrait.tsx
import { BookEntry } from '../../types/bookEntry';

interface ReaderPortraitProps {
  entries: BookEntry[];
}

export function ReaderPortrait({ entries }: ReaderPortraitProps) {
  console.log('📊 ReaderPortrait entries:', entries);
  console.log('📊 hasData:', entries.length > 0);

  const hasData = entries.length > 0;

  return (
    <div
      style={{
        background: 'rgba(18, 28, 36, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '24px',
        marginTop: '24px',
      }}
    >
      <h3
        style={{
          fontSize: '16px',
          fontWeight: '400',
          color: '#E6EDF3',
          marginBottom: '8px',
        }}
      >
        🧠 Читательский портрет
      </h3>
      {hasData ? (
        <p style={{ color: '#5B86A1', fontSize: '14px' }}>
          Недостаточно данных для анализа. Продолжайте пополнять библиотеку.
        </p>
      ) : (
        <p style={{ color: '#5B86A1', fontSize: '14px' }}>
          Начните добавлять книги, чтобы увидеть свой читательский портрет.
        </p>
      )}
    </div>
  );
}