import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.syverro.com';

type VerificationState = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<VerificationState>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setState('error');
      return;
    }

    const controller = new AbortController();
    void fetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('Verification failed');
        setState('success');
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState('error');
      });

    return () => controller.abort();
  }, [searchParams]);

  const message = state === 'loading'
    ? 'Подтверждаем адрес…'
    : state === 'success'
      ? 'Email подтверждён. Теперь можно войти.'
      : 'Ссылка недействительна или устарела.';

  return (
    <div style={{ maxWidth: 520, margin: '80px auto', padding: '20px', color: '#E6EDF3' }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Подтверждение email</h1>
      <p style={{ color: state === 'error' ? '#EF5350' : '#97A6BA', marginBottom: 24 }}>
        {message}
      </p>
      {state !== 'loading' && <Link to="/login" style={{ color: '#5B86A1' }}>Перейти ко входу</Link>}
    </div>
  );
}
