import { useState, useRef, useCallback, useEffect } from 'react';

interface ChipInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  color?: string;
  suggestions?: string[];
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px', color: '#E6EDF3', fontSize: '14px',
  fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
};

function normalizeStr(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}

export default function ChipInput({ tags, onChange, placeholder, color = '#5B86A1', suggestions = [] }: ChipInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = suggestions
    .filter((s) => normalizeStr(s).toLowerCase() !== normalizeStr(input).toLowerCase())
    .filter((s) => !tags.some((t) => normalizeStr(t).toLowerCase() === normalizeStr(s).toLowerCase()))
    .filter((s) => normalizeStr(s).toLowerCase().includes(normalizeStr(input).toLowerCase()) && input.length > 0);

  const commit = useCallback((raw: string) => {
    const val = normalizeStr(raw);
    if (!val) return;
    const exists = tags.some((t) => normalizeStr(t).toLowerCase() === val.toLowerCase());
    if (exists) return;
    onChange([...tags, val]);
    setInput('');
    setShowSuggestions(false);
  }, [tags, onChange]);

  const removeTag = useCallback((item: string) => {
    onChange(tags.filter((t) => t !== item));
  }, [tags, onChange]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(input); }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div ref={containerRef}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
        {tags.map((t, i) => (
          <span key={`${t}-${i}`} onClick={() => removeTag(t)}
            style={{
              padding: '3px 10px', background: `${color}12`, borderRadius: '12px',
              fontSize: '12px', color, cursor: 'pointer',
              border: `1px solid ${color}25`, display: 'inline-flex', alignItems: 'center', gap: '4px',
            }}>
            {t} <span style={{ marginLeft: '2px' }}>×</span>
          </span>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
            onKeyDown={handleKeyDown}
            onFocus={() => input.length > 0 && setShowSuggestions(true)}
            placeholder={placeholder}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={() => commit(input)}
            style={{
              padding: '8px 12px', background: `${color}20`,
              border: `1px solid ${color}40`, borderRadius: '8px',
              color, cursor: 'pointer', fontSize: '13px',
            }}>
            +
          </button>
        </div>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: '#1A2832', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', marginTop: '4px', maxHeight: '160px',
            overflowY: 'auto', zIndex: 10,
          }}>
            {filteredSuggestions.map((s) => (
              <div key={s} onClick={() => commit(s)} style={{
                padding: '8px 14px', cursor: 'pointer', color: '#E6EDF3', fontSize: '13px',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}