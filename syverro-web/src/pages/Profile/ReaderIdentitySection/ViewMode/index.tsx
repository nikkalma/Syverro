// src/pages/Profile/ReaderIdentitySection/ViewMode/index.tsx
import { LanguageCard } from './LanguageCard';
import { LiteraryCard } from './LiteraryCard';
import { IntentionsCard } from './IntentionsCard';
import { LocaleData } from '../../../../locales';

interface ViewModeProps {
  profile: any;
  t: LocaleData;
  onEdit: () => void;
}

export function ViewMode({ profile, t, onEdit }: ViewModeProps) {
  const isEmpty = Object.keys(profile).length === 0;

  if (isEmpty) {
    return (
      <div
        style={{
          background: '#121C24',
          borderRadius: '16px',
          border: '1px solid #2A4B60',
          padding: '24px',
          marginBottom: '32px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#5B86A1', fontSize: '14px' }}>
          Расскажите о своих литературных предпочтениях
        </p>
        <button
          onClick={onEdit}
          style={{
            marginTop: '12px',
            padding: '8px 20px',
            background: '#5B86A1',
            border: 'none',
            borderRadius: '8px',
            color: '#0A1118',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            width: 'auto',
          }}
        >
          Заполнить
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
      <LanguageCard profile={profile} t={t} onEdit={onEdit} />
      <LiteraryCard profile={profile} t={t} onEdit={onEdit} />
      <IntentionsCard profile={profile} t={t} onEdit={onEdit} />
    </div>
  );
}