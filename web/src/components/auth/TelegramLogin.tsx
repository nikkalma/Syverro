import { useEffect, useRef, useState } from 'react';

import type { TelegramAuthPayload } from '../../store/authStore';

declare global {
  interface Window {
    onSyverroTelegramAuth?: (payload: TelegramAuthPayload) => void;
  }
}

interface TelegramLoginProps {
  onAuth: (payload: TelegramAuthPayload) => void | Promise<void>;
}

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'SyverroBot';

export default function TelegramLogin({ onAuth }: TelegramLoginProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onAuthRef = useRef(onAuth);
  const [loadFailed, setLoadFailed] = useState(false);

  onAuthRef.current = onAuth;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    window.onSyverroTelegramAuth = (payload) => {
      void onAuthRef.current(payload);
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-onauth', 'onSyverroTelegramAuth(user)');
    script.onerror = () => setLoadFailed(true);
    container.appendChild(script);

    return () => {
      delete window.onSyverroTelegramAuth;
      container.replaceChildren();
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div ref={containerRef} aria-label="Войти через Telegram" />
      {loadFailed && (
        <a href={`https://t.me/${BOT_USERNAME}`} style={{ color: '#5B86A1', fontSize: 14 }}>
          Открыть @{BOT_USERNAME}
        </a>
      )}
    </div>
  );
}
