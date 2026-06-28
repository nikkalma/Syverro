// src/pages/Admin/Dashboard/RecentUsers.tsx

import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  role: string;
}

interface RecentUsersProps {
  users: User[];
}

export default function RecentUsers({ users }: RecentUsersProps) {
  const navigate = useNavigate();

  if (!users || users.length === 0) {
    return (
      <div style={{
        padding: '20px',
        background: 'rgba(18, 28, 36, 0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <h3 style={{ fontSize: '14px', color: '#97A6BA', marginBottom: '12px' }}>📋 Последние регистрации</h3>
        <p style={{ color: '#5B86A1', fontSize: '13px' }}>Нет новых пользователей</p>
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
      <h3 style={{ fontSize: '14px', color: '#97A6BA', marginBottom: '12px' }}>📋 Последние регистрации</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {users.slice(0, 5).map((user) => (
          <div
            key={user.id}
            onClick={() => navigate(`/admin/users/${user.id}`)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
          >
            <div>
              <div style={{ color: '#E6EDF3', fontSize: '14px' }}>
                {user.first_name || user.email}
              </div>
              <div style={{ color: '#97A6BA', fontSize: '12px' }}>{user.email}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '11px',
                padding: '2px 10px',
                borderRadius: '12px',
                background: 'rgba(91, 134, 161, 0.15)',
                color: '#5B86A1',
              }}>
                {user.role || 'user'}
              </div>
              <div style={{ color: '#5B86A1', fontSize: '11px', marginTop: '4px' }}>
                {new Date(user.created_at).toLocaleDateString('ru-RU')}
              </div>
            </div>
          </div>
        ))}
      </div>
      {users.length > 5 && (
        <button
          onClick={() => navigate('/admin/users')}
          style={{
            marginTop: '12px',
            background: 'none',
            border: 'none',
            color: '#5B86A1',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            width: '100%',
            textAlign: 'center',
          }}
        >
          Показать всех →
        </button>
      )}
    </div>
  );
}