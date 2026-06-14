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

  const containerStyle: React.CSSProperties = {
    width,
    height,
    position: 'relative',
    ...style,
  };

  if (coverUrl && !imageError && (coverUrl.startsWith('http') || coverUrl.startsWith('file://'))) {
    return (
      <div style={containerStyle}>
        {imageLoading && (
          <div
            style={{
              position: 'absolute',
              width,
              height,
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: theme.surface,
            }}
          >
            <div className="spinner" style={{ borderColor: theme.primary }} />
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
            opacity,
          }}
          onLoadStart={() => setImageLoading(true)}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
        />
      </div>
    );
  }

  // Плейсхолдер
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