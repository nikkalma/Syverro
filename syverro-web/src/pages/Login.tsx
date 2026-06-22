// src/pages/Login.tsx
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Временный вход без пароля
    localStorage.setItem('access_token', 'fake_token');
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B1220',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{
        background: '#121C24',
        padding: '40px',
        borderRadius: '16px',
        border: '1px solid #2A4B60',
        maxWidth: '400px',
        width: '90%',
      }}>
        <h1 style={{ color: '#E6EDF3', fontSize: '32px', marginBottom: '8px' }}>Syverro</h1>
        <p style={{ color: '#97A6BA', marginBottom: '24px' }}>Вход в библиотеку</p>
        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '12px',
            background: '#5B86A1',
            border: 'none',
            borderRadius: '8px',
            color: '#0A1118',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Войти
        </button>
      </div>
    </div>
  );
}