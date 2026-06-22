// src/pages/Profile/ReaderIdentitySection/ViewMode/LanguageCard.tsx
import { Tag } from './Tag';
import { LocaleData } from '../../../../locales';

interface LanguageCardProps {
  profile: any;
  t: LocaleData;
}

export function LanguageCard({ profile, t }: LanguageCardProps) {
  const hasData =
    profile.nativeCountry ||
    profile.currentCountry ||
    profile.nativeLanguage ||
    profile.spokenLanguages?.length ||
    profile.readingLanguages?.length;

  if (!hasData) return null;

  return (
    <div
      style={{
        background: 'rgba(18, 28, 36, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '20px',
      }}
    >
      <h3 style={{ fontSize: '13px', color: '#5B86A1', fontWeight: '500', marginBottom: '16px' }}>
        🌍 Языковой профиль
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {profile.nativeCountry && (
            <div>
              <div style={{ fontSize: '11px', color: '#97A6BA', marginBottom: '4px' }}>
                {t.nativeCountry}
              </div>
              <Tag>{t.taxonomy.countries?.[profile.nativeCountry] || profile.nativeCountry}</Tag>
            </div>
          )}
          {profile.currentCountry && (
            <div>
              <div style={{ fontSize: '11px', color: '#97A6BA', marginBottom: '4px' }}>
                {t.currentCountry}
              </div>
              <Tag>{t.taxonomy.countries?.[profile.currentCountry] || profile.currentCountry}</Tag>
            </div>
          )}
          {profile.nativeLanguage && (
            <div>
              <div style={{ fontSize: '11px', color: '#97A6BA', marginBottom: '4px' }}>
                {t.nativeLanguage}
              </div>
              <Tag>{t.taxonomy.languages?.[profile.nativeLanguage] || profile.nativeLanguage}</Tag>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {profile.spokenLanguages?.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', color: '#97A6BA', marginBottom: '4px' }}>
                {t.spokenLanguages}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {profile.spokenLanguages.map((lang: string) => (
                  <Tag key={lang}>{t.taxonomy.languages?.[lang] || lang}</Tag>
                ))}
              </div>
            </div>
          )}
          {profile.readingLanguages?.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', color: '#97A6BA', marginBottom: '4px' }}>
                {t.readingLanguages}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {profile.readingLanguages.map((lang: string) => (
                  <Tag key={lang}>{t.taxonomy.languages?.[lang] || lang}</Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}