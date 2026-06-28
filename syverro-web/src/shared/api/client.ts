// src/shared/api/client.ts

import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ===== REQUEST INTERCEPTOR — ДОБАВЛЯЕТ ТОКЕН =====
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔐 [API] Request interceptor: token found:', !!token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 [API] Authorization header set:', config.headers.Authorization);
    } else {
      console.warn('🔐 [API] No token found in localStorage');
    }

    console.log(`📡 [API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ [API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ===== RESPONSE INTERCEPTOR — ОБРАБОТКА ОШИБОК =====
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [API] ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Если 401 и не пытались обновить токен
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Проверяем, есть ли токен в localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('🔐 [API] No token, redirecting to login');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Если токен есть, но 401 — возможно, он истёк
      console.warn('🔐 [API] Token expired or invalid, redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    console.error(`❌ [API] ${error.response?.status || 'Network'} error:`, error.message);
    return Promise.reject(error);
  }
);

// ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====

// Проверка, авторизован ли пользователь
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

// Получение токена
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Установка токена (вызывается после логина)
export const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
};

// Удаление токена (выход)
export const removeAuthToken = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export default apiClient;