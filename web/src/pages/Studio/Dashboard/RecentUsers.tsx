// src/pages/Studio/Dashboard/RecentUsers.tsx

import { useNavigate } from 'react-router-dom';
import { getLocaleData, getBrowserLocale } from '../../../locales';

interface User {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  role?: string;
  visible_role?: string;
}

interface RecentUsersProps {
  users: User[];
}

export default function RecentUsers({ users }: RecentUsersProps) {
  const navigate = useNavigate();
  const t = getLocaleData(getBrowserLocale());

  if (!users || users.length === 0) {
    return (
      <div style={{
        padding: '20px',
        background: 'var(--surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-soft)',
      }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{t.admin.authors.editor.newUsers}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t.admin.authors.editor.noNewUsers}</p>
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
      <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{t.admin.authors.editor.newUsers}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {users.slice(0, 5).map((user) => (
          <div
            key={user.id}
            onClick={() => navigate('/studio/users')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              background: 'var(--surface-hover)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border-soft)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
          >
            <div>
              <div style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                {user.first_name || user.email || '—'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{user.email || '—'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '11px',
                padding: '2px 10px',
                borderRadius: '12px',
                background: 'var(--primary-soft)',
                color: 'var(--primary)',
              }}>
                {user.visible_role || user.role || t.admin.settings.roleUser}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
      {users.length > 5 && (
        <button
          onClick={() => navigate('/studio/users')}
          style={{
            marginTop: '12px',
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            width: '100%',
            textAlign: 'center',
          }}
        >
          {t.admin.authors.editor.viewAll}
        </button>
      )}
    </div>
  );
}
