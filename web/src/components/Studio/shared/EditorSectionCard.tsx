import type { ReactNode } from 'react';

interface Props {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function EditorSectionCard({ title, description, children, actions }: Props) {
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
          alignItems: 'flex-start',
          marginBottom: '16px',
        }}>
          <div>
            {title && (
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
                {title}
              </h3>
            )}
            {description && (
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {description}
              </p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
