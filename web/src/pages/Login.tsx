// src/pages/Login.tsx

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import TelegramLogin from '../components/auth/TelegramLogin';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const telegramLogin = useAuthStore((state) => state.telegramLogin);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramAuth = async (payload: Parameters<typeof telegramLogin>[0]) => {
    setError('');
    try {
      await telegramLogin(payload);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Ошибка входа через Telegram');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '20px', color: '#E6EDF3' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Вход в Syverro</h1>
      <p style={{ color: '#97A6BA', marginBottom: '32px' }}>
        Нет аккаунта?{' '}
        <Link to="/register" style={{ color: '#5B86A1' }}>
          Зарегистрироваться
        </Link>
      </p>

      <TelegramLogin onAuth={handleTelegramAuth} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0', color: '#6F7D8C', fontSize: 12 }}>
        <span style={{ height: 1, background: 'rgba(255,255,255,0.08)', flex: 1 }} />
        или по email
        <span style={{ height: 1, background: 'rgba(255,255,255,0.08)', flex: 1 }} />
      </div>

      <form onSubmit={handleSubmit}>
        {location.state?.registrationComplete && (
          <div style={{ color: '#7FB069', marginBottom: '16px', fontSize: '14px' }}>
            Проверьте почту и подтвердите адрес перед входом.
          </div>
        )}
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
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: '#5B86A1',
            border: 'none',
            borderRadius: '8px',
            color: '#0A1118',
            fontSize: '16px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
