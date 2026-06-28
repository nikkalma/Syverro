// src/pages/Admin/Users/UsersTable.tsx

import { AdminUser, AdminRole, ROLE_LABELS, ROLE_COLORS } from '../../../types/admin';
import { useAdminStore } from '../../../store/adminStore';

interface UsersTableProps {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  canManage: boolean;
  canDelete: boolean;
  onRoleChange: (userId: string, role: AdminRole) => void;
  onToggleBlock: (userId: string, isActive: boolean) => void;
  onOpenUser: (user: AdminUser) => void;
  onOpenDelete: (user: AdminUser) => void;
  onLogoutSessions: (userId: string) => void;
  onRefresh: () => void;
}

export default function UsersTable({
  users,
  loading,
  error,
  total,
  page,
  limit,
  canManage,
  canDelete,
  onRoleChange,
  onToggleBlock,
  onOpenUser,
  onOpenDelete,
  onLogoutSessions,
  onRefresh,
}: UsersTableProps) {
  const { setPage, setLimit } = useAdminStore();
  const totalPages = Math.ceil(total / limit);

  // ===== СКЕЛЕТОН =====
  if (loading) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Пользователь', 'Email', 'Роль', 'Статус', 'Дата регистрации', 'Действия'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {[...Array(6)].map((_, j) => (
                  <td key={j} style={{ padding: '12px 16px' }}>
                    <div style={{ height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: j === 0 ? '60%' : '80%' }} />
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
  if (users.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#97A6BA',
        background: 'rgba(18, 28, 36, 0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
        <p>Пользователи не найдены</p>
      </div>
    );
  }

  // ===== ТАБЛИЦА =====
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Пользователь</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Email</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Роль</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Статус</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Дата регистрации</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#97A6BA', fontSize: '12px', fontWeight: '500' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'background 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              onClick={() => onOpenUser(user)}
            >
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#5B86A1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0A1118',
                    fontSize: '13px',
                    fontWeight: '600',
                    flexShrink: 0,
                  }}>
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div style={{ color: '#E6EDF3', fontSize: '14px' }}>
                      {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '—'}
                    </div>
                    <div style={{ color: '#5B86A1', fontSize: '11px' }}>{user.username || '—'}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '12px 16px', color: '#97A6BA', fontSize: '13px' }}>{user.email}</td>
              <td style={{ padding: '12px 16px' }}>
                {canManage ? (
                  <select
                    value={user.role}
                    onChange={(e) => {
                      e.stopPropagation();
                      onRoleChange(user.id, e.target.value as AdminRole);
                    }}
                    style={{
                      padding: '4px 8px',
                      background: 'rgba(18, 28, 36, 0.6)',
                      border: `1px solid ${ROLE_COLORS[user.role] || '#2A4B60'}`,
                      borderRadius: '6px',
                      color: ROLE_COLORS[user.role] || '#E6EDF3',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      outline: 'none',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                      <option key={key} value={key} style={{ background: '#121C24', color: '#E6EDF3' }}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: ROLE_COLORS[user.role] || '#97A6BA',
                    background: 'rgba(255,255,255,0.05)',
                  }}>
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                )}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: user.is_active ? '#4CAF50' : '#EF5350',
                  background: user.is_active ? 'rgba(76,175,80,0.1)' : 'rgba(239,83,80,0.1)',
                  border: `1px solid ${user.is_active ? 'rgba(76,175,80,0.2)' : 'rgba(239,83,80,0.2)'}`,
                }}>
                  {user.is_active ? '🟢 Активен' : '🔴 Заблокирован'}
                </span>
              </td>
              <td style={{ padding: '12px 16px', color: '#5B86A1', fontSize: '13px' }}>
                {new Date(user.created_at).toLocaleDateString('ru-RU')}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {canManage && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBlock(user.id, user.is_active);
                        }}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          color: user.is_active ? '#FFA726' : '#4CAF50',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      >
                        {user.is_active ? '🔒 Блок' : '🔓 Разблок'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLogoutSessions(user.id);
                        }}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          color: '#5B86A1',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        🔄 Сессии
                      </button>
                    </>
                  )}
                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDelete(user);
                      }}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(239,83,80,0.1)',
                        border: '1px solid rgba(239,83,80,0.2)',
                        borderRadius: '6px',
                        color: '#EF5350',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
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
            Показано {users.length} из {total}
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