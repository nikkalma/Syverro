interface FieldProps {
  label: string;
  value?: string | number | null;
}

export default function Field({ label, value }: FieldProps) {
  return (
    <div>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {value ?? '—'}
      </div>
    </div>
  );
}
