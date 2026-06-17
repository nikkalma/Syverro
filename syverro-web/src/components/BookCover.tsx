// src/components/BookCover.tsx

import { useState } from 'react';

interface BookCoverProps {
  coverUrl: string | null;
  title: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function BookCover({ 
  coverUrl, 
  title, 
  width = 120, 
  height = 168,
  className = ''
}: BookCoverProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  if (coverUrl && !imageError && (coverUrl.startsWith('http') || coverUrl.startsWith('data:'))) {
    return (
      <div 
        className={`relative ${className}`} 
        style={{ width, height }}
      >
        {imageLoading && (
          <div 
            className="absolute inset-0 bg-[#121C24] rounded-lg flex items-center justify-center"
            style={{ width, height }}
          >
            <div className="w-6 h-6 border-2 border-[#5B86A1] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={coverUrl}
          alt={title}
          className="w-full h-full object-cover rounded-lg"
          style={{ opacity: imageLoading ? 0 : 1 }}
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
  const fontSize = Math.min(width / 6, 14);

  return (
    <div
      className="bg-[#121C24] rounded-lg flex items-center justify-center border border-[#2A4B60]"
      style={{ width, height }}
    >
      <div className="text-center px-2">
        <div 
          className="text-[#E6EDF3] font-medium text-center line-clamp-4"
          style={{ fontSize: `${fontSize}px`, lineHeight: `${fontSize + 4}px` }}
        >
          {title || 'ТЕСТ'}
        </div>
      </div>
    </div>
  );
}