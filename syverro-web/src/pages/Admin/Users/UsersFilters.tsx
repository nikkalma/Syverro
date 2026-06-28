// src/pages/Admin/Users/UsersFilters.tsx

import { useState, useEffect } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { AdminRole, ALL_ROLES, ROLE_LABELS } from '../../../types/admin';

interface UsersFiltersProps {
  onFilterChange: () => void;
}

export default function UsersFilters({ onFilterChange }: UsersFiltersProps) {
  const { searchQuery, setSearchQuery, filters, setFilters, clearFilters } = useAdminStore();
  
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [roleFilter, setRoleFilter] = useState<string>(filters.role || 'all');
  const [statusFilter, setStatusFilter] = useState<string>(filters.is_active || 'all');

  // ===== ПРИМЕНЕНИЕ ФИЛЬТРОВ =====
  const applyFilters = () => {
    const newFilters: Record<string, any> = {};
    
    if (roleFilter !== 'all') newFilters.role = roleFilter;
    if (statusFilter !== 'all') newFilters.is_active = statusFilter === 'active';
    
    setFilters(newFilters);
    setSearchQuery(localSearch);
    onFilterChange();
  };

  // ===== СБРОС =====
  const handleClear = () => {
    setLocalSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
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
  }, [roleFilter, statusFilter]);

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
          placeholder="🔍 Поиск по email, имени..."
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

      {/* ===== ФИЛЬТР ПО РОЛИ ===== */}
      <div style={{ minWidth: '140px' }}>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
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
          <option value="all">Все роли</option>
          {ALL_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
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
          <option value="active">🟢 Активные</option>
          <option value="blocked">🔴 Заблокированные</option>
        </select>
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
        {roleFilter !== 'all' || statusFilter !== 'all' || localSearch ? '🔍 Фильтры активны' : '📋 Все пользователи'}
      </div>
    </div>
  );
}