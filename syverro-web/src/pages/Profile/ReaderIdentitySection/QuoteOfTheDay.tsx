// src/pages/Profile/ReaderIdentitySection/QuoteOfTheDay.tsx
import { useState } from 'react';
import { storageService } from '../../../services/storageService';
import { LocaleData } from '../../../locales';
import { Edit2, Check, X } from 'lucide-react';

interface QuoteOfTheDayProps {
  profile: any;
  t: LocaleData;
}

const DEFAULT_QUOTE = '«Книги — это корабли мысли, странствующие по волнам времени» — Фрэнсис Бэкон';

export function QuoteOfTheDay({ profile, t }: QuoteOfTheDayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [quote, setQuote] = useState(profile.quoteOfTheDay || DEFAULT_QUOTE);
  const [tempQuote, setTempQuote] = useState(quote);

  const handleSave = () => {
    const trimmed = tempQuote.trim();
    if (trimmed) {
      setQuote(trimmed);
      storageService.updateReaderProfile({ quoteOfTheDay: trimmed });
    } else {
      setTempQuote(quote);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempQuote(quote);
    setIsEditing(false);
  };

  return (
    <div
      style={{
        background: 'var(--surface-alt)',
        borderRadius: '12px',
        border: '1px solid var(--border-soft)',
        padding: '16px 20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Моя цитата
        </div>
        {!isEditing && (
          <button
            onClick={() => {
              setTempQuote(quote);
              setIsEditing(true);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Edit2 size={14} />
          </button>
        )}
      </div>

      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea
            value={tempQuote}
            onChange={(e) => setTempQuote(e.target.value)}
            placeholder="Введите вашу цитату..."
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'var(--input-bg)',
              border: '1px solid var(--border-soft)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              resize: 'vertical',
              outline: 'none',
            }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSave}
              style={{
                padding: '4px 12px',
                background: 'var(--primary)',
                border: 'none',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Check size={14} /> Сохранить
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: '4px 12px',
                background: 'transparent',
                border: '1px solid var(--border-soft)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <X size={14} /> Отмена
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            lineHeight: '1.5',
          }}
        >
          {quote}
        </div>
      )}
    </div>
  );
}