import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  onClick?: () => void;
}

export default function StatCard({ label, value, icon, onClick }: StatCardProps) {
  const baseStyle: React.CSSProperties = {
    padding: '20px',
    background: 'var(--surface)',
    borderRadius: '14px',
    border: '1px solid var(--border-soft)',
    transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
    textAlign: 'left',
    fontFamily: 'Inter, sans-serif',
    cursor: onClick ? 'pointer' : 'default',
  };

  const handlers = onClick
    ? {
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.borderColor = 'var(--primary)';
          e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.borderColor = 'var(--border-soft)';
          e.currentTarget.style.boxShadow = 'none';
        },
      }
    : {};

  const inner = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        {icon ? (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            color: 'var(--primary)',
            background: 'var(--primary-soft)',
            border: '1px solid var(--primary)',
            opacity: 0.9,
          }}>
            {icon}
          </span>
        ) : (
          <span />
        )}
        {onClick && <span style={{ color: 'var(--primary)', fontSize: '16px', opacity: 0.5 }}>→</span>}
      </div>
      <div style={{ fontSize: '30px', fontWeight: '300', color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.01em' }}>
        {value}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>{label}</div>
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        style={{ ...baseStyle, color: 'inherit' } as React.CSSProperties}
        {...handlers}
      >
        {inner}
      </button>
    );
  }

  return <div style={baseStyle}>{inner}</div>;
}