import { statusLabels } from '../../types/userBook';
import { getLocaleData, getBrowserLocale } from '../../locales';

interface LibraryHeaderProps {
  stats: {
    total: number;
    reading: number;
    planned: number;
    completed: number;
    paused: number;
    dropped: number;
  };
}

export default function LibraryHeader({ stats }: LibraryHeaderProps) {
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);

  const items = [
    { key: 'total', label: t.library?.total || 'Всего', value: stats.total },
    { key: 'reading', label: statusLabels.reading, value: stats.reading },
    { key: 'planned', label: statusLabels.planned, value: stats.planned },
    { key: 'completed', label: statusLabels.completed, value: stats.completed },
    { key: 'paused', label: statusLabels.paused, value: stats.paused },
    { key: 'dropped', label: statusLabels.abandoned, value: stats.dropped },
  ].filter((item) => item.value > 0);

  return (
    <div style={{ marginBottom: '24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '300', color: '#E6EDF3', marginBottom: '12px' }}>
        {t.library?.title || 'Личная библиотека'}
      </h1>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {items.map((item) => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: '400', color: '#E6EDF3' }}>
              {item.value}
            </span>
            <span style={{ fontSize: '14px', color: '#97A6BA' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}