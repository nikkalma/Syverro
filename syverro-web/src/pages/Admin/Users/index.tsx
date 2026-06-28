// src/pages/Admin/Users/index.tsx

import { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { AdminUser, AdminUserFilters, AdminRole } from '../../../types/admin';
import UsersTable from './UsersTable';
import UsersFilters from './UsersFilters';
import UserModal from './UserModal';
import { canManageUsers, canDeleteUsers } from '../../../types/admin';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminUsers() {
  const { searchQuery, filters, page, limit, setLoading, isLoading, error, setError, clearError } = useAdminStore();
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser?.role || 'user';

  const canManage = canManageUsers(userRole);
  const canDelete = canDeleteUsers(userRole);

  // ===== ЗАГРУЗКА ПОЛЬЗОВАТЕЛЕЙ =====
  const fetchUsers = async () => {
    setLoading(true);
    clearError();

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(searchQuery && { search: searchQuery }),
        ...filters,
      });

      const response = await fetch(`${API_URL}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Ошибка загрузки пользователей');
      }

      const data = await response.json();
      setUsers(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, searchQuery, filters]);

  // ===== ИЗМЕНЕНИЕ РОЛИ =====
  const handleRoleChange = async (userId: string, role: AdminRole) => {
    if (!canManage) return;

    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) throw new Error('Ошибка изменения роли');

      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ===== БЛОКИРОВКА / РАЗБЛОКИРОВКА =====
  const handleToggleBlock = async (userId: string, isActive: boolean) => {
    if (!canManage) return;

    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (!response.ok) throw new Error('Ошибка блокировки');

      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ===== УДАЛЕНИЕ =====
  const handleDelete = async () => {
    if (!userToDelete || !canDelete) return;

    try {
      const response = await fetch(`${API_URL}/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Ошибка удаления');

      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ===== ВЫХОД ИЗ СЕССИЙ =====
  const handleLogoutSessions = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Ошибка выхода из сессий');

      // Показываем уведомление
      alert('✅ Все сессии пользователя завершены');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ===== ОТКРЫТЬ КАРТОЧКУ =====
  const handleOpenUser = (user: AdminUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // ===== ОТКРЫТЬ УДАЛЕНИЕ =====
  const handleOpenDelete = (user: AdminUser) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '400', color: '#E6EDF3', margin: 0 }}>
          👥 Пользователи
          <span style={{ fontSize: '14px', color: '#97A6BA', marginLeft: '12px' }}>
            {total} записей
          </span>
        </h1>
      </div>

      {/* ===== ФИЛЬТРЫ ===== */}
      <UsersFilters onFilterChange={fetchUsers} />

      {/* ===== ТАБЛИЦА ===== */}
      <UsersTable
        users={users}
        loading={isLoading}
        error={error}
        total={total}
        page={page}
        limit={limit}
        canManage={canManage}
        canDelete={canDelete}
        onRoleChange={handleRoleChange}
        onToggleBlock={handleToggleBlock}
        onOpenUser={handleOpenUser}
        onOpenDelete={handleOpenDelete}
        onLogoutSessions={handleLogoutSessions}
        onRefresh={fetchUsers}
      />

      {/* ===== МОДАЛКА КАРТОЧКИ ===== */}
      {selectedUser && (
        <UserModal
          isOpen={isModalOpen}
          user={selectedUser}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onUpdate={fetchUsers}
        />
      )}

      {/* ===== МОДАЛКА УДАЛЕНИЯ ===== */}
      {isDeleteModalOpen && userToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            style={{
              background: '#121C24',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px' }}>⚠️</div>
              <h2 style={{ color: '#E6EDF3', fontSize: '20px', marginBottom: '8px' }}>Удалить пользователя?</h2>
              <p style={{ color: '#97A6BA', fontSize: '14px' }}>
                Вы уверены, что хотите удалить пользователя <strong style={{ color: '#E6EDF3' }}>{userToDelete.email}</strong>?
                <br />
                <span style={{ color: '#EF5350', fontSize: '13px' }}>Это действие нельзя отменить.</span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#EF5350',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                🗑️ Удалить
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: '#97A6BA',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}