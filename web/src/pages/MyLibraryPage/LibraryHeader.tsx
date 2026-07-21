import { personalBookStatusLabels, personalBookStatusColors } from '../../types/personalBook';
import { getLocaleData, getBrowserLocale } from '../../locales';

interface LibraryHeaderProps {
  stats: {
    total: number;
    reading: number;
    planned: number;
    completed: number;
    postponed: number;
    abandoned: number;
    rereading?: number;
  };
}

export default function LibraryHeader({ stats }: LibraryHeaderProps) {
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);

  const items = [
    { key: 'total', label: t.library?.total || 'Всего', value: stats.total, color: '#E6EDF3' },
    { key: 'reading', label: personalBookStatusLabels.reading, value: stats.reading, color: personalBookStatusColors.reading.text },
    { key: 'planned', label: personalBookStatusLabels.planned, value: stats.planned, color: personalBookStatusColors.planned.text },
    { key: 'completed', label: personalBookStatusLabels.completed, value: stats.completed, color: personalBookStatusColors.completed.text },
    { key: 'rereading', label: personalBookStatusLabels.rereading, value: stats.rereading || 0, color: personalBookStatusColors.rereading.text },
    { key: 'postponed', label: personalBookStatusLabels.postponed, value: stats.postponed, color: personalBookStatusColors.postponed.text },
    { key: 'abandoned', label: personalBookStatusLabels.abandoned, value: stats.abandoned, color: personalBookStatusColors.abandoned.text },
  ].filter((item) => item.value > 0);

  return (
    <div style={{ marginBottom: '24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '300', color: '#E6EDF3', marginBottom: '12px' }}>
        {t.library?.title || 'Личная библиотека'}
      </h1>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {items.map((item) => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: '400', color: item.color }}>
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
