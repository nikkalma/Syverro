import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api/client';

export const authService = {
  async login(email: string, password: string) {
    const response = await apiClient.post('/api/v1/auth/login', { email, password });
    const { access_token } = response.data;
    await AsyncStorage.setItem('@auth_token', access_token);
    return true;
  },

  async register(email: string, password: string) {
    await apiClient.post('/api/v1/auth/register', { email, password });
    return true;
  },

  async logout() {
    await AsyncStorage.removeItem('@auth_token');
  },

  async getToken() {
    return await AsyncStorage.getItem('@auth_token');
  },
};