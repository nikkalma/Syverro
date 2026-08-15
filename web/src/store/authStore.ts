// src/store/authStore.ts
import { create } from 'zustand';
import { clearLegacyAuthTokens, removeAuthToken } from '../shared/api/client';

interface User {
  id: string;
  email: string;
  created_at: string;
  role?: string;
}

export interface TelegramAuthPayload {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (token: string, user: User, refreshToken?: string) => void;
  login: (email: string, password: string) => Promise<void>;
  telegramLogin: (payload: TelegramAuthPayload) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

const isSyverroWeb = ['syverro.com', 'www.syverro.com'].includes(window.location.hostname);
const API_URL = isSyverroWeb
  ? ''
  : import.meta.env.VITE_API_URL || 'https://api.syverro.com';

const apiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'detail' in error) {
    const detail = (error as { detail?: unknown }).detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
  }
  return fallback;
};

clearLegacyAuthTokens();

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('user'),
  isLoading: false,

  setAuth: (_token: string, user: User, _refreshToken?: string) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  checkAuth: () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    set({ user, isAuthenticated: !!user });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(apiErrorMessage(error, 'Ошибка входа'));
      }

      const userResponse = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
      });
      if (!userResponse.ok) {
        throw new Error('Не удалось получить данные пользователя');
      }
      const user = await userResponse.json();
      set({ user, isAuthenticated: true });
      localStorage.setItem('user', JSON.stringify(user));
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  telegramLogin: async (payload: TelegramAuthPayload) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/auth/telegram`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(apiErrorMessage(error, 'Ошибка входа через Telegram'));
      }

      const userResponse = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
      });
      if (!userResponse.ok) {
        throw new Error('Не удалось получить данные пользователя');
      }
      const user = await userResponse.json();
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email: string, password: string) => {
    set({ isLoading: true });

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(apiErrorMessage(error, 'Ошибка регистрации'));
      }

      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    void fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    removeAuthToken();
    set({ user: null, isAuthenticated: false });
  },
}));
