import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  AdminUserFilters,
  AdminBookFilters,
  AdminAuthorFilters,
  AdminLogFilters,
} from '../types/admin';



type AdminFilters = Record<string, any>;



interface AdminState {

  theme: 'dark' | 'light';

  searchQuery: string;

  // универсальный фильтр для старых компонентов
  filters: AdminFilters;


  // отдельные фильтры для разделов
  usersFilters: Partial<AdminUserFilters>;

  booksFilters: Partial<AdminBookFilters>;

  authorsFilters: Partial<AdminAuthorFilters>;

  logsFilters: Partial<AdminLogFilters>;


  page: number;

  limit: number;


  isLoading: boolean;

  error: string | null;



  setTheme: (
    theme: 'dark' | 'light'
  ) => void;


  toggleTheme: () => void;



  setSearchQuery: (
    query: string
  ) => void;



  setFilters: (
    filters: AdminFilters
  ) => void;


  clearFilters: () => void;



  setUsersFilters: (
    filters: Partial<AdminUserFilters>
  ) => void;


  setBooksFilters: (
    filters: Partial<AdminBookFilters>
  ) => void;


  setAuthorsFilters: (
    filters: Partial<AdminAuthorFilters>
  ) => void;


  setLogsFilters: (
    filters: Partial<AdminLogFilters>
  ) => void;



  setPage: (
    page: number
  ) => void;


  setLimit: (
    limit: number
  ) => void;


  resetPagination: () => void;



  setLoading: (
    isLoading: boolean
  ) => void;


  setError: (
    error: string | null
  ) => void;


  clearError: () => void;



  reset: () => void;
}




const initialState = {

  theme: 'dark' as const,


  searchQuery: '',


  filters: {},


  usersFilters: {},

  booksFilters: {},

  authorsFilters: {},

  logsFilters: {},


  page: 1,

  limit: 20,


  isLoading: false,

  error: null,

};





export const useAdminStore = create<AdminState>()(

  persist(

    (set) => ({

      ...initialState,



      // =========================
      // THEME
      // =========================


      setTheme: (theme) =>
        set({
          theme,
        }),



      toggleTheme: () =>
        set((state) => ({
          theme:
            state.theme === 'dark'
              ? 'light'
              : 'dark',
        })),




      // =========================
      // SEARCH
      // =========================


      setSearchQuery: (
        searchQuery
      ) =>
        set({
          searchQuery,
          page: 1,
        }),





      // =========================
      // FILTERS
      // =========================


      setFilters: (
        filters
      ) =>
        set({
          filters,
          page: 1,
        }),




      setUsersFilters: (
        usersFilters
      ) =>
        set({
          usersFilters,
          filters: usersFilters,
          page: 1,
        }),



      setBooksFilters: (
        booksFilters
      ) =>
        set({
          booksFilters,
          filters: booksFilters,
          page: 1,
        }),



      setAuthorsFilters: (
        authorsFilters
      ) =>
        set({
          authorsFilters,
          filters: authorsFilters,
          page: 1,
        }),



      setLogsFilters: (
        logsFilters
      ) =>
        set({
          logsFilters,
          filters: logsFilters,
          page: 1,
        }),




      clearFilters: () =>
        set({

          filters: {},

          usersFilters: {},

          booksFilters: {},

          authorsFilters: {},

          logsFilters: {},

          searchQuery: '',

          page: 1,

        }),





      // =========================
      // PAGINATION
      // =========================


      setPage: (
        page
      ) =>
        set({
          page,
        }),



      setLimit: (
        limit
      ) =>
        set({
          limit,
          page: 1,
        }),



      resetPagination: () =>
        set({

          page: 1,

          limit: 20,

        }),





      // =========================
      // LOADING
      // =========================


      setLoading: (
        isLoading
      ) =>
        set({
          isLoading,
        }),



      setError: (
        error
      ) =>
        set({
          error,
        }),



      clearError: () =>
        set({
          error: null,
        }),





      // =========================
      // RESET
      // =========================


      reset: () =>
        set(initialState),

    }),



    {

      name: 'syverro-admin-storage',



      partialize: (
        state
      ) => ({

        theme: state.theme,

        filters: state.filters,


        usersFilters: state.usersFilters,

        booksFilters: state.booksFilters,

        authorsFilters: state.authorsFilters,

        logsFilters: state.logsFilters,


        limit: state.limit,

      }),

    }

  )

);







// =========================
// HELPERS
// =========================


export const useAdminPagination = () => {

  const {
    page,
    limit,
    setPage,
    setLimit,
  } = useAdminStore();


  return {

    page,

    limit,

    setPage,

    setLimit,

  };

};





export const useAdminSearch = () => {

  const {
    searchQuery,
    setSearchQuery,
  } = useAdminStore();


  return {

    searchQuery,

    setSearchQuery,

  };

};





export const useAdminFilters = () => {

  const {
    filters,
    setFilters,
    clearFilters,
  } = useAdminStore();


  return {

    filters,

    setFilters,

    clearFilters,

  };

};





export const useAdminLoading = () => {

  const {
    isLoading,
    error,
    setLoading,
    setError,
    clearError,
  } = useAdminStore();


  return {

    isLoading,

    error,

    setLoading,

    setError,

    clearError,

  };

};





export const useAdminTheme = () => {

  const {
    theme,
    setTheme,
    toggleTheme,
  } = useAdminStore();


  return {

    theme,

    setTheme,

    toggleTheme,

  };

};