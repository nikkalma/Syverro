// src/pages/Admin/Logs/index.tsx

import { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { AdminLog, AdminLogFilters, LOG_TYPE_LABELS } from '../../../types/admin';
import LogsTable from './LogsTable';
import LogsFilters from './LogsFilters';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminLogs() {
  const { searchQuery, filters, page, limit, setLoading, isLoading, error, setError, clearError } = useAdminStore();
  
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [total, setTotal] = useState(0);

  const token = localStorage.getItem('token');

  // ===== ЗАГРУЗКА ЛОГОВ =====
  const fetchLogs = async () => {
    setLoading(true);
    clearError();

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(searchQuery && { search: searchQuery }),
        ...filters,
      });

      const response = await fetch(`${API_URL}/admin/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Ошибка загрузки логов');
      }

      const data = await response.json();
      setLogs(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
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
        <h1 style={{ fontSize: '24px', fontWeight: '400', color: '#E6EDF3', margin: 0 }}>
          📋 Логи
          <span style={{ fontSize: '14px', color: '#97A6BA', marginLeft: '12px' }}>
            {total} записей
          </span>
        </h1>
        <button
          onClick={fetchLogs}
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
          🔄 Обновить
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