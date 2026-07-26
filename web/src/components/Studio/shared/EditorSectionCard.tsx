import type { ReactNode } from 'react';

interface Props {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function EditorSectionCard({ title, children, actions }: Props) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border-soft)',
      borderRadius: '12px',
      padding: '24px',
    }}>
      {(title || actions) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          {title && (
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
              {title}
            </h3>
          )}
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
