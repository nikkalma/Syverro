// src/pages/Profile/ReaderIdentitySection/MyReality.tsx
import { LocaleData } from '../../../locales';

interface MyRealityProps {
  profile: any;
  t: LocaleData;
}

export function MyReality({ profile, t }: MyRealityProps) {
  const nativeCountry = profile.nativeCountry;
  const currentCountry = profile.currentCountry;
  const nativeLang = profile.nativeLanguage;
  const spokenLangs = profile.spokenLanguages || [];
  const readingLangs = profile.readingLanguages || [];

  const hasData = nativeCountry || currentCountry || nativeLang || 
                  spokenLangs.length > 0 || readingLangs.length > 0;

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
        Моя реальность
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '6px' }}>
          (языковая среда)
        </span>
      </div>

      {hasData ? (
        <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
          {nativeCountry && currentCountry && nativeCountry === currentCountry ? (
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Страна: </span>
              {t.taxonomy.countries?.[nativeCountry] || nativeCountry}
            </div>
          ) : (
            <>
              {nativeCountry && (
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Родная страна: </span>
                  {t.taxonomy.countries?.[nativeCountry] || nativeCountry}
                </div>
              )}
              {currentCountry && (
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Страна проживания: </span>
                  {t.taxonomy.countries?.[currentCountry] || currentCountry}
                </div>
              )}
            </>
          )}

          {nativeLang && (
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Родной язык: </span>
              {t.taxonomy.languages?.[nativeLang] || nativeLang}
            </div>
          )}

          {spokenLangs.length > 0 && (
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Владею: </span>
              {spokenLangs
                .map((lang: string) => t.taxonomy.languages?.[lang] || lang)
                .join(' • ')}
            </div>
          )}

          {readingLangs.length > 0 && (
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Читаю на: </span>
              {readingLangs
                .map((lang: string) => t.taxonomy.languages?.[lang] || lang)
                .join(' • ')}
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Не заполнено</div>
      )}
    </div>
  );
}