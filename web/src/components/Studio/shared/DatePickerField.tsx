import { useState, useRef, useEffect } from 'react';

function parseDate(value: string): { dd: string; mm: string; yyyy: string } {
  const digits = value.replace(/\D/g, '');
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  return { dd, mm, yyyy };
}

function formatDisplay(dd: string, mm: string, yyyy: string): string {
  const parts: string[] = [];
  if (dd) parts.push(dd);
  if (mm) parts.push(mm);
  if (yyyy) parts.push(yyyy);
  return parts.join('-');
}

function toISO(dd: string, mm: string, yyyy: string): string {
  if (dd.length === 2 && mm.length === 2 && yyyy.length === 4) {
    const d = parseInt(dd, 10);
    const m = parseInt(mm, 10);
    const y = parseInt(yyyy, 10);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1 && y <= 9999) {
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  return '';
}

function fromISO(iso: string): { dd: string; mm: string; yyyy: string } {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return { dd: match[3], mm: match[2], yyyy: match[1] };
  }
  return { dd: '', mm: '', yyyy: '' };
}

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export default function DatePickerField({ label, value, onChange }: DatePickerFieldProps) {
  const { dd: initDd, mm: initMm, yyyy: initYyyy } = value ? fromISO(value) : { dd: '', mm: '', yyyy: '' };
  const [displayValue, setDisplayValue] = useState(() => formatDisplay(initDd, initMm, initYyyy));
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focused && value) {
      const { dd, mm, yyyy } = fromISO(value);
      setDisplayValue(formatDisplay(dd, mm, yyyy));
    } else if (!focused && !value) {
      setDisplayValue('');
    }
  }, [value, focused]);

  const handleChange = (raw: string) => {
    const { dd, mm, yyyy } = parseDate(raw);
    const formatted = formatDisplay(dd, mm, yyyy);
    setDisplayValue(formatted);
    const iso = toISO(dd, mm, yyyy);
    onChange(iso);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize: '14px',
    background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
    borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
    fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
  };

  return (
    <div>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {label}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="DD-MM-YYYY"
        maxLength={10}
        style={inputStyle}
      />
    </div>
  );
}
