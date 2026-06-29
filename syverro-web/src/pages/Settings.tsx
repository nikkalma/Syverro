// src/pages/Settings.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { storageService } from '../services/storageService';
import { getLocaleData, getBrowserLocale, localePriority, Locale } from '../locales';
import { Save, LogOut, Mail, Key, Sun, Moon } from 'lucide-react';

export default function Settings() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const profile = storageService.getReaderProfile();

  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [status, setStatus] = useState(profile.status || '');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('syverro_theme') || 'dark';
  });
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('syverro_locale') as Locale | null;
    return saved || getBrowserLocale();
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const t = getLocaleData(locale);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('syverro_theme', theme);
  }, [theme]);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
      <h1 style={{ 
        fontSize: '28px', 
        fontWeight: '300', 
        color: 'var(--text-primary)', 
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        ⚙️ {t.settings?.title || 'Настройки'}
      </h1>

      {/* Профиль */}
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
        <h2 style={{ 
          fontSize: '16px', 
          fontWeight: '400', 
          color: 'var(--text-primary)', 
          marginBottom: '20px',
        }}>
          Профиль
        </h2>

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
              background: 'var(--surface-alt)',
              border: '1px solid var(--border-soft)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-soft)'; }}
          />
        </div>

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
              background: 'var(--surface-alt)',
              border: '1px solid var(--border-soft)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-soft)'; }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Тема
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setTheme('dark')}
              style={{
                flex: 1,
                padding: '10px',
                background: theme === 'dark' ? 'var(--primary)' : 'var(--surface-alt)',
                border: theme === 'dark' ? '1px solid var(--primary)' : '1px solid var(--border-soft)',
                borderRadius: '8px',
                color: theme === 'dark' ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Moon size={18} />
              Тёмная
            </button>
            <button
              onClick={() => setTheme('light')}
              style={{
                flex: 1,
                padding: '10px',
                background: theme === 'light' ? 'var(--primary)' : 'var(--surface-alt)',
                border: theme === 'light' ? '1px solid var(--primary)' : '1px solid var(--border-soft)',
                borderRadius: '8px',
                color: theme === 'light' ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Sun size={18} />
              Светлая
            </button>
          </div>
        </div>

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
              background: 'var(--surface-alt)',
              border: '1px solid var(--border-soft)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              transition: 'border-color 0.2s',
              cursor: 'pointer',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-soft)'; }}
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
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isSaving ? 'default' : 'pointer',
            opacity: isSaving ? 0.6 : 1,
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => {
            if (!isSaving) e.currentTarget.style.background = 'var(--primary-soft)';
          }}
          onMouseLeave={(e) => {
            if (!isSaving) e.currentTarget.style.background = 'var(--primary)';
          }}
        >
          <Save size={18} />
          {isSaving ? '💾 Сохранение...' : '💾 Сохранить настройки'}
        </button>

        {saveMessage && (
          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '14px', color: 'var(--success)' }}>
            {saveMessage}
          </div>
        )}
      </div>

      {/* Аккаунт */}
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
        <h2 style={{ 
          fontSize: '16px', 
          fontWeight: '400', 
          color: 'var(--text-primary)', 
          marginBottom: '20px',
        }}>
          Аккаунт
        </h2>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'var(--surface-alt)',
            borderRadius: '8px',
            border: '1px solid var(--border-soft)',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
            <Mail size={16} />
            <span style={{ fontSize: '14px' }}>Email</span>
          </div>
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
            background: 'var(--surface-alt)',
            borderRadius: '8px',
            border: '1px solid var(--border-soft)',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
            <Key size={16} />
            <span style={{ fontSize: '14px' }}>ID пользователя</span>
          </div>
          <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'monospace' }}>
            {user?.id?.slice(0, 12) || '—'}...
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 83, 80, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut size={18} />
          Выйти
        </button>
      </div>
    </div>
  );
}