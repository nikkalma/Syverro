
import type { PersonalBook } from '../../types/personalBook';

interface LibraryDashboardProps {
  entries: PersonalBook[];
}

export function LibraryDashboard({ entries }: LibraryDashboardProps) {
  const total = entries.length;

  const reading = entries.filter(
    (e) => e.status === 'reading'
  ).length;

  const rereading = entries.filter(
    (e) => e.status === 'rereading'
  ).length;

  const completed = entries.filter(
    (e) => e.status === 'completed'
  ).length;

  const planned = entries.filter(
    (e) => e.status === 'planned'
  ).length;

  const postponed = entries.filter(
    (e) => e.status === 'postponed'
  ).length;

  const abandoned = entries.filter(
    (e) => e.status === 'abandoned'
  ).length;

  const stats = [
    { label: 'Всего книг', value: total, color: '#E6EDF3' },
    { label: 'Читаю', value: reading, color: '#5B86A1' },
    { label: 'Перечитываю', value: rereading, color: '#8E7CC3' },
    { label: 'Прочитано', value: completed, color: '#4CAF50' },
    { label: 'Планирую', value: planned, color: '#97A6BA' },
    { label: 'Отложено', value: postponed, color: '#FFA726' },
    { label: 'Брошено', value: abandoned, color: '#EF5350' },
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
          <div
            style={{
              fontSize: '24px',
              fontWeight: '300',
              color: stat.color,
            }}
          >
            {stat.value}
          </div>

          <div
            style={{
              fontSize: '12px',
              color: '#97A6BA',
              marginTop: '4px',
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}