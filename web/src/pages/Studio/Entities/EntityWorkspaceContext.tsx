import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type {
  KnowledgeEntity,
  KnowledgeEntityCreate,
  KnowledgeEntityUpdate,
} from '../../../types/admin';
import { apiClient } from '../../../shared/api/client';

interface EntityWorkspaceContextType {
  entity: KnowledgeEntity | null;
  isNew: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveError: string | null;
  refresh: () => void;
  saveEntity: (data: KnowledgeEntityCreate | KnowledgeEntityUpdate) => Promise<void>;
}

const EntityWorkspaceContext = createContext<EntityWorkspaceContextType>({
  entity: null,
  isNew: false,
  loading: true,
  saving: false,
  error: null,
  saveError: null,
  refresh: () => {},
  saveEntity: async () => {},
});

export function EntityWorkspaceProvider({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [entity, setEntity] = useState<KnowledgeEntity | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchEntity = useCallback(async () => {
    if (isNew || !id) {
      setEntity(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/taxonomy/nodes/${id}`);
      setEntity(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to load entity');
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    fetchEntity();
  }, [fetchEntity]);

  const saveEntity = useCallback(async (data: KnowledgeEntityCreate | KnowledgeEntityUpdate) => {
    setSaving(true);
    setSaveError(null);
    try {
      if (isNew) {
        const res = await apiClient.post('/admin/taxonomy/nodes', data);
        const created = res.data;
        setEntity(created);
        navigate(`/studio/entities/${created.id}/overview`, { replace: true });
      } else if (id) {
        await apiClient.put(`/admin/taxonomy/nodes/${id}`, data);
        const res = await apiClient.get(`/taxonomy/nodes/${id}`);
        setEntity(res.data);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to save';
      setSaveError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  }, [isNew, id, navigate]);

  return (
    <EntityWorkspaceContext.Provider
      value={{ entity, isNew, loading, saving, error, saveError, refresh: fetchEntity, saveEntity }}
    >
      {children}
    </EntityWorkspaceContext.Provider>
  );
}

export function useEntityWorkspace() {
  return useContext(EntityWorkspaceContext);
}
