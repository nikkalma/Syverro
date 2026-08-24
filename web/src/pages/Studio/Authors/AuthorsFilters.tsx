// src/pages/Admin/Authors/AuthorsFilters.tsx

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import { AUTHOR_METADATA_STATUSES, formatMetadataStatus } from './authorEditorialStatus';

interface AuthorsFiltersProps {
  onFilterChange: () => void;
}

export default function AuthorsFilters({ onFilterChange }: AuthorsFiltersProps) {
  const t = getLocaleData(getBrowserLocale());
  const { searchQuery, setSearchQuery, filters, setFilters, clearFilters } = useAdminStore();
  
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [countryFilter, setCountryFilter] = useState<string>(filters.country || '');
  const [metadataStatus, setMetadataStatus] = useState<string>(filters.metadata_status || '');

  const applyFilters = () => {
    const newFilters: Record<string, any> = {};
    if (countryFilter) newFilters.country = countryFilter;
    if (metadataStatus) newFilters.metadata_status = metadataStatus;
    setFilters(newFilters);
    setSearchQuery(localSearch);
    onFilterChange();
  };

  const handleClear = () => {
    setLocalSearch('');
    setCountryFilter('');
    setMetadataStatus('');
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

  useEffect(() => {
    applyFilters();
  }, [countryFilter, metadataStatus]);

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
          placeholder={t.admin.authors.searchPlaceholder}
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

      <div style={{ minWidth: '140px' }}>
        <input
          type="text"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          placeholder={t.admin.authors.countryFilterPlaceholder}
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

      <select value={metadataStatus} onChange={(e) => setMetadataStatus(e.target.value)} style={{
        minWidth: '180px', padding: '8px 14px', background: 'var(--chip)', border: '1px solid var(--border)',
        borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none',
      }}>
        <option value="">{t.admin.authors.allMetadataStatuses}</option>
        {AUTHOR_METADATA_STATUSES.map((status) => <option key={status} value={status}>{formatMetadataStatus(status)}</option>)}
      </select>

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
        {countryFilter || localSearch || metadataStatus ? t.admin.common.filtersActive : t.admin.authors.allAuthors}
      </div>
    </div>
  );
}
