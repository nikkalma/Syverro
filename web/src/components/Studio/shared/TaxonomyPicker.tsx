import { useState, useRef, useEffect } from 'react';
import { apiClient } from '../../../shared/api/client';
import { getLocaleData, getBrowserLocale } from '../../../locales';

interface TaxonomyPickerProps {
  label: string;
  nodeType: string;
  values: string[];
  onChange: (values: string[]) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '14px',
  background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
};

export default function TaxonomyPicker({ label, nodeType, values, onChange }: TaxonomyPickerProps) {
  const _t = getLocaleData(getBrowserLocale());
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; isNew?: boolean }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
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
      const filtered: ({ id: string; name: string; isNew?: boolean })[] = nodes.filter((n) => !values.includes(n.name));
      filtered.push({ id: '__new__', name: `+ Create "${q}"`, isNew: true });
      setSuggestions(filtered);
      setIsOpen(true);
      setActiveIndex(-1);
    } catch {
      setSuggestions([{ id: '__new__', name: `+ Create "${q}"`, isNew: true }]);
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, values]);

  const addValue = (v: string) => {
    if (v && !values.includes(v)) {
      onChange([...values, v]);
    }
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const removeValue = (v: string) => {
    onChange(values.filter((item) => item !== v));
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
  };

  const handleSelect = (s: { id: string; name: string; isNew?: boolean }) => {
    if (s.isNew) {
      createAndAdd();
    } else {
      addValue(s.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex]);
      } else if (query.trim()) {
        createAndAdd();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
        {label}
      </div>
      {values.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {values.map((v) => (
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
          placeholder={`${_t.admin.authors.editor.add}...`}
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
                  color: i === activeIndex ? 'var(--text-primary)' : s.isNew ? 'var(--accent)' : 'var(--text-secondary)',
                  background: i === activeIndex ? 'var(--surface-hover)' : 'transparent',
                  borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-soft)' : 'none',
                }}
              >
                {s.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
