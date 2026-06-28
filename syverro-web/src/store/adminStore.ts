// src/store/adminStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdminRole } from '../types/admin';

// ============================================================
// СОСТОЯНИЕ АДМИНКИ
// ============================================================

interface AdminState {
  // ===== ТЕМА =====
  theme: 'dark' | 'light';

  // ===== ПОИСК И ФИЛЬТРЫ =====
  searchQuery: string;
  filters: Record<string, any>;

  // ===== ПАГИНАЦИЯ =====
  page: number;
  limit: number;

  // ===== ЗАГРУЗКА =====
  isLoading: boolean;
  error: string | null;

  // ===== ДЕЙСТВИЯ =====
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;

  setSearchQuery: (query: string) => void;
  setFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;

  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  resetPagination: () => void;

  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // ===== РЕСЕТ =====
  reset: () => void;
}

// ============================================================
// НАЧАЛЬНОЕ СОСТОЯНИЕ
// ============================================================

const initialState = {
  theme: 'dark' as const,
  searchQuery: '',
  filters: {},
  page: 1,
  limit: 20,
  isLoading: false,
  error: null,
};

// ============================================================
// STORE
// ============================================================

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ===== ТЕМА =====
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'dark' ? 'light' : 'dark' 
      })),

      // ===== ПОИСК И ФИЛЬТРЫ =====
      setSearchQuery: (searchQuery) => set({ searchQuery, page: 1 }),
      setFilters: (filters) => set({ filters, page: 1 }),
      clearFilters: () => set({ filters: {}, searchQuery: '', page: 1 }),

      // ===== ПАГИНАЦИЯ =====
      setPage: (page) => set({ page }),
      setLimit: (limit) => set({ limit, page: 1 }),
      resetPagination: () => set({ page: 1, limit: 20 }),

      // ===== ЗАГРУЗКА =====
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // ===== РЕСЕТ =====
      reset: () => set(initialState),
    }),
    {
      name: 'syverro-admin-storage',
      partialize: (state) => ({
        theme: state.theme,
        filters: state.filters,
        limit: state.limit,
      }),
    }
  )
);

// ============================================================
// ХЕЛПЕРЫ ДЛЯ КОМПОНЕНТОВ
// ============================================================

export const useAdminPagination = () => {
  const { page, limit, setPage, setLimit } = useAdminStore();
  return { page, limit, setPage, setLimit };
};

export const useAdminSearch = () => {
  const { searchQuery, setSearchQuery } = useAdminStore();
  return { searchQuery, setSearchQuery };
};

export const useAdminFilters = () => {
  const { filters, setFilters, clearFilters } = useAdminStore();
  return { filters, setFilters, clearFilters };
};

export const useAdminLoading = () => {
  const { isLoading, error, setLoading, setError, clearError } = useAdminStore();
  return { isLoading, error, setLoading, setError, clearError };
};

export const useAdminTheme = () => {
  const { theme, setTheme, toggleTheme } = useAdminStore();
  return { theme, setTheme, toggleTheme };
};