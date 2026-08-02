// src/pages/Admin/Logs/index.tsx

import { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { AdminLog } from '../../../types/admin';
import LogsTable from './LogsTable';
import LogsFilters from './LogsFilters';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import { apiClient } from '../../../shared/api/client';

export default function AdminLogs() {
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);
  const { searchQuery, filters, page, limit, setLoading, isLoading, error, setError, clearError } = useAdminStore();
  
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [total, setTotal] = useState(0);

  // ===== ЗАГРУЗКА ЛОГОВ =====
  const fetchLogs = async () => {
    setLoading(true);
    clearError();

    try {
      const params = {
        page: String(page),
        limit: String(limit),
        ...(searchQuery && { search: searchQuery }),
        ...filters,
      };

      const response = await apiClient.get('/admin/logs', { params });
      setLogs(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || t.admin.logs.errorLoad);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, searchQuery, filters]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '400', color: 'var(--text-primary)', margin: 0 }}>
          {t.admin.logs.title}
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '12px' }}>
            {total} {t.admin.common.records}
          </span>
        </h1>
        <button
          onClick={fetchLogs}
          style={{
            padding: '8px 16px',
            background: 'var(--chip)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {t.admin.common.refresh}
        </button>
      </div>

      <LogsFilters onFilterChange={fetchLogs} />

      <LogsTable
        logs={logs}
        loading={isLoading}
        error={error}
        total={total}
        page={page}
        limit={limit}
        onRefresh={fetchLogs}
      />
    </div>
  );
}
