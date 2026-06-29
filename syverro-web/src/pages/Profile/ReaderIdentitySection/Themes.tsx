// src/pages/Profile/ReaderIdentitySection/Themes.tsx
import { LocaleData } from '../../../locales';

interface ThemesProps {
  profile: any;
  t: LocaleData;
}

export function Themes({ profile, t }: ThemesProps) {
  const themes = profile.favoriteThemes || [];

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
        Темы
      </div>

      {themes.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px 8px',
            fontSize: '13px',
            color: 'var(--text-primary)',
          }}
        >
          {themes.map((th: string) => (
            <span key={th}>{t.taxonomy.theme?.[th] || th}</span>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Не заполнено</div>
      )}
    </div>
  );
}