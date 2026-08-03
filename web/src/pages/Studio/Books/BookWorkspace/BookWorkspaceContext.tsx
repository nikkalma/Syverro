import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import type {
  AdminBook,
  AdminBookCreate,
  AdminBookUpdate,
} from '../../../../types/admin';
import { apiClient } from '../../../../shared/api/client';
import { bookDetailApi } from '../../../../shared/api/bookDetailApi';
import type { PublicBookDetail } from '../../../../types/bookDetail';

interface BookWorkspaceContextType {
  book: AdminBook | null;
  publicDetail: PublicBookDetail | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveError: string | null;
  refresh: () => void;
  saveBook: (data: AdminBookCreate | AdminBookUpdate) => Promise<void>;
  saveEnrichment: (data: Record<string, unknown>) => Promise<void>;
}

const BookWorkspaceContext = createContext<BookWorkspaceContextType>({
  book: null,
  publicDetail: null,
  loading: true,
  saving: false,
  error: null,
  saveError: null,
  refresh: () => {},
  saveBook: async () => {},
  saveEnrichment: async () => {},
});

export function BookWorkspaceProvider({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<AdminBook | null>(null);
  const [publicDetail, setPublicDetail] = useState<PublicBookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchBook = useCallback(async () => {
    if (!id) {
      setError('Missing book id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [adminResult, publicResult] = await Promise.all([
        apiClient.get(`/admin/books/${id}`),
        bookDetailApi.getById(id).catch(() => null),
      ]);
      setBook(adminResult.data);
      setPublicDetail(publicResult);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to load book');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  const saveBook = useCallback(async (data: AdminBookCreate | AdminBookUpdate) => {
    if (!id) return;
    setSaving(true);
    setSaveError(null);
    try {
      await apiClient.put(`/admin/books/${id}`, data);
      await fetchBook();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to save';
      setSaveError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  }, [id, fetchBook]);

  const saveEnrichment = useCallback(async (data: Record<string, unknown>) => {
    if (!id) return;
    setSaving(true);
    setSaveError(null);
    try {
      await apiClient.put(`/admin/metadata/books/${id}`, data);
      await fetchBook();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to save';
      setSaveError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  }, [id, fetchBook]);

  return (
    <BookWorkspaceContext.Provider
      value={{ book, publicDetail, loading, saving, error, saveError, refresh: fetchBook, saveBook, saveEnrichment }}
    >
      {children}
    </BookWorkspaceContext.Provider>
  );
}

export function useBookWorkspace() {
  return useContext(BookWorkspaceContext);
}
