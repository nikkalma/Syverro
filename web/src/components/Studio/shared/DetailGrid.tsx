import type { ReactNode } from 'react';

interface DetailGridProps {
  children: ReactNode;
  columns?: 2 | 3;
}

export default function DetailGrid({ children, columns = 2 }: DetailGridProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '16px',
    }}>
      {children}
    </div>
  );
}
