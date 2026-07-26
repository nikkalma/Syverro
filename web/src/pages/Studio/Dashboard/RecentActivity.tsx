// src/pages/Studio/Dashboard/RecentActivity.tsx

import { getLocaleData, getBrowserLocale } from '../../../locales';
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
  const t = getLocaleData(getBrowserLocale());
  if (!logs || logs.length === 0) {
    return (
      <div style={{
        padding: '20px',
        background: 'var(--surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-soft)',
      }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{t.admin.authors.editor.recentActivity}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t.admin.authors.editor.noRecentActivity}</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      background: 'var(--surface)',
      borderRadius: '12px',
      border: '1px solid var(--border-soft)',
    }}>
      <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{t.admin.authors.editor.recentActivity}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {logs.slice(0, 10).map((log) => (
          <div
            key={log.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: 'var(--surface-hover)',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
              <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {LOG_TYPE_LABELS[log.type as keyof typeof LOG_TYPE_LABELS] || log.type}
              </span>
              {log.user_email && (
                <span style={{ color: 'var(--primary)', fontSize: '12px' }}>— {log.user_email}</span>
              )}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', whiteSpace: 'nowrap' }}>
              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
