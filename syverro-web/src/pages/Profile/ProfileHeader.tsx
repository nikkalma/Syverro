// src/pages/Profile/ProfileHeader.tsx
import { useState, useRef } from 'react';
import { EnrichedBook } from '../../types/book';
import { storageService } from '../../services/storageService';
import { readingGoalLabels, ReadingGoal } from '../../types/reader';

interface ProfileHeaderProps {
  books: EnrichedBook[];
}

export default function ProfileHeader({ books }: ProfileHeaderProps) {
  const profile = storageService.getReaderProfile();
  const [displayName, setDisplayName] = useState(profile.displayName || 'Читатель');
  const [avatar, setAvatar] = useState(profile.avatar || null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(displayName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Книги в личной библиотеке
  const libraryBooks = books.filter((b) => b.personal !== null);
  const totalBooks = libraryBooks.length;

  // Статус и уровень (пока хардкод, потом из профиля)
  const status = 'Reading beyond borders.';
  const level = 'Celestial Explorer';

  // Цели чтения из профиля
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
        alignItems: 'flex-start',
        gap: '24px',
        padding: '24px',
        background: 'rgba(18, 28, 36, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '32px',
      }}
    >
      {/* Аватар */}
      <div
        style={{
          position: 'relative',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          flexShrink: 0,
          cursor: 'pointer',
          overflow: 'hidden',
          background: 'rgba(91, 134, 161, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
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
              fontSize: '32px',
              color: '#5B86A1',
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
            color: '#E6EDF3',
            fontSize: '11px',
            fontWeight: '400',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
        >
          Сменить
        </div>
      </div>

      {/* Информация */}
      <div style={{ flex: 1 }}>
        {/* Имя */}
        {isEditingName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={handleNameKeyDown}
              onBlur={handleNameSave}
              autoFocus
              style={{
                padding: '4px 8px',
                background: 'rgba(18, 28, 36, 0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(91, 134, 161, 0.3)',
                borderRadius: '6px',
                color: '#E6EDF3',
                fontSize: '24px',
                fontWeight: '500',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                marginBottom: 0,
                width: 'auto',
                minWidth: '120px',
              }}
            />
            <button
              onClick={handleNameSave}
              style={{
                padding: '4px 12px',
                background: '#5B86A1',
                border: 'none',
                borderRadius: '6px',
                color: '#0A1118',
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
              fontSize: '24px',
              fontWeight: '500',
              color: '#E6EDF3',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onClick={() => {
              setTempName(displayName);
              setIsEditingName(true);
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#5B86A1')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#E6EDF3')}
          >
            {displayName}
          </div>
        )}

        {/* Статус и уровень */}
        <div
          style={{
            fontSize: '14px',
            color: '#97A6BA',
            marginTop: '2px',
          }}
        >
          {status}
        </div>
        <div
          style={{
            fontSize: '13px',
            color: '#5B86A1',
            marginBottom: '8px',
          }}
        >
          Level: {level}
        </div>

        {/* Цели чтения (теги) */}
        {readingGoals.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {readingGoals.map((goal) => (
              <span
                key={goal}
                style={{
                  fontSize: '12px',
                  padding: '2px 12px',
                  background: 'rgba(91, 134, 161, 0.15)',
                  borderRadius: '12px',
                  color: '#5B86A1',
                  border: '1px solid rgba(91, 134, 161, 0.15)',
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