// src/pages/Login.tsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TelegramLogin } from '../components/auth/TelegramLogin';
import { PhoneLogin } from '../components/auth/PhoneLogin';

const TELEGRAM_BOT_ID = import.meta.env.VITE_TELEGRAM_BOT_ID || '123456789';

export default function Login() {
  const [activeTab, setActiveTab] = useState<'telegram' | 'phone' | 'email'>('telegram');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ color: '#E6EDF3', fontSize: '28px', marginBottom: '4px' }}>Вход в Syverro</h1>
      <p style={{ color: '#97A6BA', marginBottom: '32px', fontSize: '14px' }}>
        Нет аккаунта? <Link to="/register" style={{ color: '#5B86A1' }}>Зарегистрироваться</Link>
      </p>

      {/* ВКЛАДКИ */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => setActiveTab('telegram')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'telegram' ? '2px solid #5B86A1' : '2px solid transparent',
            color: activeTab === 'telegram' ? '#E6EDF3' : '#5B86A1',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'telegram' ? '500' : '400',
          }}
        >
          📱 Telegram
        </button>
        <button
          onClick={() => setActiveTab('phone')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'phone' ? '2px solid #5B86A1' : '2px solid transparent',
            color: activeTab === 'phone' ? '#E6EDF3' : '#5B86A1',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'phone' ? '500' : '400',
          }}
        >
          📞 Телефон
        </button>
        <button
          onClick={() => setActiveTab('email')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'email' ? '2px solid #5B86A1' : '2px solid transparent',
            color: activeTab === 'email' ? '#E6EDF3' : '#5B86A1',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'email' ? '500' : '400',
          }}
        >
          ✉️ Email
        </button>
      </div>

      {/* КОНТЕНТ ВКЛАДОК */}
      <div style={{ minHeight: '300px' }}>
        {activeTab === 'telegram' && (
          <TelegramLogin botId={TELEGRAM_BOT_ID} onSuccess={handleSuccess} />
        )}

        {activeTab === 'phone' && (
          <PhoneLogin onSuccess={handleSuccess} />
        )}

        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#97A6BA', fontSize: '14px', marginBottom: '4px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(18, 28, 36, 0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: '#E6EDF3',
                  fontSize: '16px',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#97A6BA', fontSize: '14px', marginBottom: '4px' }}>
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(18, 28, 36, 0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: '#E6EDF3',
                  fontSize: '16px',
                }}
              />
            </div>

            {error && (
              <div style={{ color: '#EF5350', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
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
              }}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        )}
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ color: '#5B86A1', fontSize: '13px' }}>
          Входя, вы соглашаетесь с условиями использования
        </p>
      </div>
    </div>
  );
}