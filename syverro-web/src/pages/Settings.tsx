// src/pages/Settings.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { storageService } from '../services/storageService';
import { getLocaleData, getBrowserLocale, localePriority, Locale } from '../locales';
import { useTheme } from '../contexts/ThemeContext';

export default function Settings() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const profile = storageService.getReaderProfile();
  const { theme, toggleTheme } = useTheme();

  // ===== СОСТОЯНИЯ =====
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [status, setStatus] = useState(profile.status || '');
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('syverro_locale') as Locale | null;
    return saved || getBrowserLocale();
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const t = getLocaleData(locale);

  // ===== СОХРАНЕНИЕ ПРОФИЛЯ =====
  const handleSave = () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      storageService.updateReaderProfile({
        displayName: displayName.trim() || 'Читатель',
        status: status.trim(),
      });

      localStorage.setItem('syverro_locale', locale);

      setSaveMessage('✅ Настройки сохранены');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('❌ Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  // ===== ВЫХОД =====
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ===== ЯЗЫКИ =====
  const localeLabels: Record<Locale, string> = {
    ru: 'Русский',
    en: 'English',
    kk: 'Қазақша',
    uk: 'Українська',
    be: 'Беларуская',
    sr: 'Српски',
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '300', color: 'var(--text-primary)', marginBottom: '32px' }}>
        ⚙️ {t.settings?.title || 'Настройки'}
      </h1>

      {/* ===== ОСНОВНЫЕ НАСТРОЙКИ ===== */}
      <div
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
          padding: '24px',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '20px' }}>
          👤 Профиль
        </h2>

        {/* Имя */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Имя
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Читатель"
            style={{
              width: '100%',
              padding: '10px 14px',
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

        {/* Статус */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Статус
          </label>
          <input
            type="text"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="Пришла читать"
            style={{
              width: '100%',
              padding: '10px 14px',
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

        {/* ===== ТЕМА (РАБОЧИЙ ПЕРЕКЛЮЧАТЕЛЬ) ===== */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Тема
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => toggleTheme()}
              style={{
                flex: 1,
                padding: '10px',
                background: theme === 'dark' ? 'rgba(91, 134, 161, 0.25)' : 'rgba(255,255,255,0.05)',
                border: theme === 'dark' ? '1px solid rgba(91, 134, 161, 0.3)' : '1px solid var(--border)',
                borderRadius: '8px',
                color: theme === 'dark' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s',
              }}
            >
              🌙 Тёмная
            </button>
            <button
              onClick={() => toggleTheme()}
              style={{
                flex: 1,
                padding: '10px',
                background: theme === 'light' ? 'rgba(91, 134, 161, 0.25)' : 'rgba(255,255,255,0.05)',
                border: theme === 'light' ? '1px solid rgba(91, 134, 161, 0.3)' : '1px solid var(--border)',
                borderRadius: '8px',
                color: theme === 'light' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s',
              }}
            >
              ☀️ Светлая
            </button>
          </div>
        </div>

        {/* Язык */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Язык
          </label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
            }}
          >
            {localePriority.map((l) => (
              <option key={l} value={l}>
                {localeLabels[l]}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            width: '100%',
            padding: '12px',
            background: 'var(--primary)',
            border: 'none',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isSaving ? 'default' : 'pointer',
            opacity: isSaving ? 0.6 : 1,
            fontFamily: 'Inter, sans-serif',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isSaving) e.currentTarget.style.background = 'var(--primary-soft)';
          }}
          onMouseLeave={(e) => {
            if (!isSaving) e.currentTarget.style.background = 'var(--primary)';
          }}
        >
          {isSaving ? '💾 Сохранение...' : '💾 Сохранить настройки'}
        </button>

        {saveMessage && (
          <div
            style={{
              marginTop: '12px',
              textAlign: 'center',
              fontSize: '14px',
              color: saveMessage.includes('✅') ? 'var(--success)' : 'var(--error)',
            }}
          >
            {saveMessage}
          </div>
        )}
      </div>

      {/* ===== АККАУНТ ===== */}
      <div
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
          padding: '24px',
        }}
      >
        <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '20px' }}>
          🔐 Аккаунт
        </h2>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            marginBottom: '12px',
          }}
        >
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Email</span>
          <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
            {user?.email || '—'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            marginBottom: '20px',
          }}
        >
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>ID пользователя</span>
          <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace' }}>
            {user?.id?.slice(0, 8) || '-'}…
          </span>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            border: '1px solid var(--error)',
            borderRadius: '8px',
            color: 'var(--error)',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 83, 80, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          🚪 Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}