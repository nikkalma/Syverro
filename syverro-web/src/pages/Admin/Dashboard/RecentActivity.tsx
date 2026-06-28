// src/pages/Admin/Dashboard/RecentActivity.tsx

import { LOG_TYPE_LABELS } from '../../../types/admin';

interface Log {
  id: string;
  type: string;
  user_email?: string;
  endpoint: string;
  created_at: string;
}

interface RecentActivityProps {
  logs: Log[];
}

export default function RecentActivity({ logs }: RecentActivityProps) {
  if (!logs || logs.length === 0) {
    return (
      <div style={{
        padding: '20px',
        background: 'rgba(18, 28, 36, 0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <h3 style={{ fontSize: '14px', color: '#97A6BA', marginBottom: '12px' }}>🔄 Последние действия</h3>
        <p style={{ color: '#5B86A1', fontSize: '13px' }}>Нет действий</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      background: 'rgba(18, 28, 36, 0.6)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <h3 style={{ fontSize: '14px', color: '#97A6BA', marginBottom: '12px' }}>🔄 Последние действия</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {logs.slice(0, 10).map((log) => (
          <div
            key={log.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
              <span style={{ color: '#97A6BA', whiteSpace: 'nowrap' }}>
                {LOG_TYPE_LABELS[log.type as keyof typeof LOG_TYPE_LABELS] || log.type}
              </span>
              {log.user_email && (
                <span style={{ color: '#5B86A1', fontSize: '12px' }}>— {log.user_email}</span>
              )}
            </div>
            <span style={{ color: '#5B86A1', fontSize: '11px', whiteSpace: 'nowrap' }}>
              {new Date(log.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}