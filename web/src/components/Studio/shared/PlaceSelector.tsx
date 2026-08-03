import { useState, useRef, useEffect } from 'react';
import { apiClient } from '../../../shared/api/client';
import { getBrowserLocale, getLocaleData } from '../../../locales';
import { resolveEditorialValue } from './editorialValue';
import type { Place, PlaceCreate } from '../../../types/admin';

interface PlaceSelectorProps {
  label: string;
  placeId: string | null | undefined;
  placeName: string | null | undefined;
  onChange: (placeId: string | null, placeName: string | null) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '14px',
  background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--text-muted)', marginBottom: '4px',
};

interface Suggestion {
  id: string | '__new__';
  label: string;
  isNew?: boolean;
}

export default function PlaceSelector({ label, placeId, placeName, onChange }: PlaceSelectorProps) {
  const t = getLocaleData(getBrowserLocale());
  const [query, setQuery] = useState(placeName || '');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setQuery(placeName || '');
  }, [placeName]);

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
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/places', { params: { search: q } });
      const places: Place[] = res.data || [];
      const suggestions: Suggestion[] = places.map((p) => {
        const name = resolveEditorialValue(
          { value: p.name, localizations: (p as Place & { localizations?: Record<string, string> }).localizations },
          getBrowserLocale(),
        );
        return { id: p.id, label: p.country ? `${name}, ${p.country}` : name };
      });
      suggestions.push({ id: '__new__', label: `+ Create "${q}"`, isNew: true });
      setResults(suggestions);
      setIsOpen(true);
      setActiveIndex(-1);
    } catch {
      setResults([{ id: '__new__', label: `+ Create "${q}"`, isNew: true }]);
      setIsOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const createNew = async () => {
    const name = query.trim();
    if (!name) return;
    setLoading(true);
    try {
      const payload: PlaceCreate = { name };
      const res = await apiClient.post('/admin/places', payload);
      const place: Place = res.data;
      setQuery(place.name);
      onChange(place.id, place.name);
    } catch {
      onChange(null, name);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  const handleSelect = async (s: Suggestion) => {
    if (s.id === '__new__') {
      await createNew();
    } else {
      const existing = results.find((r) => r.id === s.id);
      if (existing) {
        setQuery(existing.label);
        onChange(s.id, s.label.split(',')[0]);
        setIsOpen(false);
      }
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

  const clearPlace = () => {
    setQuery('');
    onChange(null, null);
  };

  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div ref={containerRef} style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setIsOpen(true); }}
            onKeyDown={handleKeyDown}
            placeholder={t.admin.studioCleanup.searchOrCreatePlace}
            style={{ ...inputStyle, flex: 1 }}
          />
          {placeId && (
            <button type="button" onClick={clearPlace}
              style={{ padding: '8px', background: 'transparent', border: '1px solid var(--border-soft)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}>
              ×
            </button>
          )}
        </div>
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
        {loading && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: '4px', padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {t.admin.studioCleanup.searching}
          </div>
        )}
      </div>
    </div>
  );
}
