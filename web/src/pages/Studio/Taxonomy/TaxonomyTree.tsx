import { useState, useMemo } from 'react';
import type { TaxonomyNode, TaxonomyNodeType } from '../../../types/admin';
import { TAXONOMY_NODE_COLORS } from '../../../types/admin';


interface TaxonomyTreeProps {
  nodes: TaxonomyNode[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  canManage: boolean;
  nodeType: TaxonomyNodeType;
  onEdit: (node: TaxonomyNode) => void;
  onDelete: (node: TaxonomyNode) => void;
  onAddChild: (parentId: string) => void;
  onRefresh: () => void;
}

function TreeNode({
  node, depth, expanded, toggle, searchQuery,
  canManage, onEdit, onDelete, onAddChild, accentColor,
}: {
  node: TaxonomyNode; depth: number; expanded: Set<string>;
  toggle: (id: string) => void; searchQuery: string;
  canManage: boolean; onEdit: (n: TaxonomyNode) => void;
  onDelete: (n: TaxonomyNode) => void; onAddChild: (id: string) => void;
  accentColor: string;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const matchesSearch = searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase());

  const childMatch = useMemo(() => {
    if (!searchQuery || !hasChildren) return false;
    const q = searchQuery.toLowerCase();
    const check = (n: TaxonomyNode): boolean =>
      n.name.toLowerCase().includes(q) || n.children?.some(check);
    return check(node);
  }, [searchQuery, node, hasChildren]);

  if (searchQuery && !matchesSearch && !childMatch) return null;

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 12px', paddingLeft: `${depth * 24 + 12}px`,
        borderRadius: '8px', cursor: 'default', transition: 'background 0.15s',
        background: matchesSearch ? 'rgba(91,134,161,0.1)' : 'transparent',
      }}
        onMouseEnter={(e) => { if (!matchesSearch) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
        onMouseLeave={(e) => { if (!matchesSearch) e.currentTarget.style.background = 'transparent'; }}
      >
        {hasChildren ? (
          <button onClick={() => toggle(node.id)} style={{
            background: 'none', border: 'none', color: '#97A6BA', cursor: 'pointer',
            padding: '2px', fontSize: '12px', lineHeight: 1, width: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}>▶</button>
        ) : <div style={{ width: '20px', flexShrink: 0 }} />}

        {!node.is_active && (
          <span style={{ fontSize: '12px', color: '#EF5350' }}>🚫</span>
        )}

        <span style={{
          fontSize: '14px', fontWeight: depth === 0 ? '500' : '400',
          color: '#E6EDF3', flex: 1, minWidth: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textDecoration: !node.is_active ? 'line-through' : 'none',
          opacity: node.is_published ? 1 : 0.6,
        }}>
          {node.name}
        </span>

        {!node.is_published && (
          <span style={{
            fontSize: '10px', padding: '2px 6px', borderRadius: '6px',
            background: `${accentColor}20`, color: accentColor,
            border: `1px solid ${accentColor}30`,
          }}>Черновик</span>
        )}

        {node.book_count > 0 && (
          <span style={{
            fontSize: '11px', color: '#97A6BA',
            background: 'rgba(255,255,255,0.04)',
            padding: '2px 8px', borderRadius: '10px', flexShrink: 0,
          }}>
            {node.book_count}
          </span>
        )}

        {canManage && (
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0, opacity: 0.6 }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
          >
            <button onClick={() => onAddChild(node.id)} title="Добавить подузел" style={{
              padding: '3px 8px', background: 'none',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px',
              color: '#97A6BA', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}>+</button>
            <button onClick={() => onEdit(node)} style={{
              padding: '3px 8px', background: 'none',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px',
              color: '#5B86A1', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}>✏️</button>
            <button onClick={() => onDelete(node)} style={{
              padding: '3px 8px', background: 'none',
              border: '1px solid rgba(239,83,80,0.2)', borderRadius: '4px',
              color: '#EF5350', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}>✕</button>
          </div>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1}
              expanded={expanded} toggle={toggle} searchQuery={searchQuery}
              canManage={canManage} onEdit={onEdit} onDelete={onDelete}
              onAddChild={onAddChild} accentColor={accentColor} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TaxonomyTree({
  nodes, loading, error, searchQuery, canManage,
  nodeType, onEdit, onDelete, onAddChild, onRefresh,
}: TaxonomyTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const accentColor = TAXONOMY_NODE_COLORS[nodeType] || '#5B86A1';

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    const collect = (ns: TaxonomyNode[]) => {
      for (const n of ns) { if (n.children?.length) { all.add(n.id); collect(n.children); } }
    };
    collect(nodes);
    setExpanded(all);
  };

  const collapseAll = () => setExpanded(new Set());

  if (loading) {
    return <div style={{ padding: '20px', color: '#97A6BA', textAlign: 'center' }}>Загрузка...</div>;
  }

  if (error) {
    return (
      <div style={{
        padding: '40px', textAlign: 'center', color: '#EF5350',
        background: 'rgba(18, 28, 36, 0.6)', borderRadius: '12px',
        border: '1px solid rgba(239,83,80,0.2)',
      }}>
        <p>{error}</p>
        <button onClick={onRefresh} style={{
          marginTop: '12px', padding: '8px 20px', background: '#5B86A1',
          border: 'none', borderRadius: '8px', color: '#0A1118', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}>Повторить</button>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div style={{
        padding: '40px', textAlign: 'center', color: '#97A6BA',
        background: 'rgba(18, 28, 36, 0.6)', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <p>Узлы не найдены</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={expandAll} style={{
          padding: '6px 12px', background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
          color: '#97A6BA', fontSize: '12px', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}>Развернуть всё</button>
        <button onClick={collapseAll} style={{
          padding: '6px 12px', background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
          color: '#97A6BA', fontSize: '12px', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}>Свернуть всё</button>
      </div>
      <div style={{
        background: 'rgba(18, 28, 36, 0.5)', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)', padding: '8px 0',
      }}>
        {nodes.map((node) => (
          <TreeNode key={node.id} node={node} depth={0}
            expanded={expanded} toggle={toggle} searchQuery={searchQuery}
            canManage={canManage} onEdit={onEdit} onDelete={onDelete}
            onAddChild={onAddChild} accentColor={accentColor} />
        ))}
      </div>
    </div>
  );
}
