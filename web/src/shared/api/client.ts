// src/shared/api/client.ts

import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.syverro.com';

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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===== RESPONSE INTERCEPTOR — AUTO-REFRESH ON 401 =====
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error || !token) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token');
      const currentToken = localStorage.getItem('token');

      // No tokens at all — anonymous or truly logged out
      if (!currentToken && !refreshToken) {
        return Promise.reject(error);
      }

      // No refresh token — force logout
      if (!refreshToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Already refreshing — queue this request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefresh } = response.data;

        localStorage.setItem('token', access_token);
        localStorage.setItem('refresh_token', newRefresh);

        processQueue(null, access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Refresh failed — logout
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setAuthToken = (token: string, refreshToken?: string): void => {
  localStorage.setItem('token', token);
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export default apiClient;
