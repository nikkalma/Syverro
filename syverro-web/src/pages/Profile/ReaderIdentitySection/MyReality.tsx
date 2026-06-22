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
        Моя реальность
        <span style={{ fontSize: '10px', color: '#2A4B60', marginLeft: '6px' }}>
          (языковая среда)
        </span>
      </div>

      {hasData ? (
        <div style={{ fontSize: '13px', color: '#E6EDF3' }}>
          {/* Страна: если совпадают — одна строка, если нет — две */}
          {nativeCountry && currentCountry && nativeCountry === currentCountry ? (
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: '#97A6BA' }}>Страна: </span>
              {t.taxonomy.countries?.[nativeCountry] || nativeCountry}
            </div>
          ) : (
            <>
              {nativeCountry && (
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ color: '#97A6BA' }}>Родная страна: </span>
                  {t.taxonomy.countries?.[nativeCountry] || nativeCountry}
                </div>
              )}
              {currentCountry && (
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ color: '#97A6BA' }}>Страна проживания: </span>
                  {t.taxonomy.countries?.[currentCountry] || currentCountry}
                </div>
              )}
            </>
          )}

          {/* Родной язык */}
          {nativeLang && (
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: '#97A6BA' }}>Родной язык: </span>
              {t.taxonomy.languages?.[nativeLang] || nativeLang}
            </div>
          )}

          {/* Языки владения */}
          {spokenLangs.length > 0 && (
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: '#97A6BA' }}>Владею: </span>
              {spokenLangs
                .map((lang: string) => t.taxonomy.languages?.[lang] || lang)
                .join(' • ')}
            </div>
          )}

          {/* Языки чтения */}
          {readingLangs.length > 0 && (
            <div>
              <span style={{ color: '#97A6BA' }}>Читаю на: </span>
              {readingLangs
                .map((lang: string) => t.taxonomy.languages?.[lang] || lang)
                .join(' • ')}
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: '#5B86A1', fontSize: '12px' }}>Не заполнено</div>
      )}
    </div>
  );
}