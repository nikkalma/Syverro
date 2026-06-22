// src/pages/Profile/ReaderIdentitySection/Vibes.tsx
import { LocaleData } from '../../../locales';

interface VibesProps {
  profile: any;
  t: LocaleData;
}

export function Vibes({ profile, t }: VibesProps) {
  const vibes = profile.favoriteVibes || [];

  return (
    <div
      style={{
        background: 'rgba(18, 28, 36, 0.5)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 20px',
        height: '100%',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: '#5B86A1',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '12px',
        }}
      >
        Атмосфера
      </div>

      {vibes.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px 8px',
            fontSize: '13px',
            color: '#E6EDF3',
          }}
        >
          {vibes.map((v: string) => (
            <span key={v}>{t.taxonomy.vibe?.[v] || v}</span>
          ))}
        </div>
      ) : (
        <div style={{ color: '#5B86A1', fontSize: '12px' }}>Не заполнено</div>
      )}
    </div>
  );
}