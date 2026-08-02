// src/pages/Admin/Genres/GenresFilters.tsx

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { getLocaleData, getBrowserLocale } from '../../../locales';

interface GenresFiltersProps {
  onFilterChange: () => void;
}

export default function GenresFilters({ onFilterChange }: GenresFiltersProps) {
const t = getLocaleData(getBrowserLocale());
const { searchQuery, setSearchQuery, setFilters, clearFilters } = useAdminStore();  
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
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(8px)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      alignItems: 'center',
    }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={t.admin.genres.searchPlaceholder}
          style={{
            width: '100%',
            padding: '8px 14px',
            background: 'var(--chip)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
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
          background: 'var(--chip)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <> <X size={12} /> {t.admin.common.clear} </>
      </button>

      <div style={{ color: 'var(--primary)', fontSize: '13px', marginLeft: 'auto' }}>
        {localSearch ? t.admin.common.filtersActive : t.admin.genres.allGenres}
      </div>
    </div>
  );
}
