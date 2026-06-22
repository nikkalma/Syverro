// src/components/library/LibraryDashboard.tsx
import { BookEntry } from '../../types/bookEntry';

interface LibraryDashboardProps {
  entries: BookEntry[];
}

export function LibraryDashboard({ entries }: LibraryDashboardProps) {
  const total = entries.length;
  const reading = entries.filter((e) => e.status === 'reading').length;
  const completed = entries.filter((e) => e.status === 'completed').length;
  const planned = entries.filter((e) => e.status === 'planned').length;
  const paused = entries.filter((e) => e.status === 'paused').length;
  const dropped = entries.filter((e) => e.status === 'dropped').length;

  const stats = [
    { label: 'Всего книг', value: total, color: '#E6EDF3' },
    { label: 'Читаю', value: reading, color: '#5B86A1' },
    { label: 'Прочитано', value: completed, color: '#4CAF50' },
    { label: 'Планирую', value: planned, color: '#97A6BA' },
    { label: 'Отложено', value: paused, color: '#FFA726' },
    { label: 'Брошено', value: dropped, color: '#EF5350' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px',
        marginBottom: '24px',
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            background: 'rgba(18, 28, 36, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: '300', color: stat.color }}>{stat.value}</div>
          <div style={{ fontSize: '12px', color: '#97A6BA', marginTop: '4px' }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}