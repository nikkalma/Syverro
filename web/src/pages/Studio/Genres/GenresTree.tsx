// src/pages/Admin/Genres/GenresTree.tsx

import { useState, useMemo } from 'react';
import { AdminGenre } from '../../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import type { LocaleData } from '../../../locales';

interface GenreTreeNode {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  parent_id: string | null;
  book_count: number;
  children: GenreTreeNode[];
  created_at?: string;
}

const GENRE_TYPE_COLORS: Record<string, string> = {
  literary: '#5B86A1',
  non_fiction: '#6B9B7A',
  spiritual: '#A855F7',
  cultural: '#D4A76A',
  practical: '#97A6BA',
};

const GENRE_TYPE_ICONS: Record<string, string> = {
  literary: '📖',
  non_fiction: '📘',
  spiritual: '🔮',
  cultural: '🏛',
  practical: '🔧',
};

interface GenresTreeProps {
  tree: GenreTreeNode[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  canManage: boolean;
  onEdit: (genre: AdminGenre) => void;
  onDelete: (genre: AdminGenre) => void;
  onAddChild: (parentId: string) => void;
  onRefresh: () => void;
}

function TreeNode({
  node,
  depth,
  expanded,
  toggle,
  searchQuery,
  canManage,
  onEdit,
  onDelete,
  onAddChild,
  t,
}: {
  node: GenreTreeNode;
  depth: number;
  expanded: Set<string>;
  toggle: (id: string) => void;
  searchQuery: string;
  canManage: boolean;
  onEdit: (g: AdminGenre) => void;
  onDelete: (g: AdminGenre) => void;
  onAddChild: (parentId: string) => void;
  t: LocaleData;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const matchesSearch = searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase());

  const childMatch = useMemo(() => {
    if (!searchQuery || !hasChildren) return false;
    const q = searchQuery.toLowerCase();
    const check = (n: GenreTreeNode): boolean =>
      n.name.toLowerCase().includes(q) || n.children?.some(check);
    return check(node);
  }, [searchQuery, node, hasChildren]);

  if (searchQuery && !matchesSearch && !childMatch) return null;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          paddingLeft: `${depth * 24 + 12}px`,
          borderRadius: '8px',
          cursor: 'default',
          transition: 'background 0.15s',
          background: matchesSearch ? 'rgba(91,134,161,0.1)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!matchesSearch) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        }}
        onMouseLeave={(e) => {
          if (!matchesSearch) e.currentTarget.style.background = 'transparent';
        }}
      >
        {/* Expand/collapse chevron */}
        {hasChildren ? (
          <button
            onClick={() => toggle(node.id)}
            style={{
              background: 'none',
              border: 'none',
              color: '#97A6BA',
              cursor: 'pointer',
              padding: '2px',
              fontSize: '12px',
              lineHeight: 1,
              width: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'transform 0.2s',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          >
            ▶
          </button>
        ) : (
          <div style={{ width: '20px', flexShrink: 0 }} />
        )}

        {/* Genre name */}
        <span style={{
          fontSize: '14px',
          fontWeight: depth === 0 ? '500' : '400',
          color: '#E6EDF3',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {node.name}
        </span>

        {/* Book count */}
        {node.book_count > 0 && (
          <span style={{
            fontSize: '11px',
            color: '#97A6BA',
            background: 'rgba(255,255,255,0.04)',
            padding: '2px 8px',
            borderRadius: '10px',
            flexShrink: 0,
          }}>
            {node.book_count} {t.admin.common.booksCount}
          </span>
        )}

        {/* Action buttons */}
        {canManage && (
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0, opacity: 0.6, transition: 'opacity 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
          >
            <button
              onClick={() => onAddChild(node.id)}
              title={t.admin.genres.addSubgenre}
              style={{
                padding: '3px 8px',
                background: 'none',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '4px',
                color: '#97A6BA',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              +
            </button>
            <button
              onClick={() => onEdit({
                id: node.id,
                name: node.name,
                slug: node.slug,
                type: node.type,
                description: node.description,
                parent_id: node.parent_id,
                book_count: node.book_count,
                children_count: node.children?.length || 0,
                created_at: node.created_at || new Date().toISOString(),
                updated_at: '',
              } as AdminGenre)}
              style={{
                padding: '3px 8px',
                background: 'none',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '4px',
                color: '#5B86A1',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              ✏
            </button>
            <button
              onClick={() => onDelete({
                id: node.id,
                name: node.name,
                slug: node.slug,
                type: node.type,
                description: node.description,
                parent_id: node.parent_id,
                book_count: node.book_count,
                children_count: node.children?.length || 0,
                created_at: node.created_at || new Date().toISOString(),
                updated_at: '',
              } as AdminGenre)}
              style={{
                padding: '3px 8px',
                background: 'none',
                border: '1px solid rgba(239,83,80,0.2)',
                borderRadius: '4px',
                color: '#EF5350',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              toggle={toggle}
              searchQuery={searchQuery}
              canManage={canManage}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GenresTree({
  tree,
  loading,
  error,
  searchQuery,
  canManage,
  onEdit,
  onDelete,
  onAddChild,
  onRefresh,
}: GenresTreeProps) {
  const t = getLocaleData(getBrowserLocale());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['literary', 'non_fiction', 'spiritual', 'cultural', 'practical']));

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleType = (type: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    const collect = (nodes: GenreTreeNode[]) => {
      for (const n of nodes) {
        if (n.children?.length) {
          all.add(n.id);
          collect(n.children);
        }
      }
    };
    collect(tree);
    setExpanded(all);
  };

  const collapseAll = () => setExpanded(new Set());

  if (loading) {
    return (
      <div style={{ padding: '20px', color: '#97A6BA', textAlign: 'center' }}>
        {t.admin.genres.loadingTree}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#EF5350',
        background: 'rgba(18, 28, 36, 0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(239,83,80,0.2)',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠</div>
        <p>{error}</p>
        <button
          onClick={onRefresh}
          style={{
            marginTop: '12px',
            padding: '8px 20px',
            background: '#5B86A1',
            border: 'none',
            borderRadius: '8px',
            color: '#0A1118',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {t.admin.common.retry}
        </button>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#97A6BA',
        background: 'rgba(18, 28, 36, 0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏷</div>
        <p>{t.admin.genres.noGenres}</p>
      </div>
    );
  }

  // Group genres by type
  const byType = new Map<string, GenreTreeNode[]>();
  for (const node of tree) {
    const type = node.type || 'literary';
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(node);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Expand/collapse controls */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={expandAll}
          style={{
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px',
            color: '#97A6BA',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {t.admin.genres.expandAll}
        </button>
        <button
          onClick={collapseAll}
          style={{
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px',
            color: '#97A6BA',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {t.admin.genres.collapseAll}
        </button>
      </div>

      {/* Tree by type */}
      {Array.from(byType.entries()).map(([type, genres]) => {
        const color = GENRE_TYPE_COLORS[type] || '#97A6BA';
        const isTypeExpanded = expandedTypes.has(type);
        const totalCount = (() => {
          let c = 0;
          const count = (nodes: GenreTreeNode[]) => {
            for (const n of nodes) {
              c++;
              if (n.children?.length) count(n.children);
            }
          };
          count(genres);
          return c;
        })();

        return (
          <div key={type} style={{
            background: 'rgba(18, 28, 36, 0.5)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
            {/* Type header */}
            <div
              onClick={() => toggleType(type)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 16px',
                cursor: 'pointer',
                borderBottom: isTypeExpanded ? '1px solid rgba(255,255,255,0.06)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{
                fontSize: '12px',
                color: '#97A6BA',
                transform: isTypeExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                display: 'inline-block',
              }}>
                ▶
              </span>
              <span style={{ fontSize: '16px' }}>{GENRE_TYPE_ICONS[type] || '🏷'}</span>
              <span style={{
                fontSize: '15px',
                fontWeight: '500',
                color,
              }}>
                {t.admin.genreTypes[type as keyof typeof t.admin.genreTypes] || type}
              </span>
              <span style={{
                fontSize: '12px',
                color: '#97A6BA',
                background: 'rgba(255,255,255,0.04)',
                padding: '2px 8px',
                borderRadius: '10px',
              }}>
                {totalCount}
              </span>
            </div>

            {/* Type content */}
            {isTypeExpanded && (
              <div style={{ padding: '4px 0' }}>
                {genres.map((node) => (
                  <TreeNode
                    key={node.id}
                    node={node}
                    depth={0}
                    expanded={expanded}
                    toggle={toggle}
                    searchQuery={searchQuery}
                    canManage={canManage}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAddChild={onAddChild}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
