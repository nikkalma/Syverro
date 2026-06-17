// src/store/authStore.ts
import { create } from 'zustand'

interface AuthState {
  token: string | null
  setToken: (token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('access_token') || null,
  
  setToken: (token) => {
    if (token) {
      localStorage.setItem('access_token', token)
    } else {
      localStorage.removeItem('access_token')
    }
    set({ token })
  },
  
  logout: () => {
    localStorage.removeItem('access_token')
    set({ token: null })
  },
}))