// src/store/authStore.ts
import { create } from 'zustand';
import { clearLegacyAuthTokens, removeAuthToken } from '../shared/api/client';

interface User {
  id: string;
  email: string;
  created_at: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (token: string, user: User, refreshToken?: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://api.syverro.com';

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
        throw new Error(error.detail || 'Ошибка входа');
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
        throw new Error(error.detail || 'Ошибка регистрации');
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
