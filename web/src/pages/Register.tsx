import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import TelegramLogin from '../components/auth/TelegramLogin';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [error, setError] = useState('');
  const telegramLogin = useAuthStore((state) => state.telegramLogin);
  const navigate = useNavigate();

  const handleTelegramAuth = async (payload: Parameters<typeof telegramLogin>[0]) => {
    setError('');
    try {
      await telegramLogin(payload);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации через Telegram');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 20px', color: '#E6EDF3' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Регистрация</h1>
      <p style={{ color: '#97A6BA', marginBottom: 32 }}>
        Уже есть аккаунт? <Link to="/login" style={{ color: '#5B86A1' }}>Войти</Link>
      </p>

      <TelegramLogin onAuth={handleTelegramAuth} />
      <p style={{ color: '#97A6BA', fontSize: 13, textAlign: 'center', margin: '16px 0' }}>
        Telegram одновременно создаст и подтвердит аккаунт — email и пароль не понадобятся.
      </p>

      {error && (
        <div style={{ color: '#EF5350', marginTop: 16, fontSize: 14, textAlign: 'center' }}>
          {error}
        </div>
      )}
    </div>
  );
}
