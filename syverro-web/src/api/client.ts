import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Добавляем токен в каждый запрос
apiClient.interceptors.request.use((config) => {
  // Пробуем разные варианты получения токена
  let token = null
  
  // Вариант 1: прямой ключ
  token = localStorage.getItem('@auth_token')
  
  // Вариант 2: из auth-storage (Zustand persist)
  if (!token) {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage)
        token = parsed.state?.token
      } catch (e) {
        console.error('Ошибка парсинга auth-storage:', e)
      }
    }
  }
  
  // Вариант 3: из storage (старый вариант)
  if (!token) {
    const storage = localStorage.getItem('storage')
    if (storage) {
      try {
        const parsed = JSON.parse(storage)
        token = parsed.state?.token
      } catch (e) {}
    }
  }
  
  if (token) {
    console.log('Токен найден, добавляем в заголовок')
    config.headers.Authorization = `Bearer ${token}`
  } else {
    console.warn('Токен не найден в localStorage')
  }
  
  return config
})