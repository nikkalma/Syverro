// src/contexts/AuthContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email?: string | null;
  phone?: string | null;
  telegram_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  telegramLogin: (telegramData: TelegramAuthData) => Promise<void>;
  phoneLogin: (phone: string) => Promise<void>;
  verifyCode: (phone: string, code: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

interface TelegramAuthData {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ===== ВОССТАНОВЛЕНИЕ СЕССИИ =====
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

  // ===== ОБЩАЯ ФУНКЦИЯ ДЛЯ УСТАНОВКИ ДАННЫХ =====
  const setAuthData = async (token: string) => {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Не удалось получить данные пользователя');
    }

    const userData = await response.json();

    setToken(token);
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // ===== EMAIL LOGIN =====
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Ошибка входа');
      }

      const data = await response.json();
      await setAuthData(data.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== EMAIL REGISTER =====
  const register = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Ошибка регистрации');
      }

      await login(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== TELEGRAM LOGIN =====
  const telegramLogin = async (telegramData: TelegramAuthData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Ошибка входа через Telegram');
      }

      const data = await response.json();
      await setAuthData(data.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== PHONE SEND CODE =====
  const phoneLogin = async (phone: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/phone/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Ошибка отправки кода');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ===== PHONE VERIFY CODE =====
  const verifyCode = async (phone: string, code: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/phone/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Неверный код');
      }

      const data = await response.json();
      await setAuthData(data.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== LOGOUT =====
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      telegramLogin,
      phoneLogin,
      verifyCode,
      logout,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}