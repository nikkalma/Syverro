// src/pages/Profile/ProfileHeader.tsx
import { useState, useRef } from 'react';
import { storageService } from '../../services/storageService';
import { readingGoalLabels, ReadingGoal } from '../../types/reader';

interface ProfileHeaderProps {
  books: any[];
}

export default function ProfileHeader({ books }: ProfileHeaderProps) {
  const profile = storageService.getReaderProfile();
  const [displayName, setDisplayName] = useState(profile.displayName || 'Читатель');
  const [avatar, setAvatar] = useState(profile.avatar || null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(displayName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status = profile.status || 'Пришла читать';
  const level = profile.level || 'Демиург Сиверро';
  const readingGoals = profile.readingGoals || [];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatar(base64);
      storageService.updateReaderProfile({ avatar: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleNameSave = () => {
    const newName = tempName.trim() || 'Читатель';
    setDisplayName(newName);
    storageService.updateReaderProfile({ displayName: newName });
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNameSave();
    if (e.key === 'Escape') {
      setTempName(displayName);
      setIsEditingName(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 24px',
        marginBottom: '32px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          flexShrink: 0,
          cursor: 'pointer',
          overflow: 'hidden',
          background: 'var(--surface-alt)',
          border: '2px solid var(--border-soft)',
          marginBottom: '16px',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        {avatar ? (
          <img src={avatar} alt="Аватар" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              color: 'var(--text-muted)',
            }}
          >
            👤
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.2s',
            color: 'var(--text-primary)',
            fontSize: '11px',
            fontWeight: '400',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
        >
          Сменить
        </div>
      </div>

      <div style={{ width: '100%' }}>
        {isEditingName ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={handleNameKeyDown}
              onBlur={handleNameSave}
              autoFocus
              style={{
                padding: '4px 8px',
                background: 'var(--surface-alt)',
                border: '1px solid var(--primary)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '28px',
                fontWeight: '500',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                marginBottom: 0,
                width: 'auto',
                minWidth: '120px',
                textAlign: 'center',
              }}
            />
            <button
              onClick={handleNameSave}
              style={{
                padding: '4px 12px',
                background: 'var(--primary)',
                border: 'none',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                width: 'auto',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              ✓
            </button>
          </div>
        ) : (
          <div
            style={{
              fontSize: '28px',
              fontWeight: '500',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onClick={() => {
              setTempName(displayName);
              setIsEditingName(true);
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          >
            {displayName}
          </div>
        )}

        <div
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginTop: '4px',
          }}
        >
          Статус: {status}
        </div>

        <div
          style={{
            fontSize: '13px',
            color: 'var(--primary)',
            marginBottom: '12px',
          }}
        >
          Уровень: {level}
        </div>

        {readingGoals.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
            {readingGoals.map((goal) => (
              <span
                key={goal}
                style={{
                  fontSize: '12px',
                  padding: '2px 12px',
                  background: 'var(--chip)',
                  borderRadius: '12px',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-soft)',
                }}
              >
                {readingGoalLabels[goal as ReadingGoal] || goal}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}