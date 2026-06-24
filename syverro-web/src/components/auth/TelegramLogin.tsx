// src/components/auth/TelegramLogin.tsx

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    TelegramLoginWidget: {
      auth: (options: {
        bot_id: string;
        scope?: string;
        public_key?: string;
        sign?: string;
        embed?: number;
        onAuth: (user: TelegramUser) => void;
      }) => void;
    };
  }
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginProps {
  botId: string;
  onSuccess?: () => void;
}

export function TelegramLogin({ botId, onSuccess }: TelegramLoginProps) {
  const { telegramLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleTelegramLogin = async (user: TelegramUser) => {
    setIsLoading(true);
    setError(null);

    try {
      await telegramLogin({
        id: user.id.toString(),
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        photo_url: user.photo_url,
        auth_date: user.auth_date,
        hash: user.hash,
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа через Telegram');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (window.TelegramLoginWidget) {
      window.TelegramLoginWidget.auth({
        bot_id: botId,
        embed: 1,
        onAuth: handleTelegramLogin,
      });
    } else {
      setError('Загрузка Telegram виджета... Попробуйте обновить страницу');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <button
        onClick={handleClick}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '12px 20px',
          background: '#2AABEE',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          fontSize: '16px',
          fontWeight: '500',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.64 8.14C16.49 9.17 15.9 12.03 15.49 14.22C15.35 14.99 14.96 15.09 14.34 14.72L11.89 13.03C11.68 12.89 11.58 12.93 11.48 13.14L10.26 14.76C10.15 14.92 10.06 15.04 9.74 15.04L10.38 12.08L13.86 8.91C14.05 8.74 13.82 8.67 13.58 8.82L9.27 11.67L6.84 10.9C6.04 10.66 6.01 10.14 6.99 9.78L15.75 6.42C16.48 6.14 17.1 6.57 16.92 7.52L16.64 8.14Z" fill="white"/>
        </svg>
        {isLoading ? 'Вход...' : 'Войти через Telegram'}
      </button>

      {error && (
        <div style={{ color: '#EF5350', fontSize: '14px' }}>{error}</div>
      )}
    </div>
  );
}