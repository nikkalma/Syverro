import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../../store/adminStore';
import type { KnowledgeEntity } from '../../../types/admin';
import { ENTITY_TYPES } from '../../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import { apiClient } from '../../../shared/api/client';
import { entityTypeLabel } from './entityType';
import { studioPath } from '../../../shared/utils/studioRoutes';

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
  const navigate = useNavigate();
  const { isLoading, setLoading, error, setError, clearError } = useAdminStore();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [entities, setEntities] = useState<KnowledgeEntity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityToDelete, setEntityToDelete] = useState<KnowledgeEntity | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!entityToDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/taxonomy/nodes/${entityToDelete.id}`);
      setEntityToDelete(null);
      await fetchEntities();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete entity');
    } finally {
      setDeleting(false);
    }
  };

  const filterOptions: { key: FilterKey; label: string }[] = [
    { key: 'all', label: t.admin.entities.filters.all },
    { key: 'genre', label: t.admin.entities.filters.genre },
    { key: 'movement', label: t.admin.entities.filters.movement },
    { key: 'place', label: t.admin.entities.filters.place },
    { key: 'timeline', label: t.admin.entities.filters.timeline },
  ];

  const statusBadge = (entity: KnowledgeEntity) => {
    const published = entity.status === 'published';
    return (
      <span style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500',
        background: published ? 'rgba(76,175,80,0.15)' : 'rgba(97,166,161,0.15)',
        color: published ? '#4CAF50' : '#61A6A1',
      }}>
        {published ? t.admin.entities.statusPublished : t.admin.entities.statusDraft}
      </span>
    );
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
          onClick={() => navigate(studioPath('entities/new'))}
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
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <> <Plus size={14} /> {t.admin.entities.newEntity} </>
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

      {isLoading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {t.admin.common.loading}
        </div>
      ) : entities.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          {t.admin.entities.empty}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {entities.map((entity) => (
            <div
              key={entity.id}
              onClick={() => navigate(studioPath(`entities/${entity.id}/overview`))}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-soft)',
                borderRadius: '14px',
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-soft)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ fontWeight: '500', fontSize: '15px', color: 'var(--text-primary)' }}>
                  {entity.name}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setEntityToDelete(entity); }}
                  title={t.admin.entities.delete}
                  style={{
                    background: 'none', border: 'none', color: 'var(--danger, #EF5350)',
                    fontSize: '16px', cursor: 'pointer', padding: '2px 4px', lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
                  fontSize: '12px', fontWeight: '500', color: 'var(--primary)', background: 'var(--primary-soft)',
                }}>
                  {entityTypeLabel(entity.node_type)}
                </span>
                {statusBadge(entity)}
              </div>
              {entity.slug && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/{entity.slug}</div>
              )}
              {entity.description && (
                <div style={{
                  fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {entity.description}
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', marginTop: 'auto' }}>
                <span>{entity.is_sapphire ? `${t.admin.entities.sapphire} ✓` : `${t.admin.entities.sapphire} —`}</span>
                <span>{entity.explorer_visible ? `${t.admin.entities.explorer} ✓` : `${t.admin.entities.explorer} —`}</span>
              </div>
            </div>
          ))}
        </div>
      )}

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
              <button onClick={handleDelete} disabled={deleting} style={{
                flex: 1, padding: '10px', background: 'var(--danger, #EF5350)', border: 'none',
                borderRadius: '8px', color: '#fff', fontSize: '14px', cursor: deleting ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif', opacity: deleting ? 0.6 : 1,
              }}>
                {deleting ? t.admin.common.saving : t.admin.entities.delete}
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
