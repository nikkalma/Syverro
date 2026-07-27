import { useRef } from 'react';
import { formatDate } from '../../../shared/utils/routes';

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export default function DatePickerField({ label, value, onChange }: DatePickerFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const isoValue = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';

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
        type="date"
        value={isoValue}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
      {value && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {formatDate(value)}
        </div>
      )}
    </div>
  );
}
