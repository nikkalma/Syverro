// src/pages/Admin/Logs/LogsFilters.tsx

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { AdminLogType, LOG_TYPE_LABELS } from '../../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../../locales';

interface LogsFiltersProps {
  onFilterChange: () => void;
}

export default function LogsFilters({ onFilterChange }: LogsFiltersProps) {
  const t = getLocaleData(getBrowserLocale());
  const { searchQuery, setSearchQuery, filters, setFilters, clearFilters } = useAdminStore();
  
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [typeFilter, setTypeFilter] = useState<string>(filters.type || 'all');
  const [dateFrom, setDateFrom] = useState<string>(filters.date_from || '');
  const [dateTo, setDateTo] = useState<string>(filters.date_to || '');

  const logTypes: AdminLogType[] = [
    'user_login', 'user_logout', 'user_register', 'user_role_change',
    'user_block', 'user_unblock', 'user_delete',
    'book_create', 'book_update', 'book_delete', 'book_publish', 'book_hide',
    'author_create', 'author_update', 'author_delete',
    'genre_create', 'genre_update', 'genre_delete',
    'settings_update', 'admin_login', 'admin_logout'
  ];

  const applyFilters = () => {
    const newFilters: Record<string, any> = {};
    if (typeFilter !== 'all') newFilters.type = typeFilter;
    if (dateFrom) newFilters.date_from = dateFrom;
    if (dateTo) newFilters.date_to = dateTo;
    setFilters(newFilters);
    setSearchQuery(localSearch);
    onFilterChange();
  };

  const handleClear = () => {
    setLocalSearch('');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
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
  }, [typeFilter, dateFrom, dateTo]);

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
      {/* ===== ПОИСК ===== */}
      <div style={{ flex: 1, minWidth: '200px' }}>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={t.admin.logs.searchPlaceholder}
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

      {/* ===== ФИЛЬТР ПО ТИПУ ===== */}
      <div style={{ minWidth: '160px' }}>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
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
            cursor: 'pointer',
          }}
        >
          <option value="all">{t.admin.logs.allEvents}</option>
          {logTypes.map((type) => (
            <option key={type} value={type}>
              {LOG_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      {/* ===== ФИЛЬТР ПО ДАТЕ ===== */}
      <div style={{ minWidth: '140px' }}>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
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
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
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

      {/* ===== КНОПКИ ===== */}
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
        {typeFilter !== 'all' || dateFrom || dateTo || localSearch ? t.admin.common.filtersActive : t.admin.logs.allLogs}
      </div>
    </div>
  );
}
