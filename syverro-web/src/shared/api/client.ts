import axios from 'axios';

const isProduction = import.meta.env.MODE === 'production';
const PROD_API_URL = 'https://api.syverro.com/api/v1';
const DEV_API_URL = 'http://localhost:8000/api/v1';

export const API_BASE_URL = isProduction ? PROD_API_URL : DEV_API_URL;

console.log('API Client mode:', import.meta.env.MODE, 'baseURL:', API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;