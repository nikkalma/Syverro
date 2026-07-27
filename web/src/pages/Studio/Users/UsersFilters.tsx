 // src/pages/Studio/Users/UsersFilters.tsx

import { useState, useEffect } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { AdminRole, ALL_ROLES, ROLE_LABELS } from '../../../types/admin';


interface UsersFiltersProps {
  onFilterChange: () => void;
  viewerRole?: AdminRole;
}


export default function UsersFilters({ onFilterChange, viewerRole }: UsersFiltersProps) {
  const {
    searchQuery,
    setSearchQuery,
    usersFilters,
    setUsersFilters,
    clearFilters,
  } = useAdminStore();


  const [localSearch, setLocalSearch] = useState(searchQuery);

  const [roleFilter, setRoleFilter] = useState<string>(
    usersFilters.role || 'all'
  );

  const [statusFilter, setStatusFilter] = useState<string>(
    usersFilters.is_active === true
      ? 'active'
      : usersFilters.is_active === false
        ? 'blocked'
        : 'all'
  );


  // ===== ПРИМЕНЕНИЕ ФИЛЬТРОВ =====

  const applyFilters = () => {
    const newFilters = {
      ...(roleFilter !== 'all'
        ? { role: roleFilter as typeof usersFilters.role }
        : {}),

      ...(statusFilter !== 'all'
        ? { is_active: statusFilter === 'active' }
        : {}),
    };


    setUsersFilters(newFilters);

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


  // ===== ПОИСК =====

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        applyFilters();
      }
    }, 400);


    return () => clearTimeout(timer);
  }, [localSearch]);


  // ===== ФИЛЬТРЫ =====

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

      {/* ПОИСК */}

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
        />
      </div>


      {/* РОЛЬ */}

      <div style={{ minWidth: '140px' }}>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">Все роли</option>

          {ALL_ROLES.filter((role) => viewerRole === 'owner' || role !== 'owner').map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>


      {/* СТАТУС */}

      <div style={{ minWidth: '140px' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Все статусы</option>
          <option value="active">🟢 Активные</option>
          <option value="blocked">🔴 Заблокированные</option>
        </select>
      </div>


      {/* КНОПКА */}

      <button onClick={handleClear}>
        ✕ Очистить
      </button>


      {/* ИНФО */}

      <div style={{
        color: '#5B86A1',
        fontSize: '13px',
        marginLeft: 'auto',
      }}>
        {
          roleFilter !== 'all' ||
          statusFilter !== 'all' ||
          localSearch
            ? '🔍 Фильтры активны'
            : '📋 Все пользователи'
        }
      </div>

    </div>
  );
}