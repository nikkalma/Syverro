import { useEffect, useState, useCallback } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import {
  TaxonomyNodeType, TAXONOMY_NODE_TYPES, TAXONOMY_NODE_TYPE_LABELS,
  TAXONOMY_NODE_TYPE_ICONS, TAXONOMY_NODE_COLORS,
} from '../../../types/admin';
import type { TaxonomyNode } from '../../../types/admin';
import TaxonomyTree from './TaxonomyTree';
import TaxonomyModal from './TaxonomyModal';
import { canManageGenres } from '../../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import { apiClient } from '../../../shared/api/client';

export default function AdminTaxonomy() {
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);
  const { isLoading, setLoading, error, setError, clearError } = useAdminStore();

  const [activeType, setActiveType] = useState<TaxonomyNodeType>('genre');
  const [tree, setTree] = useState<TaxonomyNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TaxonomyNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<TaxonomyNode | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser?.role || 'user';
  const canManage = canManageGenres(userRole);

  const countAll = (nodes: TaxonomyNode[]): number => {
    let c = 0;
    for (const n of nodes) { c++; if (n.children?.length) c += countAll(n.children); }
    return c;
  };

  const fetchTree = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      const res = await apiClient.get(`/admin/taxonomy/tree?node_type=${activeType}`);
      setTree(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Ошибка загрузки таксономии');
    } finally {
      setLoading(false);
    }
  }, [activeType, setLoading, setError, clearError]);

  useEffect(() => { setPage(1); fetchTree(); }, [activeType]);

  const { setPage } = useAdminStore();

  const handleCreate = async (data: any) => {
    try {
      await apiClient.post('/admin/taxonomy/nodes', data);
      setIsModalOpen(false);
      setDefaultParentId(null);
      await fetchTree();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Ошибка создания узла');
    }
  };

  const handleUpdate = async (id: string, data: any) => {
    try {
      await apiClient.put(`/admin/taxonomy/nodes/${id}`, data);
      setIsModalOpen(false);
      setDefaultParentId(null);
      await fetchTree();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Ошибка обновления узла');
    }
  };

  const handleDelete = async () => {
    if (!nodeToDelete) return;
    try {
      await apiClient.delete(`/admin/taxonomy/nodes/${nodeToDelete.id}`);
      setIsDeleteModalOpen(false);
      setNodeToDelete(null);
      await fetchTree();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Ошибка удаления узла');
    }
  };

  const handleOpenCreate = (parentId?: string | null) => {
    setSelectedNode(null);
    setDefaultParentId(parentId || null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (node: TaxonomyNode) => {
    setSelectedNode(node);
    setDefaultParentId(null);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenDelete = (node: TaxonomyNode) => {
    setNodeToDelete(node);
    setIsDeleteModalOpen(true);
  };

  const modalNode = modalMode === 'create' && defaultParentId
    ? ({ ...selectedNode, parent_id: defaultParentId, node_type: activeType } as TaxonomyNode)
    : selectedNode;

  const typeColor = TAXONOMY_NODE_COLORS[activeType] || '#5B86A1';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '400', color: '#E6EDF3', margin: 0 }}>
          🏛️ {(t.admin.nav as any).taxonomy || 'Таксономия'}
          <span style={{ fontSize: '14px', color: '#97A6BA', marginLeft: '12px' }}>
            {countAll(tree)} {t.admin.common.records}
          </span>
        </h1>
        {canManage && (
          <button
            onClick={() => handleOpenCreate()}
            style={{
              padding: '10px 20px', background: typeColor, border: 'none',
              borderRadius: '8px', color: '#0A1118', fontSize: '14px', fontWeight: '500',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            + Добавить
          </button>
        )}
      </div>

      {/* Type tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px', flexWrap: 'wrap' }}>
        {TAXONOMY_NODE_TYPES.map((nt) => (
          <button
            key={nt}
            onClick={() => setActiveType(nt)}
            style={{
              padding: '8px 16px',
              background: activeType === nt ? TAXONOMY_NODE_COLORS[nt] : 'transparent',
              border: 'none', borderRadius: '8px 8px 0 0',
              color: activeType === nt ? '#0A1118' : '#97A6BA',
              cursor: 'pointer', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '6px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: activeType === nt ? '500' : '400',
              transition: 'all 0.2s',
            }}
          >
            <span>{TAXONOMY_NODE_TYPE_ICONS[nt]}</span>
            {TAXONOMY_NODE_TYPE_LABELS[nt]}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          placeholder="🔍 Поиск по названию..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1, padding: '10px 16px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', color: '#E6EDF3', fontSize: '14px',
            fontFamily: 'Inter, sans-serif', outline: 'none',
          }}
        />
      </div>

      <TaxonomyTree
        nodes={tree}
        loading={isLoading}
        error={error}
        searchQuery={searchQuery}
        canManage={canManage}
        nodeType={activeType}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        onAddChild={(parentId) => handleOpenCreate(parentId)}
        onRefresh={fetchTree}
      />

      <TaxonomyModal
        isOpen={isModalOpen}
        mode={modalMode}
        node={modalNode}
        nodeType={activeType}
        onClose={() => { setIsModalOpen(false); setSelectedNode(null); setDefaultParentId(null); }}
        onSave={(data) => {
          if (modalMode === 'create') handleCreate({ ...data, node_type: activeType });
          else if (selectedNode) handleUpdate(selectedNode.id, data);
        }}
      />

      {isDeleteModalOpen && nodeToDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setIsDeleteModalOpen(false)}>
          <div style={{
            background: '#121C24', borderRadius: '16px', padding: '32px',
            maxWidth: '400px', width: '100%', border: '1px solid rgba(255,255,255,0.08)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px' }}>⚠️</div>
              <h2 style={{ color: '#E6EDF3', fontSize: '20px', margin: '0 0 8px 0' }}>Удалить узел?</h2>
              <p style={{ color: '#97A6BA', fontSize: '14px' }}>
                <strong style={{ color: '#E6EDF3' }}>{nodeToDelete.name}</strong> будет удалён.
                {nodeToDelete.book_count > 0 && (
                  <span style={{ display: 'block', color: '#D4A76A', fontSize: '13px', marginTop: '4px' }}>
                    Привязано {nodeToDelete.book_count} объектов.
                  </span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleDelete} style={{
                flex: 1, padding: '12px', background: '#EF5350', border: 'none',
                borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: '500',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}>Удалить</button>
              <button onClick={() => setIsDeleteModalOpen(false)} style={{
                flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                color: '#97A6BA', fontSize: '14px', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
