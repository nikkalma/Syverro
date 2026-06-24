// src/components/auth/PhoneLogin.tsx

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PhoneLoginProps {
  onSuccess?: () => void;
}

export function PhoneLogin({ onSuccess }: PhoneLoginProps) {
  const { phoneLogin, verifyCode } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await phoneLogin(phone);
      setStep('code');
      setResendTimer(60);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки кода');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await verifyCode(phone, code);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный код');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 1) return `+${cleaned}`;
    if (cleaned.length <= 4) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1)}`;
    if (cleaned.length <= 7) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4)}`;
    if (cleaned.length <= 9) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
  };

  return (
    <div style={{ width: '100%', maxWidth: '400px' }}>
      {step === 'phone' ? (
        <form onSubmit={handleSendCode}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#97A6BA', fontSize: '14px', marginBottom: '4px' }}>
              Номер телефона
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="+7 (999) 999-99-99"
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
            disabled={isLoading || phone.length < 10}
            style={{
              width: '100%',
              padding: '12px',
              background: '#5B86A1',
              border: 'none',
              borderRadius: '8px',
              color: '#0A1118',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isLoading || phone.length < 10 ? 'not-allowed' : 'pointer',
              opacity: isLoading || phone.length < 10 ? 0.6 : 1,
            }}
          >
            {isLoading ? 'Отправка...' : 'Получить код'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#97A6BA', fontSize: '14px', marginBottom: '4px' }}>
              Код подтверждения
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Введите код из SMS"
              required
              maxLength={6}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(18, 28, 36, 0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#E6EDF3',
                fontSize: '16px',
                letterSpacing: '4px',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ color: '#5B86A1', fontSize: '13px' }}>
                Код отправлен на {phone}
              </span>
              {resendTimer > 0 ? (
                <span style={{ color: '#97A6BA', fontSize: '13px' }}>
                  Повторно через {resendTimer}с
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendCode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#5B86A1',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Отправить код повторно
                </button>
              )}
            </div>
          </div>

          {error && (
            <div style={{ color: '#EF5350', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || code.length < 4}
            style={{
              width: '100%',
              padding: '12px',
              background: '#5B86A1',
              border: 'none',
              borderRadius: '8px',
              color: '#0A1118',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isLoading || code.length < 4 ? 'not-allowed' : 'pointer',
              opacity: isLoading || code.length < 4 ? 0.6 : 1,
            }}
          >
            {isLoading ? 'Проверка...' : 'Подтвердить'}
          </button>

          <button
            type="button"
            onClick={() => setStep('phone')}
            style={{
              marginTop: '12px',
              background: 'none',
              border: 'none',
              color: '#97A6BA',
              cursor: 'pointer',
              fontSize: '14px',
              width: '100%',
            }}
          >
            ← Изменить номер телефона
          </button>
        </form>
      )}
    </div>
  );
}