// src/components/BookCover.web.tsx
import React, { useState } from 'react';


interface BookCoverProps {
  coverUrl: string | null;
  title: string;
  width: number;
  height: number;
  style?: React.CSSProperties;
  opacity?: number;
}

export default function BookCover({ 
  coverUrl, 
  title, 
  width, 
  height, 
  style, 
  opacity = 1 
}: BookCoverProps) {
  const { theme, mode } = useTheme();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Если есть URL и нет ошибки
  if (coverUrl && !imageError && (coverUrl.startsWith('http') || coverUrl.startsWith('file://'))) {
    return (
      <div style={{ position: 'relative', width, height, ...style }}>
        {/* Спиннер во время загрузки */}
        {imageLoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: theme.surface,
              zIndex: 1,
            }}
          >
            <div className="spinner" style={{ borderColor: theme.primary, borderTopColor: 'transparent' }} />
          </div>
        )}
        <img
          src={coverUrl}
          alt={title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 8,
            opacity: imageLoading ? 0 : opacity,
            transition: 'opacity 0.2s',
          }}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
        />
      </div>
    );
  }

  // Плейсхолдер (если нет обложки или ошибка)
  const isDarkMode = mode === 'dark';
  const fontSize = Math.min(width / 6, 14);

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: isDarkMode ? theme.primary + '40' : theme.surface,
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        border: isDarkMode ? 'none' : `1px solid ${theme.border}`,
        ...style,
      }}
    >
      <div style={{ width: width - 16, textAlign: 'center' }}>
        <span
          style={{
            color: isDarkMode ? '#FFFFFF' : theme.textPrimary,
            fontSize,
            fontWeight: '500',
            lineHeight: `${fontSize + 4}px`,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title || '?'}
        </span>
      </div>
    </div>
  );
}