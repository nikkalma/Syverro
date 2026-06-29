// src/pages/Profile/ReaderIdentitySection/index.tsx
import { useState } from 'react';
import { storageService } from '../../../services/storageService';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import { MyReality } from './MyReality';
import { MyRoots } from './MyRoots';
import { QuoteOfTheDay } from './QuoteOfTheDay';
import { Genres } from './Genres';
import { Vibes } from './Vibes';
import { Themes } from './Themes';
import { Motifs } from './Motifs';
import { EditMode } from './EditMode';

export default function ReaderIdentitySection() {
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);
  const [profile, setProfile] = useState(() => storageService.getReaderProfile());
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (data: any) => {
    const updated = storageService.updateReaderProfile(data);
    setProfile(updated);
    setIsEditing(false);
  };

  if (isEditing) {
    return <EditMode profile={profile} t={t} onSave={handleSave} onCancel={() => setIsEditing(false)} />;
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        <MyReality profile={profile} t={t} />
        <MyRoots profile={profile} t={t} />
        <QuoteOfTheDay profile={profile} t={t} />
      </div>

      <div
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '16px',
          }}
        >
          <Genres profile={profile} t={t} />
          <Vibes profile={profile} t={t} />
          <Themes profile={profile} t={t} />
          <Motifs profile={profile} t={t} />
        </div>
      </div>

      <button
        onClick={() => setIsEditing(true)}
        style={{
          padding: '8px 20px',
          background: 'var(--surface-alt)',
          border: '1px solid var(--border-soft)',
          borderRadius: '8px',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          width: 'auto',
          marginBottom: '32px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--card-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--surface-alt)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        ✏️ Редактировать ориентиры
      </button>
    </>
  );
}