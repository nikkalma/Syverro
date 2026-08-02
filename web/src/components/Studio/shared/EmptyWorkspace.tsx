import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export default function EmptyWorkspace({ icon, title, description }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '60px 24px',
      textAlign: 'center',
      background: 'var(--surface)',
      border: '1px dashed var(--border-soft)',
      borderRadius: '12px',
    }}>
      {icon && (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          color: 'var(--primary)',
          background: 'var(--primary-soft)',
          border: '1px solid var(--primary)',
          opacity: 0.6,
        }}>
          {icon}
        </span>
      )}
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '400', color: 'var(--text-primary)' }}>{title}</h3>
      {description && (
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', maxWidth: '400px', fontStyle: 'italic' }}>
          {description}
        </p>
      )}
    </div>
  );
}