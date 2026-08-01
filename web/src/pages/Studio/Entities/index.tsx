import { useEffect, useState, useCallback } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import type { KnowledgeEntity } from '../../../types/admin';
import { ENTITY_TYPES } from '../../../types/admin';
import EntityModal from './EntityModal';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import { apiClient } from '../../../shared/api/client';

type FilterKey = 'all' | 'genre' | 'movement' | 'place' | 'timeline';

const TYPE_TO_FILTER: Record<string, FilterKey> = {
  genre: 'genre',
  literary_direction: 'movement',
  place: 'place',
  timeline_event: 'timeline',
};

export default function StudioEntities() {
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);
  const { isLoading, setLoading, error, setError, clearError } = useAdminStore();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [entities, setEntities] = useState<KnowledgeEntity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedEntity, setSelectedEntity] = useState<KnowledgeEntity | null>(null);
  const [entityToDelete, setEntityToDelete] = useState<KnowledgeEntity | null>(null);

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('entity_type', ENTITY_TYPES.find((et) => TYPE_TO_FILTER[et] === filter) || 'genre');
      }
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      const res = await apiClient.get(`/admin/entities?${params.toString()}`);
      setEntities(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load entities');
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery, setLoading, setError, clearError]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const handleSave = async (data: any) => {
    try {
      if (modalMode === 'create') {
        await apiClient.post('/admin/taxonomy/nodes', data);
      } else if (selectedEntity) {
        await apiClient.put(`/admin/taxonomy/nodes/${selectedEntity.id}`, data);
      }
      setIsModalOpen(false);
      setSelectedEntity(null);
      await fetchEntities();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to save entity');
    }
  };

  const handleDelete = async () => {
    if (!entityToDelete) return;
    try {
      await apiClient.delete(`/admin/taxonomy/nodes/${entityToDelete.id}`);
      setEntityToDelete(null);
      await fetchEntities();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete entity');
    }
  };

  const openCreate = () => {
    setSelectedEntity(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const openEdit = (entity: KnowledgeEntity) => {
    setSelectedEntity(entity);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const filterOptions: { key: FilterKey; label: string }[] = [
    { key: 'all', label: t.admin.entities.filters.all },
    { key: 'genre', label: t.admin.entities.filters.genre },
    { key: 'movement', label: t.admin.entities.filters.movement },
    { key: 'place', label: t.admin.entities.filters.place },
    { key: 'timeline', label: t.admin.entities.filters.timeline },
  ];

  const typeLabel = (nodeType: string) => {
    const key = TYPE_TO_FILTER[nodeType];
    if (key === 'movement') return t.admin.entities.entityTypes.literary_direction;
    if (key === 'place') return t.admin.entities.entityTypes.place;
    if (key === 'timeline') return t.admin.entities.entityTypes.timeline_event;
    return t.admin.entities.entityTypes.genre;
  };

  return (
    <div style={{
      padding: '32px 40px',
      maxWidth: '1200px',
      margin: '0 auto',
      color: 'var(--text-primary)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '400', margin: '0 0 8px', color: 'var(--text-primary)' }}>
            {t.admin.entities.title}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
            {t.admin.entities.subtitle}
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '10px 20px',
            background: 'var(--primary)',
            border: 'none',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          ➕ {t.admin.entities.create}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${filter === opt.key ? 'var(--primary)' : 'var(--border-soft)'}`,
              background: filter === opt.key ? 'var(--primary)' : 'var(--surface)',
              color: filter === opt.key ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            {opt.label}
          </button>
        ))}
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.admin.entities.searchPlaceholder}
          style={{
            marginLeft: 'auto',
            padding: '8px 14px',
            background: 'var(--surface)',
            border: '1px solid var(--border-soft)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            outline: 'none',
            width: '220px',
            fontFamily: 'Inter, sans-serif',
          }}
        />
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px',
          border: '1px solid var(--danger, #EF5350)',
          color: 'var(--danger, #EF5350)',
          fontSize: '13px', marginBottom: '16px',
          background: 'var(--surface)',
        }}>
          {error}
        </div>
      )}

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-soft)',
        borderRadius: '14px',
        overflow: 'hidden',
      }}>
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t.admin.common.loading}
          </div>
        ) : entities.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            {t.admin.entities.empty}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-soft)', textAlign: 'left' }}>
                {['name', 'type', 'status', 'sapphire', 'explorer'].map((col) => (
                  <th key={col} style={{
                    padding: '12px 20px',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    {col === 'name' ? t.admin.entities.name
                      : col === 'type' ? t.admin.entities.type
                      : col === 'status' ? t.admin.entities.status
                      : col === 'sapphire' ? t.admin.entities.sapphire
                      : t.admin.entities.explorer}
                  </th>
                ))}
                <th style={{ padding: '12px 20px', width: '120px' }}></th>
              </tr>
            </thead>
            <tbody>
              {entities.map((entity) => (
                <tr key={entity.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '12px 20px', color: 'var(--text-primary)' }}>
                    <div style={{ fontWeight: '500' }}>{entity.name}</div>
                    {entity.slug && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/{entity.slug}</div>}
                    {entity.description && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {entity.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {typeLabel(entity.node_type)}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: entity.status === 'published'
                        ? 'rgba(76,175,80,0.15)'
                        : 'rgba(97,166,161,0.15)',
                      color: entity.status === 'published' ? '#4CAF50' : '#61A6A1',
                    }}>
                      {entity.status === 'published' ? t.admin.entities.statusPublished : t.admin.entities.statusDraft}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>
                    {entity.is_sapphire ? '✓' : '—'}
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>
                    {entity.explorer_visible ? '✓' : '—'}
                  </td>
                  <td style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => openEdit(entity)}
                      style={{
                        background: 'none', border: '1px solid var(--border-soft)',
                        borderRadius: '6px', padding: '4px 12px',
                        color: 'var(--text-secondary)', fontSize: '12px',
                        cursor: 'pointer', marginRight: '8px', fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {t.admin.entities.edit}
                    </button>
                    <button
                      onClick={() => setEntityToDelete(entity)}
                      style={{
                        background: 'none', border: '1px solid var(--border-soft)',
                        borderRadius: '6px', padding: '4px 12px',
                        color: 'var(--danger, #EF5350)', fontSize: '12px',
                        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {t.admin.entities.delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <EntityModal
        isOpen={isModalOpen}
        mode={modalMode}
        entity={selectedEntity}
        defaultType="genre"
        t={t}
        onClose={() => { setIsModalOpen(false); setSelectedEntity(null); }}
        onSave={handleSave}
      />

      {entityToDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px',
        }} onClick={() => setEntityToDelete(null)}>
          <div style={{
            background: 'var(--surface)', borderRadius: '16px',
            border: '1px solid var(--border-soft)',
            maxWidth: '420px', width: '100%', padding: '28px',
            color: 'var(--text-primary)',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 12px', color: 'var(--text-primary)' }}>
              {t.admin.entities.confirmDelete}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 20px' }}>
              «{entityToDelete.name}»
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleDelete} style={{
                flex: 1, padding: '10px', background: 'var(--danger, #EF5350)', border: 'none',
                borderRadius: '8px', color: '#fff', fontSize: '14px', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}>
                {t.admin.entities.delete}
              </button>
              <button onClick={() => setEntityToDelete(null)} style={{
                padding: '10px 24px', background: 'transparent',
                border: '1px solid var(--border-soft)', borderRadius: '8px',
                color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}>
                {t.admin.entities.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
