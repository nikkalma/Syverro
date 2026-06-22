// src/pages/Profile/SettingsSection.tsx
export default function SettingsSection() {
  return (
    <div
      style={{
        background: 'rgba(18, 28, 36, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '24px',
      }}
    >
      <h2
        style={{
          fontSize: '18px',
          fontWeight: '400',
          color: '#E6EDF3',
          marginBottom: '16px',
        }}
      >
        ⚙️ Настройки
      </h2>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <span style={{ color: '#97A6BA', fontSize: '14px' }}>Тема</span>
          <span style={{ color: '#E6EDF3', fontSize: '14px' }}>🌙 Тёмная</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <span style={{ color: '#97A6BA', fontSize: '14px' }}>Аккаунт</span>
          <span style={{ color: '#E6EDF3', fontSize: '14px' }}>user@email.com</span>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
          }}
          style={{
            padding: '12px',
            background: 'transparent',
            border: '1px solid #EF5350',
            borderRadius: '8px',
            color: '#EF5350',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'Inter, sans-serif',
            width: 'auto',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 83, 80, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Выйти
        </button>
      </div>
    </div>
  );
}