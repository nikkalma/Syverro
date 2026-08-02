// src/pages/Studio/Users/UsersTable.tsx

import { RefreshCw, Trash2, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminUser, AdminRole, ROLE_LABELS, ROLE_COLORS, getDisplayRole } from '../../../types/admin';
import { useAdminStore } from '../../../store/adminStore';
import { getLocaleData, getBrowserLocale } from '../../../locales';

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
  const t = getLocaleData(getBrowserLocale());
  const { setPage } = useAdminStore();
  const totalPages = Math.ceil(total / limit);

  // ===== СКЕЛЕТОН =====
  if (loading) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="studio-table">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[t.admin.users.user, t.admin.users.email, t.admin.users.role, t.admin.users.status, t.admin.users.registered, t.admin.users.actions].map((h) => (
                <th key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                {[...Array(6)].map((_, j) => (
                  <td key={j}>
                    <div style={{ height: '20px', background: 'var(--chip)', borderRadius: '4px', width: j === 0 ? '60%' : '80%' }} />
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
  if (users.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        background: 'var(--glass-bg)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'inline-flex', color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.5 }}><Search size={48} /></div>
        <p>{t.admin.users.noUsers}</p>
      </div>
    );
  }

  // ===== ТАБЛИЦА =====
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="studio-table">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th>{t.admin.users.user}</th>
            <th>{t.admin.users.email}</th>
            <th>{t.admin.users.role}</th>
            <th>{t.admin.users.status}</th>
            <th>{t.admin.users.registered}</th>
            <th>{t.admin.users.actions}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              style={{
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              onClick={() => onOpenUser(user)}
            >
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: '600',
                    flexShrink: 0,
                  }}>
                    {(user.first_name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                      {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '—'}
                    </div>
                    <div style={{ color: 'var(--primary)', fontSize: '11px' }}>{user.username || '—'}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>{user.email || '—'}</td>
              <td>
                {(canManage && user.role) ? (
                  <select
                    value={user.role}
                    onChange={(e) => {
                      e.stopPropagation();
                      onRoleChange(user.id, e.target.value as AdminRole);
                    }}
                    style={{
                      padding: '4px 8px',
                      background: 'var(--glass-bg)',
                      border: `1px solid ${ROLE_COLORS[getDisplayRole(user)] || 'var(--text-muted)'}`,
                      borderRadius: '6px',
                      color: ROLE_COLORS[getDisplayRole(user)] || 'var(--text-primary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      outline: 'none',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                      <option key={key} value={key} style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: ROLE_COLORS[getDisplayRole(user)] || 'var(--primary)',
                    background: 'var(--primary-soft)',
                  }}>
                    {ROLE_LABELS[getDisplayRole(user)] || getDisplayRole(user)}
                  </span>
                )}
              </td>
              <td>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: user.is_active ? 'var(--success)' : 'var(--error)',
                  background: 'var(--chip)',
                  border: `1px solid ${user.is_active ? 'var(--success)' : 'var(--error)'}`,
                }}>
                  {user.is_active ? t.admin.users.active : t.admin.users.blocked}
                </span>
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--primary)', fontSize: '13px' }}>
                {new Date(user.created_at).toLocaleDateString('ru-RU')}
              </td>
              <td>
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
                          background: 'var(--chip)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: user.is_active ? 'var(--warning)' : 'var(--success)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--chip)')}
                      >
                        {user.is_active ? t.admin.users.block : t.admin.users.unblock}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLogoutSessions(user.id);
                        }}
                        style={{
                          padding: '4px 10px',
                          background: 'var(--chip)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: 'var(--primary)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <> <RefreshCw size={12} /> {t.admin.users.sessions} </>
                      </button>
                    </>
                  )}
                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDelete(user);
                      }}
                      title={t.admin.common.delete}
                      style={{
                        padding: '4px 10px',
                        background: 'var(--chip)',
                        border: '1px solid var(--error)',
                        borderRadius: '6px',
                        color: 'var(--error)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={14} />
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
          borderTop: '1px solid var(--border)',
          marginTop: '8px',
        }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {t.admin.common.showing} {users.length} {t.admin.common.of} {total}
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
