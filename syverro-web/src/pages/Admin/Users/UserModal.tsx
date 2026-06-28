// src/pages/Admin/Users/UserModal.tsx

import { useState } from 'react';
import { AdminUser, AdminRole, ROLE_LABELS, ROLE_COLORS } from '../../../types/admin';

interface UserModalProps {
  isOpen: boolean;
  user: AdminUser;
  onClose: () => void;
  onUpdate: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function UserModal({ isOpen, user, onClose, onUpdate }: UserModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    username: user.username || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('token');

  if (!isOpen) return null;

  // ===== СОХРАНЕНИЕ ИЗМЕНЕНИЙ =====
  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Ошибка обновления');
      }

      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      setError(err.message);
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
          background: '#121C24',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
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
              background: '#5B86A1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0A1118',
              fontSize: '20px',
              fontWeight: '600',
            }}>
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ color: '#E6EDF3', fontSize: '18px', fontWeight: '500' }}>
                {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Без имени'}
              </div>
              <div style={{ color: '#97A6BA', fontSize: '14px' }}>{user.email}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#97A6BA',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* ===== ИНФОРМАЦИЯ ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ color: '#5B86A1', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Роль
            </div>
            <div style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: '12px',
              fontSize: '14px',
              color: ROLE_COLORS[user.role] || '#97A6BA',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${ROLE_COLORS[user.role] || '#2A4B60'}40`,
              marginTop: '4px',
            }}>
              {ROLE_LABELS[user.role] || user.role}
            </div>
          </div>
          <div>
            <div style={{ color: '#5B86A1', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Статус
            </div>
            <div style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: '12px',
              fontSize: '14px',
              color: user.is_active ? '#4CAF50' : '#EF5350',
              background: user.is_active ? 'rgba(76,175,80,0.1)' : 'rgba(239,83,80,0.1)',
              border: `1px solid ${user.is_active ? 'rgba(76,175,80,0.2)' : 'rgba(239,83,80,0.2)'}`,
              marginTop: '4px',
            }}>
              {user.is_active ? '🟢 Активен' : '🔴 Заблокирован'}
            </div>
          </div>
          <div>
            <div style={{ color: '#5B86A1', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Дата регистрации
            </div>
            <div style={{ color: '#E6EDF3', fontSize: '14px', marginTop: '4px' }}>
              {formatDate(user.created_at)}
            </div>
          </div>
          {user.last_active && (
            <div>
              <div style={{ color: '#5B86A1', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Последняя активность
              </div>
              <div style={{ color: '#E6EDF3', fontSize: '14px', marginTop: '4px' }}>
                {formatDate(user.last_active)}
              </div>
            </div>
          )}
          {user.phone && (
            <div>
              <div style={{ color: '#5B86A1', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Телефон
              </div>
              <div style={{ color: '#E6EDF3', fontSize: '14px', marginTop: '4px' }}>
                {user.phone}
              </div>
            </div>
          )}
          {user.telegram_id && (
            <div>
              <div style={{ color: '#5B86A1', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Telegram ID
              </div>
              <div style={{ color: '#E6EDF3', fontSize: '14px', marginTop: '4px' }}>
                {user.telegram_id}
              </div>
            </div>
          )}
        </div>

        {/* ===== РЕДАКТИРОВАНИЕ ===== */}
        {isEditing ? (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
            <h4 style={{ color: '#E6EDF3', fontSize: '14px', marginBottom: '12px' }}>✏️ Редактировать профиль</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ color: '#97A6BA', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Имя</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: '#E6EDF3',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#97A6BA', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Фамилия</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: '#E6EDF3',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: '#97A6BA', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: '#E6EDF3',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <div style={{ color: '#EF5350', fontSize: '13px', marginBottom: '12px' }}>
                ❌ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#5B86A1',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#0A1118',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {loading ? 'Сохранение...' : '💾 Сохранить'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                }}
                style={{
                  padding: '10px 20px',
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
        ) : (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                flex: 1,
                padding: '10px',
                background: 'rgba(91, 134, 161, 0.15)',
                border: '1px solid rgba(91, 134, 161, 0.2)',
                borderRadius: '8px',
                color: '#5B86A1',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              ✏️ Редактировать
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#97A6BA',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  );
}