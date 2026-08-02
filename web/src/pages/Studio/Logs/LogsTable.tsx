// src/pages/Admin/Logs/LogsTable.tsx

import { ChevronLeft, ChevronRight, AlertCircle, ScrollText } from 'lucide-react';
import { AdminLog, LOG_TYPE_LABELS } from '../../../types/admin';
import { useAdminStore } from '../../../store/adminStore';
import { getLocaleData, getBrowserLocale } from '../../../locales';

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
  const t = getLocaleData(getBrowserLocale());
  const { setPage } = useAdminStore();
  const totalPages = Math.ceil(total / limit);

  // ===== СКЕЛЕТОН =====
  if (loading) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="studio-table">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
              {[t.admin.logs.time, t.admin.logs.event, t.admin.logs.user, t.admin.logs.method, t.admin.logs.endpoint, t.admin.logs.status].map((h) => (
                <th key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                {[...Array(6)].map((_, j) => (
                  <td key={j}>
                    <div style={{ height: '16px', background: 'var(--chip)', borderRadius: '4px', width: j === 5 ? '40px' : '80%' }} />
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
        color: 'var(--error)',
        background: 'var(--glass-bg)',
        borderRadius: '12px',
        border: '1px solid var(--error)',
      }}>
        <div style={{ display: 'inline-flex', color: 'var(--error)', marginBottom: '12px' }}><AlertCircle size={32} /></div>
        <p>{error}</p>
        <button
          onClick={onRefresh}
          style={{
            marginTop: '12px',
            padding: '8px 20px',
            background: 'var(--primary)',
            border: 'none',
            borderRadius: '8px',
            color: '#FFFFFF',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {t.admin.common.retry}
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
        color: 'var(--text-secondary)',
        background: 'var(--glass-bg)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'inline-flex', color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.5 }}><ScrollText size={48} /></div>
        <p>{t.admin.logs.noLogs}</p>
      </div>
    );
  }

  // ===== ТАБЛИЦА =====
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="studio-table">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <th>{t.admin.logs.time}</th>
            <th>{t.admin.logs.event}</th>
            <th>{t.admin.logs.user}</th>
            <th>{t.admin.logs.method}</th>
            <th>{t.admin.logs.endpoint}</th>
            <th>{t.admin.logs.status}</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              style={{
                borderBottom: '1px solid var(--border-soft)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                {new Date(log.created_at).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontSize: '13px' }}>
                {LOG_TYPE_LABELS[log.type as keyof typeof LOG_TYPE_LABELS] || log.type}
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {log.user_email || '—'}
              </td>
              <td>
                <span style={{
                  padding: '2px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: log.method === 'GET' ? 'var(--chip)' :
                             log.method === 'POST' ? 'var(--chip)' :
                             log.method === 'PUT' ? 'rgba(33,150,243,0.15)' :
                             log.method === 'DELETE' ? 'var(--chip)' :
                             'var(--chip)',
                  color: log.method === 'GET' ? 'var(--success)' :
                         log.method === 'POST' ? 'var(--warning)' :
                         log.method === 'PUT' ? '#2196F3' :
                         log.method === 'DELETE' ? 'var(--error)' :
                         'var(--text-secondary)',
                }}>
                  {log.method}
                </span>
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                {log.endpoint}
              </td>
              <td>
                <span style={{
                  padding: '2px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: log.status_code < 300 ? 'var(--success)' :
                         log.status_code < 400 ? 'var(--warning)' :
                         'var(--error)',
                  background: log.status_code < 300 ? 'var(--chip)' :
                              log.status_code < 400 ? 'var(--chip)' :
                              'var(--chip)',
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
          borderTop: '1px solid var(--border)',
          marginTop: '8px',
        }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {t.admin.common.showing} {logs.length} {t.admin.common.of} {total}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              style={{
                padding: '6px 14px',
                background: 'var(--chip)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: page <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ padding: '6px 14px', color: 'var(--text-primary)', fontSize: '13px' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              style={{
                padding: '6px 14px',
                background: 'var(--chip)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
