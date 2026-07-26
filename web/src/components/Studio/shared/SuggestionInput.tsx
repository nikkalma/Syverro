import { useState, useRef, useEffect } from 'react';

interface SuggestionInputProps {
  label: string;
  values: string[];
  suggestions: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export default function SuggestionInput({ label, values, suggestions, onChange, placeholder }: SuggestionInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = inputValue.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(inputValue.toLowerCase()) && !values.includes(s))
    : suggestions.filter(s => !values.includes(s));

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const addValue = (v: string) => {
    const trimmed = v.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInputValue('');
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const removeValue = (v: string) => {
    onChange(values.filter(item => item !== v));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && filtered[activeIndex]) {
        addValue(filtered[activeIndex]);
      } else if (inputValue.trim()) {
        addValue(inputValue);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
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
                title={`Remove ${v}`}
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
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setIsOpen(true); setActiveIndex(-1); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || `Add ${label.toLowerCase()}...`}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            background: 'var(--input-bg)',
            border: '1px solid var(--border-soft)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
          }}
        />

        {isOpen && filtered.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
            marginTop: '4px',
            background: 'var(--surface)',
            border: '1px solid var(--border-soft)',
            borderRadius: '8px',
            boxShadow: 'var(--glass-shadow)',
            maxHeight: '200px',
            overflowY: 'auto',
          }}>
            {filtered.map((s, i) => (
              <div
                key={s}
                onClick={() => addValue(s)}
                onMouseEnter={() => setActiveIndex(i)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: i === activeIndex ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: i === activeIndex ? 'var(--surface-hover)' : 'transparent',
                  transition: 'background 0.1s',
                }}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
