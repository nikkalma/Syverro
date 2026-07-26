import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import type { AdminAuthor } from '../../../../types/admin';
import { apiClient } from '../../../../shared/api/client';

interface AuthorEditorContextType {
  author: AdminAuthor | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const AuthorEditorContext = createContext<AuthorEditorContextType>({
  author: null,
  loading: true,
  error: null,
  refresh: () => {},
});

export function AuthorEditorProvider({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const [author, setAuthor] = useState<AdminAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchAuthor();
  }, [fetchAuthor]);

  return (
    <AuthorEditorContext.Provider value={{ author, loading, error, refresh: fetchAuthor }}>
      {children}
    </AuthorEditorContext.Provider>
  );
}

export function useAuthorEditor() {
  return useContext(AuthorEditorContext);
}

export const SECTIONS = [
  { path: 'overview', label: 'Overview' },
  { path: 'identity', label: 'Identity' },
  { path: 'biography', label: 'Biography' },
  { path: 'timeline', label: 'Timeline' },
  { path: 'works', label: 'Works' },
  { path: 'quotes', label: 'Quotes' },
  { path: 'graph', label: 'Knowledge Graph' },
  { path: 'media', label: 'Media' },
  { path: 'seo', label: 'SEO' },
] as const;
