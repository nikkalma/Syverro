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
        background: 'var(--surface-alt)',
        borderRadius: '12px',
        border: '1px solid var(--border-soft)',
        padding: '16px 20px',
        height: '100%',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
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
            color: 'var(--text-primary)',
          }}
        >
          {vibes.map((v: string) => (
            <span key={v}>{t.taxonomy.vibe?.[v] || v}</span>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Не заполнено</div>
      )}
    </div>
  );
}