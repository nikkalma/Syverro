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
        Мотивы
      </div>

      {motifs.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px 8px',
            fontSize: '13px',
            color: 'var(--text-primary)',
          }}
        >
          {motifs.map((m: string) => (
            <span key={m}>{t.taxonomy.motif?.[m] || m}</span>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Не заполнено</div>
      )}
    </div>
  );
}