// src/pages/Admin/Settings/index.tsx

import { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { type AdminSettings } from '../../../types/admin';
import { canManageSettings } from '../../../types/admin';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminSettings() {
  const { setLoading, isLoading, error, setError, clearError } = useAdminStore();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [formData, setFormData] = useState<Partial<AdminSettings>>({});
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser?.role || 'user';
  const canManage = canManageSettings(userRole);

  // ===== ЗАГРУЗКА НАСТРОЕК =====
  const fetchSettings = async () => {
    setLoading(true);
    clearError();

    try {
      const response = await fetch(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Ошибка загрузки настроек');
      }

      const data = await response.json();
      setSettings(data);
      setFormData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // ===== СОХРАНЕНИЕ НАСТРОЕК =====
  const handleSave = async () => {
    setSaveMessage(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Ошибка сохранения настроек');
      }

      const data = await response.json();
      setSettings(data);
      setSaveMessage({ type: 'success', text: '✅ Настройки успешно сохранены' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  // ===== ИЗМЕНЕНИЕ ПОЛЯ =====
  const handleChange = (key: keyof AdminSettings, value: any) => {
    setFormData({ ...formData, [key]: value });
  };

  // ===== НЕТ ПРАВ =====
  if (!canManage) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#EF5350',
        background: 'rgba(18, 28, 36, 0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(239,83,80,0.2)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚫</div>
        <h2 style={{ color: '#E6EDF3', marginBottom: '8px' }}>Доступ запрещён</h2>
        <p>Только владелец может управлять настройками системы.</p>
      </div>
    );
  }

  if (isLoading && !settings) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <div style={{ color: '#97A6BA' }}>Загрузка настроек...</div>
      </div>
    );
  }

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
          onClick={fetchSettings}
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

  if (!settings) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '400', color: '#E6EDF3', margin: 0 }}>
          ⚙️ Настройки системы
        </h1>
      </div>

      {/* ===== КАРТОЧКИ НАСТРОЕК ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
      }}>
        {/* ===== ОБЩИЕ НАСТРОЙКИ ===== */}
        <div style={{
          background: 'rgba(18, 28, 36, 0.6)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '16px', color: '#E6EDF3', marginBottom: '20px' }}>
            🌐 Общие настройки
          </h2>

          {/* Регистрация */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#E6EDF3', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.registration_enabled ?? settings.registration_enabled}
                onChange={(e) => handleChange('registration_enabled', e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#5B86A1',
                  cursor: 'pointer',
                }}
              />
              Разрешена регистрация новых пользователей
            </label>
            <p style={{ color: '#97A6BA', fontSize: '12px', marginTop: '4px', marginLeft: '30px' }}>
              Если выключено — новые пользователи не смогут зарегистрироваться
            </p>
          </div>

          {/* Режим обслуживания */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#E6EDF3', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.maintenance_mode ?? settings.maintenance_mode}
                onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#5B86A1',
                  cursor: 'pointer',
                }}
              />
              Режим обслуживания
            </label>
            <p style={{ color: '#97A6BA', fontSize: '12px', marginTop: '4px', marginLeft: '30px' }}>
              Включает заглушку для всех пользователей (админы видят сайт)
            </p>
          </div>

          {/* Подтверждение email */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#E6EDF3', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.require_email_verification ?? settings.require_email_verification}
                onChange={(e) => handleChange('require_email_verification', e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#5B86A1',
                  cursor: 'pointer',
                }}
              />
              Требовать подтверждение email
            </label>
            <p style={{ color: '#97A6BA', fontSize: '12px', marginTop: '4px', marginLeft: '30px' }}>
              Пользователи должны подтвердить email перед входом
            </p>
          </div>
        </div>

        {/* ===== СИСТЕМНЫЕ НАСТРОЙКИ ===== */}
        <div style={{
          background: 'rgba(18, 28, 36, 0.6)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '16px', color: '#E6EDF3', marginBottom: '20px' }}>
            🛠️ Системные параметры
          </h2>

          {/* Максимальный размер файла */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Максимальный размер загружаемого файла (МБ)
            </label>
            <input
              type="number"
              value={formData.max_file_size_mb ?? settings.max_file_size_mb}
              onChange={(e) => handleChange('max_file_size_mb', parseInt(e.target.value) || 0)}
              min={1}
              max={100}
              style={{
                width: '100%',
                padding: '10px 14px',
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

          {/* Название сайта */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Название сайта
            </label>
            <input
              type="text"
              value={formData.site_name ?? settings.site_name}
              onChange={(e) => handleChange('site_name', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
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

          {/* Описание сайта */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Описание сайта
            </label>
            <input
              type="text"
              value={formData.site_description ?? settings.site_description}
              onChange={(e) => handleChange('site_description', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
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

          {/* Роль по умолчанию */}
          <div>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Роль по умолчанию для новых пользователей
            </label>
            <select
              value={formData.default_user_role ?? settings.default_user_role}
              onChange={(e) => handleChange('default_user_role', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#E6EDF3',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="user">Пользователь</option>
              <option value="moderator">Модератор</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
        </div>
      </div>

      {/* ===== КНОПКА СОХРАНЕНИЯ ===== */}
      <div style={{
        background: 'rgba(18, 28, 36, 0.6)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '24px',
      }}>
        {saveMessage && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            background: saveMessage.type === 'success' ? 'rgba(76,175,80,0.1)' : 'rgba(239,83,80,0.1)',
            border: `1px solid ${saveMessage.type === 'success' ? 'rgba(76,175,80,0.2)' : 'rgba(239,83,80,0.2)'}`,
            color: saveMessage.type === 'success' ? '#4CAF50' : '#EF5350',
          }}>
            {saveMessage.text}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            background: '#5B86A1',
            border: 'none',
            borderRadius: '8px',
            color: '#0A1118',
            fontSize: '16px',
            fontWeight: '500',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            fontFamily: 'Inter, sans-serif',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) e.currentTarget.style.background = '#4A7590';
          }}
          onMouseLeave={(e) => {
            if (!isLoading) e.currentTarget.style.background = '#5B86A1';
          }}
        >
          {isLoading ? '⏳ Сохранение...' : '💾 Сохранить настройки'}
        </button>

        <p style={{ color: '#5B86A1', fontSize: '12px', textAlign: 'center', marginTop: '12px' }}>
          Только владелец может изменять настройки системы
        </p>
      </div>
    </div>
  );
}