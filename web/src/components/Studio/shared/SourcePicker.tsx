import { useState, useRef, useEffect } from 'react';
import { apiClient } from '../../../shared/api/client';
import type { Source, SourceCreate } from '../../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../../locales';

interface SourcePickerProps {
  label: string;
  sourceId: string | null | undefined;
  onChange: (sourceId: string | null) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '14px',
  background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
};

export default function SourcePicker({ label, sourceId, onChange }: SourcePickerProps) {
  const t = getLocaleData(getBrowserLocale());
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; label: string; isNew?: boolean }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [sourceTitle, setSourceTitle] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (sourceId) {
      const fetchTitle = async () => {
        try {
          const res = await apiClient.get('/admin/sources');
          const found = (res.data || []).find((s: Source) => s.id === sourceId);
          if (found) setSourceTitle(found.title);
        } catch {}
      };
      fetchTitle();
    }
  }, [sourceId]);

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
      setResults([]);
      setIsOpen(false);
      return;
    }
    try {
      const res = await apiClient.get('/admin/sources');
      const sources: Source[] = res.data || [];
      const filtered: ({ id: string; label: string; isNew?: boolean })[] = sources
        .filter((s) => s.title.toLowerCase().includes(q.toLowerCase()))
        .map((s) => ({ id: s.id, label: s.title }));
      filtered.push({ id: '__new__', label: `+ ${t.admin.studioCleanup.create} "${q}"`, isNew: true });
      setResults(filtered);
      setIsOpen(true);
      setActiveIndex(-1);
    } catch {
      setResults([{ id: '__new__', label: `+ ${t.admin.studioCleanup.create} "${query}"`, isNew: true }]);
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const createNew = async () => {
    const title = query.trim();
    if (!title) return;
    try {
      const payload: SourceCreate = { title, source_type: 'other' };
      const res = await apiClient.post('/admin/sources', payload);
      onChange(res.data.id);
      setSourceTitle(title);
    } catch {
      onChange(null);
    }
    setQuery('');
    setIsOpen(false);
  };

  const handleSelect = async (s: { id: string; label: string; isNew?: boolean }) => {
    if (s.id === '__new__') {
      await createNew();
    } else {
      onChange(s.id);
      setSourceTitle(s.label);
      setQuery('');
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        handleSelect(results[activeIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearSource = () => {
    onChange(null);
    setSourceTitle('');
  };

  return (
    <div>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {label}
      </div>
      {sourceId && sourceTitle ? (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>{sourceTitle}</span>
          <button type="button" onClick={clearSource}
            style={{ padding: '4px 8px', background: 'transparent', border: '1px solid var(--border-soft)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>
            ×
          </button>
        </div>
      ) : (
        <div ref={containerRef} style={{ position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setIsOpen(true); }}
            onKeyDown={handleKeyDown}
            placeholder={t.admin.studioCleanup.searchOrCreateSource}
            style={inputStyle}
          />
          {isOpen && results.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
              marginTop: '4px', background: 'var(--surface)',
              border: '1px solid var(--border-soft)', borderRadius: '8px',
              boxShadow: 'var(--glass-shadow)', maxHeight: '200px', overflowY: 'auto',
            }}>
              {results.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  onMouseEnter={() => setActiveIndex(i)}
                  style={{
                    padding: '8px 12px', cursor: 'pointer', fontSize: '13px',
                    color: i === activeIndex ? 'var(--text-primary)' : s.isNew ? 'var(--accent)' : 'var(--text-secondary)',
                    background: i === activeIndex ? 'var(--surface-hover)' : 'transparent',
                    borderBottom: i < results.length - 1 ? '1px solid var(--border-soft)' : 'none',
                  }}
                >
                  {s.label}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
