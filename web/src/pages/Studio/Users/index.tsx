import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { useAdminStore } from '../../../store/adminStore';
import {
  AdminUser,
  AdminRole,
  canManageUsers,
  canDeleteUsers,
} from '../../../types/admin';

import { apiClient } from '../../../shared/api/client';

import UsersTable from './UsersTable';
import UsersFilters from './UsersFilters';
import UserModal from './UserModal';
import { getLocaleData, getBrowserLocale } from '../../../locales';


export default function AdminUsers() {
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);
  const {
    searchQuery,
    usersFilters,
    page,
    limit,
    setLoading,
    isLoading,
    error,
    setError,
    clearError,
  } = useAdminStore();


  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);


  // ============================================================
  // ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ
  // ============================================================

  const getCurrentUser = () => {
    try {
      return JSON.parse(
        localStorage.getItem('user') ?? '{}'
      );
    } catch {
      return {};
    }
  };


  const currentUser = getCurrentUser();

  const userRole = currentUser.role ?? 'user';

  const canManage = canManageUsers(userRole);
  const canDelete = canDeleteUsers(userRole);



  // ============================================================
  // ЗАГРУЗКА ПОЛЬЗОВАТЕЛЕЙ
  // ============================================================

  const fetchUsers = async () => {
    setLoading(true);
    clearError();


    try {
    const params = {
  page,
  limit,

  ...(searchQuery && {
    search: searchQuery,
  }),

  ...usersFilters,
      };


      const response = await apiClient.get('/admin/users', {
        params,
      });


      const data = response.data;


      setUsers(
        data.data ?? []
      );

      setTotal(
        data.total ?? 0
      );


    } catch (err: any) {
      setError(
        err.response?.data?.detail ??
        err.message ??
        t.admin.users.errorLoad
      );

    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
  fetchUsers();
}, [
  page,
  limit,
  searchQuery,
  usersFilters,
  ]);



  // ============================================================
  // ИЗМЕНЕНИЕ РОЛИ
  // ============================================================

  const handleRoleChange = async (
    userId: string,
    role: AdminRole
  ) => {

    if (!canManage) {
      return;
    }


    try {
      await apiClient.put(
        `/admin/users/${userId}/role`,
        {
          role,
        }
      );


      await fetchUsers();


    } catch (err: any) {

      setError(
        err.response?.data?.detail ??
        t.admin.users.errorRole
      );

    }
  };



  // ============================================================
  // БЛОКИРОВКА
  // ============================================================

  const handleToggleBlock = async (
    userId: string,
    isActive: boolean
  ) => {

    if (!canManage) {
      return;
    }


    try {
      await apiClient.put(
        `/admin/users/${userId}/block`,
        {
          is_active: !isActive,
        }
      );


      await fetchUsers();


    } catch (err: any) {

      setError(
        err.response?.data?.detail ??
        t.admin.users.errorStatus
      );

    }
  };



  // ============================================================
  // УДАЛЕНИЕ
  // ============================================================

  const handleDelete = async () => {

    if (
      !userToDelete ||
      !canDelete
    ) {
      return;
    }


    try {

      await apiClient.delete(
        `/admin/users/${userToDelete.id}`
      );


      setIsDeleteModalOpen(false);
      setUserToDelete(null);


      await fetchUsers();


    } catch (err: any) {

      setError(
        err.response?.data?.detail ??
        t.admin.users.errorDelete
      );

    }
  };



  // ============================================================
  // СЕССИИ
  // ============================================================

  const handleLogoutSessions = async (
    userId: string
  ) => {

    try {

      await apiClient.post(
        `/admin/users/${userId}/logout`
      );


      alert(t.admin.users.sessionsTerminated);


    } catch (err: any) {

      setError(
        err.response?.data?.detail ??
        t.admin.users.errorSessions
      );

    }
  };



  // ============================================================
  // МОДАЛКИ
  // ============================================================

  const handleOpenUser = (
    user: AdminUser
  ) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };


  const handleOpenDelete = (
    user: AdminUser
  ) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };



  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >

        <h1
          style={{
            fontSize: '24px',
            fontWeight: 400,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          {t.admin.users.title}

          <span
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginLeft: '12px',
            }}
          >
            {total} {t.admin.common.records}
          </span>

        </h1>

      </div>



      <UsersFilters
        onFilterChange={fetchUsers}
        viewerRole={userRole}
      />



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

          onClick={() =>
            setIsDeleteModalOpen(false)
          }

        >

          <div

            style={{
              background: 'var(--surface)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              border:
                '1px solid var(--border)',
            }}

            onClick={(e) =>
              e.stopPropagation()
            }

          >

            <div
              style={{
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >

              <div
                style={{
                  display: 'inline-flex',
                  color: 'var(--error)',
                  marginBottom: '16px',
                }}
              >
                <AlertTriangle size={40} />
              </div>


              <h2
                style={{
                  color: 'var(--text-primary)',
                  fontSize: '20px',
                }}
              >
                {t.admin.users.deleteConfirm}
              </h2>


              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                }}
              >

                {t.admin.users.deleteConfirmText}{' '}

                <strong
                  style={{
                    color: 'var(--text-primary)',
                  }}
                >
                  {userToDelete.email || userToDelete.username || userToDelete.id}
                </strong>

                ?

              </p>

            </div>



            <div
              style={{
                display: 'flex',
                gap: '12px',
              }}
            >

              <button
                onClick={handleDelete}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--error)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                {t.admin.common.delete}
              </button>


              <button
                onClick={() =>
                  setIsDeleteModalOpen(false)
                }
                style={{
                  flex: 1,
                  padding: '12px',
                  background:
                    'var(--chip)',
                  border:
                    '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {t.admin.common.cancel}
              </button>

            </div>


          </div>

        </div>

      )}

    </div>
  );
}
