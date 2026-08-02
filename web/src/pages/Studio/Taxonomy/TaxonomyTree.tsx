import { useState, useMemo } from 'react';
import { Pencil, X, Ban } from 'lucide-react';
import type { TaxonomyNode, TaxonomyNodeType } from '../../../types/admin';
import { TAXONOMY_NODE_COLORS } from '../../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../../locales';


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
  const t = getLocaleData(getBrowserLocale());
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
        background: matchesSearch ? 'var(--primary-soft)' : 'transparent',
      }}
        onMouseEnter={(e) => { if (!matchesSearch) e.currentTarget.style.background = 'var(--surface-hover)'; }}
        onMouseLeave={(e) => { if (!matchesSearch) e.currentTarget.style.background = 'transparent'; }}
      >
        {hasChildren ? (
          <button onClick={() => toggle(node.id)} style={{
            background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
            padding: '2px', fontSize: '12px', lineHeight: 1, width: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}>▶</button>
        ) : <div style={{ width: '20px', flexShrink: 0 }} />}

        {!node.is_active && (
          <span style={{ display: 'inline-flex', color: 'var(--error)' }}><Ban size={12} /></span>
        )}

        <span style={{
          fontSize: '14px', fontWeight: depth === 0 ? '500' : '400',
          color: 'var(--text-primary)', flex: 1, minWidth: 0,
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
          }}>{t.admin.taxonomy.statusDraft}</span>
        )}

        {node.book_count > 0 && (
          <span style={{
            fontSize: '11px', color: 'var(--text-secondary)',
            background: 'var(--chip)',
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
            <button onClick={() => onAddChild(node.id)} title={t.admin.taxonomy.addChild} style={{
              padding: '3px 8px', background: 'none',
              border: '1px solid var(--border)', borderRadius: '4px',
              color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}>+</button>
            <button onClick={() => onEdit(node)} title={t.admin.common.edit} style={{
              padding: '3px 8px', background: 'none',
              border: '1px solid var(--border)', borderRadius: '4px',
              color: 'var(--primary)', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}><Pencil size={14} /></button>
            <button onClick={() => onDelete(node)} title={t.admin.common.delete} style={{
              padding: '3px 8px', background: 'none',
              border: '1px solid var(--error)', borderRadius: '4px',
              color: 'var(--error)', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}><X size={14} /></button>
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
  const t = getLocaleData(getBrowserLocale());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const accentColor = TAXONOMY_NODE_COLORS[nodeType] || 'var(--primary)';

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
    return <div style={{ padding: '20px', color: 'var(--text-secondary)', textAlign: 'center' }}>{t.admin.common.loading}</div>;
  }

  if (error) {
    return (
      <div style={{
        padding: '40px', textAlign: 'center', color: 'var(--error)',
        background: 'var(--glass-bg)', borderRadius: '12px',
        border: '1px solid var(--error)',
      }}>
        <p>{error}</p>
        <button onClick={onRefresh} style={{
          marginTop: '12px', padding: '8px 20px', background: 'var(--primary)',
          border: 'none', borderRadius: '8px', color: '#FFFFFF', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}>{t.admin.common.retry}</button>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div style={{
        padding: '40px', textAlign: 'center', color: 'var(--text-secondary)',
        background: 'var(--glass-bg)', borderRadius: '12px',
        border: '1px solid var(--border)',
      }}>
        <p>{t.admin.taxonomy.noNodes}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={expandAll} style={{
          padding: '6px 12px', background: 'var(--chip)',
          border: '1px solid var(--border)', borderRadius: '6px',
          color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}>{t.admin.taxonomy.expandAll}</button>
        <button onClick={collapseAll} style={{
          padding: '6px 12px', background: 'var(--chip)',
          border: '1px solid var(--border)', borderRadius: '6px',
          color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}>{t.admin.taxonomy.collapseAll}</button>
      </div>
      <div style={{
        background: 'var(--glass-bg)', borderRadius: '12px',
        border: '1px solid var(--border)', padding: '8px 0',
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
