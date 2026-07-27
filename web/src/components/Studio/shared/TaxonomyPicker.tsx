import { useState, useRef, useEffect } from 'react';
import { apiClient } from '../../../shared/api/client';

interface TaxonomyPickerProps {
  nodeType: string;
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '14px',
  background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
};

export default function TaxonomyPicker({ nodeType, value, onChange, placeholder }: TaxonomyPickerProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; existing?: boolean; authorCount?: number }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showConfirm, setShowConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowConfirm(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const search = async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    try {
      const res = await apiClient.get('/taxonomy/nodes', {
        params: { node_type: nodeType, search: q },
      });
      const nodes: { id: string; name: string }[] = res.data || [];
      const normalizedQuery = q.trim().toLowerCase();

      // Filter out already selected values
      const filtered = nodes.filter((n) => !value.includes(n.name));

      // Check if an exact match already exists (case-insensitive)
      const exactMatch = filtered.some((n) => n.name.toLowerCase() === normalizedQuery);

      const result: { id: string; name: string; existing?: boolean; authorCount?: number }[] = filtered.map((n) => ({
        ...n,
        existing: true,
      }));

      if (!exactMatch) {
        result.push({ id: '__new__', name: `+ Create "${q.trim()}"` });
      }

      setSuggestions(result);
      setIsOpen(true);
      setActiveIndex(-1);
    } catch {
      setSuggestions([{ id: '__new__', name: `+ Create "${q.trim()}"` }]);
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, value]);

  const addValue = (name: string) => {
    if (name && !value.includes(name)) {
      onChange([...value, name]);
    }
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const removeValue = (v: string) => {
    onChange(value.filter((item) => item !== v));
  };

  const createAndAdd = async () => {
    const name = query.trim();
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[-\s]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
    try {
      await apiClient.post('/admin/taxonomy/nodes', {
        name,
        slug,
        node_type: nodeType,
      });
    } catch {}
    addValue(name);
    setShowConfirm(false);
  };

  const handleSelect = (s: { id: string; name: string; existing?: boolean }) => {
    if (s.id === '__new__') {
      setShowConfirm(true);
    } else {
      addValue(s.name.replace('✓ ', ''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex]);
      } else if (query.trim()) {
        setShowConfirm(true);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setShowConfirm(false);
    }
  };

  return (
    <div>
      {value.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {value.map((v) => (
            <span key={v} style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', borderRadius: '6px', fontSize: '13px',
              background: 'var(--chip)', color: 'var(--text-primary)',
              border: '1px solid var(--border-soft)',
            }}>
              {v}
              <button
                onClick={() => removeValue(v)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: '14px', padding: '0 2px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div ref={containerRef} style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); setActiveIndex(-1); }}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Search...'}
          style={inputStyle}
        />
        {isOpen && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
            marginTop: '4px', background: 'var(--surface)',
            border: '1px solid var(--border-soft)', borderRadius: '8px',
            boxShadow: 'var(--glass-shadow)', maxHeight: '200px', overflowY: 'auto',
          }}>
            {suggestions.map((s, i) => (
              <div
                key={`${s.id}-${i}`}
                onClick={() => handleSelect(s)}
                onMouseEnter={() => setActiveIndex(i)}
                style={{
                  padding: '8px 12px', cursor: 'pointer', fontSize: '13px',
                  color: i === activeIndex ? 'var(--text-primary)' : s.id === '__new__' ? 'var(--accent)' : 'var(--text-secondary)',
                  background: i === activeIndex ? 'var(--surface-hover)' : 'transparent',
                  borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-soft)' : 'none',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {s.existing && <span style={{ color: '#4CAF50', fontSize: '12px' }}>✓</span>}
                <span style={{ flex: 1 }}>{s.name}</span>
                {s.existing && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>exists</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showConfirm && (
        <div style={{
          marginTop: '8px', padding: '12px', borderRadius: '8px',
          border: '1px solid var(--border-soft)', background: 'var(--surface-hover)',
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-primary)' }}>
            Create new taxonomy entity?
          </p>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Name: <strong>{query.trim()}</strong>
          </p>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Type: <strong>{nodeType}</strong>
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            This entity will become available globally.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowConfirm(false)}
              style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-soft)', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '12px' }}>
              Cancel
            </button>
            <button type="button" onClick={createAndAdd}
              style={{ padding: '6px 12px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
