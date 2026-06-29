// src/pages/Profile/ReaderIdentitySection/QuoteOfTheDay.tsx
import { LocaleData } from '../../../locales';

interface QuoteOfTheDayProps {
  profile: any;
  t: LocaleData;
}

const DEFAULT_QUOTE = '«Книги — это корабли мысли, странствующие по волнам времени» — Фрэнсис Бэкон';

export function QuoteOfTheDay({ profile, t }: QuoteOfTheDayProps) {
  const quote = profile.quoteOfTheDay || DEFAULT_QUOTE;

  return (
    <div
      style={{
        background: 'var(--surface-alt)',
        borderRadius: '12px',
        border: '1px solid var(--border-soft)',
        padding: '16px 20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '8px',
        }}
      >
        Цитата дня
      </div>
      <div
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
          lineHeight: '1.5',
        }}
      >
        {quote}
      </div>
    </div>
  );
}