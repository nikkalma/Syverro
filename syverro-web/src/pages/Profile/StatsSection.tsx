// src/pages/Profile/StatsSection.tsx
import { EnrichedBook } from '../../types/book';

interface StatsSectionProps {
  books: EnrichedBook[];
}

export default function StatsSection({ books }: StatsSectionProps) {
  const total = books.length;
  const completed = books.filter((b) => b.personal?.status === 'completed').length;
  const reading = books.filter((b) => b.personal?.status === 'reading' || b.personal?.status === 'rereading').length;

  const rated = books.filter((b) => b.personal?.rating);
  const avgRating =
    rated.length === 0 ? '—' : (rated.reduce((sum, b) => sum + (b.personal?.rating || 0), 0) / rated.length).toFixed(1);

  const stats = [
    { value: total, label: 'Всего книг', color: '#E6EDF3' },
    { value: completed, label: 'Прочитано', color: '#4CAF50' },
    { value: reading, label: 'Читаю сейчас', color: '#5B86A1' },
    { value: avgRating, label: 'Средняя оценка', color: '#FBBF24' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            background: 'rgba(18, 28, 36, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '28px', fontWeight: '300', color: stat.color }}>{stat.value}</div>
          <div style={{ fontSize: '13px', color: '#97A6BA', marginTop: '4px' }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}