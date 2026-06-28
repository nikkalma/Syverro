// src/pages/Admin/Genres/GenresFilters.tsx

import { useState, useEffect } from 'react';
import { useAdminStore } from '../../../store/adminStore';

interface GenresFiltersProps {
  onFilterChange: () => void;
}

export default function GenresFilters({ onFilterChange }: GenresFiltersProps) {
  const { searchQuery, setSearchQuery, filters, setFilters, clearFilters } = useAdminStore();
  
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const applyFilters = () => {
    setFilters({});
    setSearchQuery(localSearch);
    onFilterChange();
  };

  const handleClear = () => {
    setLocalSearch('');
    clearFilters();
    onFilterChange();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        applyFilters();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch]);

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      padding: '16px',
      background: 'rgba(18, 28, 36, 0.4)',
      backdropFilter: 'blur(8px)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
      alignItems: 'center',
    }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="🔍 Поиск по названию..."
          style={{
            width: '100%',
            padding: '8px 14px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            color: '#E6EDF3',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
          }}
        />
      </div>

      <button
        onClick={handleClear}
        style={{
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          color: '#97A6BA',
          fontSize: '13px',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        ✕ Очистить
      </button>

      <div style={{ color: '#5B86A1', fontSize: '13px', marginLeft: 'auto' }}>
        {localSearch ? '🔍 Фильтры активны' : '🏷️ Все жанры'}
      </div>
    </div>
  );
}