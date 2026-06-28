// src/pages/Register.tsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '0 20px', color: '#E6EDF3' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Регистрация</h1>
      <p style={{ color: '#97A6BA', marginBottom: '32px' }}>
        Уже есть аккаунт? <Link to="/login" style={{ color: '#5B86A1' }}>Войти</Link>
      </p>

      <form onSubmit={handleSubmit}>
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

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: '#97A6BA', fontSize: '14px', marginBottom: '4px' }}>
            Пароль
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
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
            Подтвердите пароль
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>
    </div>
  );
}