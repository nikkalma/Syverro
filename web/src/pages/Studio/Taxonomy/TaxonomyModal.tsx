import { useState, useEffect } from 'react';
import type { TaxonomyNode, TaxonomyNodeType } from '../../../types/admin';
import { apiClient } from '../../../shared/api/client';

interface TaxonomyModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  node: TaxonomyNode | null;
  nodeType: TaxonomyNodeType;
  onClose: () => void;
  onSave: (data: any) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px', color: '#E6EDF3', fontSize: '14px',
  fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
};

export default function TaxonomyModal({ isOpen, mode, node, nodeType, onClose, onSave }: TaxonomyModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [aliases, setAliases] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [tree, setTree] = useState<TaxonomyNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && node) {
      setName(node.name || '');
      setDescription(node.description || '');
      setParentId(node.parent_id || null);
      setIsActive(node.is_active !== false);
      setIsPublished(node.is_published !== false);
      setAliases((node.aliases || []).join(', '));
      setSortOrder(node.sort_order || 0);
    } else {
      setName('');
      setDescription('');
      setParentId(node?.parent_id || null);
      setIsActive(true);
      setIsPublished(true);
      setAliases('');
      setSortOrder(0);
    }
    setError(null);
  }, [mode, node, isOpen]);

  useEffect(() => {
    apiClient.get(`/admin/taxonomy/tree?node_type=${nodeType}`)
      .then((r) => setTree(r.data || []))
      .catch(() => {});
  }, [nodeType]);

  if (!isOpen) return null;

  const flattenTree = (nodes: TaxonomyNode[], excludeId?: string, depth = 0): TaxonomyNode[] => {
    const result: TaxonomyNode[] = [];
    for (const n of nodes) {
      if (excludeId && n.id === excludeId) continue;
      result.push({ ...n, name: '  '.repeat(depth) + n.name });
      if (n.children?.length) result.push(...flattenTree(n.children, excludeId, depth + 1));
    }
    return result;
  };

  const flatNodes = flattenTree(tree, node?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('Название обязательно');
      onSave({
        name: trimmed,
        description: description.trim() || null,
        parent_id: parentId || null,
        is_active: isActive,
        is_published: isPublished,
        aliases: aliases.split(',').map((a) => a.trim()).filter(Boolean),
        sort_order: sortOrder,
      });
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: '#121C24', borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
        maxWidth: '500px', width: '100%', padding: '32px',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#E6EDF3', fontSize: '22px', fontWeight: '400', margin: 0 }}>
            {mode === 'create' ? '➕ Новый узел' : '✏️ Редактировать узел'}
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#97A6BA',
            fontSize: '24px', cursor: 'pointer', padding: '4px 8px',
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Название *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название узла" required style={inputStyle} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Родительский узел</label>
            <select value={parentId || ''} onChange={(e) => setParentId(e.target.value || null)} style={inputStyle}>
              <option value="">— Нет (корневой) —</option>
              {flatNodes.map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Описание</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Алиасы (через запятую)
            </label>
            <input value={aliases} onChange={(e) => setAliases(e.target.value)}
              placeholder="альтернативное название, синоним" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                Порядок сортировки
              </label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#97A6BA', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Статус</label>
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <label style={{ color: '#E6EDF3', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ accentColor: '#5B86A1' }} />
                  Активен
                </label>
                <label style={{ color: '#E6EDF3', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    style={{ accentColor: '#4CAF50' }} />
                  Опубликован
                </label>
              </div>
            </div>
          </div>

          {error && <div style={{ color: '#EF5350', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '12px', background: '#5B86A1', border: 'none',
              borderRadius: '8px', color: '#0A1118', fontSize: '14px', fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
              fontFamily: 'Inter, sans-serif',
            }}>
              {loading ? 'Сохранение...' : mode === 'create' ? '➕ Создать' : '💾 Сохранить'}
            </button>
            <button type="button" onClick={onClose} style={{
              padding: '12px 24px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
              color: '#97A6BA', fontSize: '14px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}
