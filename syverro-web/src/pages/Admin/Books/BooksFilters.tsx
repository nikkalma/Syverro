// src/pages/Admin/Books/BooksFilters.tsx

import { useState, useEffect } from 'react';
import { useAdminStore } from '../../../store/adminStore';

interface BooksFiltersProps {
  onFilterChange: () => void;
}

export default function BooksFilters({ onFilterChange }: BooksFiltersProps) {
  const { searchQuery, setSearchQuery, filters, setFilters, clearFilters } = useAdminStore();
  
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [statusFilter, setStatusFilter] = useState<string>(filters.is_published || 'all');
  const [genreFilter, setGenreFilter] = useState<string>(filters.genre || '');

  // ===== ПРИМЕНЕНИЕ ФИЛЬТРОВ =====
  const applyFilters = () => {
    const newFilters: Record<string, any> = {};
    
    if (statusFilter !== 'all') newFilters.is_published = statusFilter === 'published';
    if (genreFilter) newFilters.genre = genreFilter;
    
    setFilters(newFilters);
    setSearchQuery(localSearch);
    onFilterChange();
  };

  // ===== СБРОС =====
  const handleClear = () => {
    setLocalSearch('');
    setStatusFilter('all');
    setGenreFilter('');
    clearFilters();
    onFilterChange();
  };

  // ===== ПРИМЕНЯЕМ ФИЛЬТРЫ ПРИ ИЗМЕНЕНИИ =====
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
  }, [statusFilter, genreFilter]);

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
      {/* ===== ПОИСК ===== */}
      <div style={{ flex: 1, minWidth: '200px' }}>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="🔍 Поиск по названию, автору..."
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
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#5B86A1')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
        />
      </div>

      {/* ===== ФИЛЬТР ПО СТАТУСУ ===== */}
      <div style={{ minWidth: '140px' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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
            cursor: 'pointer',
          }}
        >
          <option value="all">Все статусы</option>
          <option value="published">📗 Опубликованные</option>
          <option value="draft">📕 Черновики</option>
        </select>
      </div>

      {/* ===== ФИЛЬТР ПО ЖАНРУ ===== */}
      <div style={{ minWidth: '140px' }}>
        <input
          type="text"
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          placeholder="🏷️ Фильтр по жанру"
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

      {/* ===== КНОПКИ ===== */}
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
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = '#E6EDF3';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.color = '#97A6BA';
        }}
      >
        ✕ Очистить
      </button>

      {/* ===== ИНФО ===== */}
      <div style={{ color: '#5B86A1', fontSize: '13px', marginLeft: 'auto' }}>
        {statusFilter !== 'all' || genreFilter || localSearch ? '🔍 Фильтры активны' : '📋 Все книги'}
      </div>
    </div>
  );
}