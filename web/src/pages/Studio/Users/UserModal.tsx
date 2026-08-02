// src/pages/Studio/Users/UserModal.tsx

import { useState } from 'react';
import { X, Pencil } from 'lucide-react';
import { AdminUser, ROLE_LABELS, ROLE_COLORS, getDisplayRole } from '../../../types/admin';
import { apiClient } from '../../../shared/api/client';
import { getLocaleData, getBrowserLocale } from '../../../locales';

interface UserModalProps {
  isOpen: boolean;
  user: AdminUser;
  onClose: () => void;
  onUpdate: () => void;
}



export default function UserModal({ isOpen, user, onClose, onUpdate }: UserModalProps) {
  const t = getLocaleData(getBrowserLocale());
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    username: user.username || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // ===== СОХРАНЕНИЕ ИЗМЕНЕНИЙ =====
  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.put(`/admin/users/${user.id}`, formData);
      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || t.admin.users.errorSave);
    } finally {
      setLoading(false);
    }
  };

  // ===== ФОРМАТ ДАТЫ =====
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== ЗАГОЛОВОК ===== */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '20px',
              fontWeight: '600',
            }}>
              {(user.first_name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
            </div>
            <div>
              <div style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '500' }}>
                {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : t.admin.users.noName}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{user.email || '—'}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ===== ИНФОРМАЦИЯ ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ color: 'var(--primary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t.admin.users.role}
            </div>
            <div style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: '12px',
              fontSize: '14px',
              color: ROLE_COLORS[getDisplayRole(user)] || 'var(--primary)',
              background: 'var(--primary-soft)',
              border: '1px solid var(--primary)',
              marginTop: '4px',
            }}>
              {ROLE_LABELS[getDisplayRole(user)] || getDisplayRole(user)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--primary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t.admin.users.status}
            </div>
            <div style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: '12px',
              fontSize: '14px',
              color: user.is_active ? 'var(--success)' : 'var(--error)',
              background: user.is_active ? 'var(--chip)' : 'var(--chip)',
              border: `1px solid ${user.is_active ? 'var(--success)' : 'var(--error)'}`,
              marginTop: '4px',
            }}>
              {user.is_active ? t.admin.users.active : t.admin.users.blocked}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--primary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t.admin.users.registered}
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '14px', marginTop: '4px' }}>
              {formatDate(user.created_at)}
            </div>
          </div>
          {user.last_active && (
            <div>
              <div style={{ color: 'var(--primary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t.admin.users.lastActive}
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: '14px', marginTop: '4px' }}>
                {formatDate(user.last_active)}
              </div>
            </div>
          )}
          {user.phone && (
            <div>
              <div style={{ color: 'var(--primary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t.admin.users.phone}
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: '14px', marginTop: '4px' }}>
                {user.phone}
              </div>
            </div>
          )}
          {user.telegram_id && (
            <div>
              <div style={{ color: 'var(--primary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t.admin.users.telegramId}
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: '14px', marginTop: '4px' }}>
                {user.telegram_id}
              </div>
            </div>
          )}
        </div>

        {/* ===== РЕДАКТИРОВАНИЕ ===== */}
        {isEditing ? (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '14px', marginBottom: '12px' }}>{t.admin.users.editProfile}</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>{t.admin.users.firstName}</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>{t.admin.users.lastName}</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>{t.admin.users.username}</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <div style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '12px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'var(--primary)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {loading ? t.admin.common.saving : t.admin.common.save}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                }}
                style={{
                  padding: '10px 20px',
                  background: 'var(--chip)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {t.admin.common.cancel}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                flex: 1,
                padding: '10px',
                background: 'var(--primary-soft)',
                border: '1px solid var(--primary)',
                borderRadius: '8px',
                color: 'var(--primary)',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <> <Pencil size={14} /> {t.admin.common.edit} </>
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                background: 'var(--chip)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {t.admin.common.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
