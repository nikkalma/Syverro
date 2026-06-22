// src/pages/Profile/ReaderIdentitySection/QuoteOfTheDay.tsx
import { LocaleData } from '../../../locales';

interface QuoteOfTheDayProps {
  profile: any;
  t: LocaleData;
}

// Пока статичная цитата, потом можно сделать из профиля
const DEFAULT_QUOTE = '«Книги — это корабли мысли, странствующие по волнам времени» — Фрэнсис Бэкон';

export function QuoteOfTheDay({ profile, t }: QuoteOfTheDayProps) {
  const quote = profile.quoteOfTheDay || DEFAULT_QUOTE;

  return (
    <div
      style={{
        background: 'rgba(18, 28, 36, 0.5)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
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
          color: '#5B86A1',
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
          color: '#97A6BA',
          fontStyle: 'italic',
          lineHeight: '1.5',
        }}
      >
        {quote}
      </div>
    </div>
  );
}