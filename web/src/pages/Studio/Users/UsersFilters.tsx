 // src/pages/Studio/Users/UsersFilters.tsx

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { AdminRole, ALL_ROLES, ROLE_LABELS } from '../../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../../locales';


interface UsersFiltersProps {
  onFilterChange: () => void;
  viewerRole?: AdminRole;
}


export default function UsersFilters({ onFilterChange, viewerRole }: UsersFiltersProps) {
  const t = getLocaleData(getBrowserLocale());
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
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(8px)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      alignItems: 'center',
    }}>

      {/* ПОИСК */}

      <div style={{ flex: 1, minWidth: '200px' }}>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={t.admin.users.searchPlaceholder}
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
          <option value="all">{t.admin.users.allRoles}</option>

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
          <option value="all">{t.admin.users.allStatuses}</option>
          <option value="active">{t.admin.users.activeFilter}</option>
          <option value="blocked">{t.admin.users.blockedFilter}</option>
        </select>
      </div>


      {/* КНОПКА */}

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


      {/* ИНФО */}

      <div style={{
        color: 'var(--primary)',
        fontSize: '13px',
        marginLeft: 'auto',
      }}>
        {
          roleFilter !== 'all' ||
          statusFilter !== 'all' ||
          localSearch
            ? t.admin.common.filtersActive
            : t.admin.users.allUsers
        }
      </div>

    </div>
  );
}