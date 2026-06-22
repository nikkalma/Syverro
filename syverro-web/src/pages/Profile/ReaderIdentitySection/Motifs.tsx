// src/pages/Profile/ReaderIdentitySection/Motifs.tsx
import { LocaleData } from '../../../locales';

interface MotifsProps {
  profile: any;
  t: LocaleData;
}

export function Motifs({ profile, t }: MotifsProps) {
  const motifs = profile.favoriteMotifs || [];

  return (
    <div
      style={{
        background: 'rgba(10, 17, 24, 0.5)',
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
        Мотивы
      </div>

      {motifs.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px 8px',
            fontSize: '13px',
            color: '#E6EDF3',
          }}
        >
          {motifs.map((m: string) => (
            <span key={m}>{t.taxonomy.motif?.[m] || m}</span>
          ))}
        </div>
      ) : (
        <div style={{ color: '#5B86A1', fontSize: '12px' }}>Не заполнено</div>
      )}
    </div>
  );
}