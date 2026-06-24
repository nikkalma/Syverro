// src/store/authStore.ts

import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setAuth: (token: string, user: User) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,

  login: async (email: string, password: string) => {
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

    // Получаем пользователя
    const userResponse = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${data.access_token}` },
    });

    if (!userResponse.ok) {
      throw new Error('Не удалось получить данные пользователя');
    }

    const user = await userResponse.json();

    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(user));

    set({ user, token: data.access_token });
  },

  register: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка регистрации');
    }

    // После регистрации — логиним
    const { login } = useAuthStore.getState();
    await login(email, password);
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  setAuth: (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },
}));