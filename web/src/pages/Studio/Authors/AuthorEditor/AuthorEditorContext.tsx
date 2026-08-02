import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import type { AdminAuthor, AdminAuthorUpdate } from '../../../../types/admin';
import { apiClient } from '../../../../shared/api/client';

interface AuthorEditorContextType {
  author: AdminAuthor | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveError: string | null;
  refresh: () => void;
  updateAuthor: (data: AdminAuthorUpdate) => Promise<void>;
}

const AuthorEditorContext = createContext<AuthorEditorContextType>({
  author: null,
  loading: true,
  saving: false,
  error: null,
  saveError: null,
  refresh: () => {},
  updateAuthor: async () => {},
});

export function AuthorEditorProvider({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const [author, setAuthor] = useState<AdminAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchAuthor = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/admin/authors/${id}`);
      setAuthor(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to load author');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const updateAuthor = useCallback(async (data: AdminAuthorUpdate) => {
    if (!id) return;
    setSaving(true);
    setSaveError(null);
    try {
      await apiClient.put(`/admin/authors/${id}`, data);
      const res = await apiClient.get(`/admin/authors/${id}`);
      setAuthor(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to save';
      setSaveError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAuthor();
  }, [fetchAuthor]);

  return (
    <AuthorEditorContext.Provider value={{ author, loading, saving, error, saveError, refresh: fetchAuthor, updateAuthor }}>
      {children}
    </AuthorEditorContext.Provider>
  );
}

export function useAuthorEditor() {
  return useContext(AuthorEditorContext);
}

export const SECTION_PATHS = [
  'overview', 'identity', 'timeline', 'works',
  'quotes', 'media', 'sources', 'publications',
] as const;
