// src/pages/Admin/Logs/LogsTable.tsx

import { AdminLog, LOG_TYPE_LABELS } from '../../../types/admin';
import { useAdminStore } from '../../../store/adminStore';

interface LogsTableProps {
  logs: AdminLog[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  onRefresh: () => void;
}

export default function LogsTable({
  logs,
  loading,
  error,
  total,
  page,
  limit,
  onRefresh,
}: LogsTableProps) {
  const { setPage } = useAdminStore();
  const totalPages = Math.ceil(total / limit);

  // ===== СКЕЛЕТОН =====
  if (loading) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Время', 'Событие', 'Пользователь', 'Метод', 'Endpoint', 'Статус'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {[...Array(6)].map((_, j) => (
                  <td key={j} style={{ padding: '12px 16px' }}>
                    <div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: j === 5 ? '40px' : '80%' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ===== ОШИБКА =====
  if (error) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#EF5350',
        background: 'rgba(18, 28, 36, 0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(239,83,80,0.2)',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
        <p>{error}</p>
        <button
          onClick={onRefresh}
          style={{
            marginTop: '12px',
            padding: '8px 20px',
            background: '#5B86A1',
            border: 'none',
            borderRadius: '8px',
            color: '#0A1118',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Повторить
        </button>
      </div>
    );
  }

  // ===== ПУСТО =====
  if (logs.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#97A6BA',
        background: 'rgba(18, 28, 36, 0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
        <p>Логи не найдены</p>
      </div>
    );
  }

  // ===== ТАБЛИЦА =====
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Время</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Событие</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Пользователь</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Метод</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Endpoint</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Статус</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={{ padding: '12px 16px', color: '#97A6BA', fontSize: '12px', whiteSpace: 'nowrap' }}>
                {new Date(log.created_at).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td style={{ padding: '12px 16px', color: '#E6EDF3', fontSize: '13px' }}>
                {LOG_TYPE_LABELS[log.type as keyof typeof LOG_TYPE_LABELS] || log.type}
              </td>
              <td style={{ padding: '12px 16px', color: '#97A6BA', fontSize: '13px' }}>
                {log.user_email || '—'}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{
                  padding: '2px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: log.method === 'GET' ? 'rgba(76,175,80,0.15)' :
                             log.method === 'POST' ? 'rgba(255,193,7,0.15)' :
                             log.method === 'PUT' ? 'rgba(33,150,243,0.15)' :
                             log.method === 'DELETE' ? 'rgba(239,83,80,0.15)' :
                             'rgba(255,255,255,0.05)',
                  color: log.method === 'GET' ? '#4CAF50' :
                         log.method === 'POST' ? '#FFC107' :
                         log.method === 'PUT' ? '#2196F3' :
                         log.method === 'DELETE' ? '#EF5350' :
                         '#97A6BA',
                }}>
                  {log.method}
                </span>
              </td>
              <td style={{ padding: '12px 16px', color: '#97A6BA', fontSize: '12px' }}>
                {log.endpoint}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{
                  padding: '2px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: log.status_code < 300 ? '#4CAF50' :
                         log.status_code < 400 ? '#FFC107' :
                         '#EF5350',
                  background: log.status_code < 300 ? 'rgba(76,175,80,0.15)' :
                              log.status_code < 400 ? 'rgba(255,193,7,0.15)' :
                              'rgba(239,83,80,0.15)',
                }}>
                  {log.status_code}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== ПАГИНАЦИЯ ===== */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 0',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          marginTop: '8px',
        }}>
          <div style={{ color: '#97A6BA', fontSize: '13px' }}>
            Показано {logs.length} из {total}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              style={{
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                color: page <= 1 ? '#2A4B60' : '#97A6BA',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
              }}
            >
              ←
            </button>
            <span style={{ padding: '6px 14px', color: '#E6EDF3', fontSize: '13px' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              style={{
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                color: page >= totalPages ? '#2A4B60' : '#97A6BA',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
              }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}